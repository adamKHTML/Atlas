<?php

namespace App\Controller\API;

use App\Entity\User;
use App\Entity\Message;
use App\Entity\Notification;
use App\Entity\Ban;
use App\Entity\Reaction;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Core\Exception\InvalidCsrfTokenException;
use Psr\Log\LoggerInterface;

#[Route('/api')]
class ProfileController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $passwordHasher;
    private LoggerInterface $logger;
    private ?CsrfTokenManagerInterface $csrfTokenManager;

    public function __construct(
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        LoggerInterface $logger,
        ?CsrfTokenManagerInterface $csrfTokenManager = null
    ) {
        $this->entityManager = $entityManager;
        $this->passwordHasher = $passwordHasher;
        $this->logger = $logger;
        $this->csrfTokenManager = $csrfTokenManager;
    }

    /**
     * GET /api/profile - Récupérer les informations du profil utilisateur
     */
    #[Route('/profile', name: 'api_get_profile', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getProfile(): JsonResponse
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                $response = new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
                $this->addSecurityHeaders($response);
                return $response;
            }

            $response = new JsonResponse([
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
                    'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
                    'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null,
                    'is_verified' => $user->isVerified(),
                    'created_at' => $user->getId() // Simulation de date de création
                ]
            ]);

            $this->addSecurityHeaders($response);
            return $response;

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération du profil', [
                'error' => $e->getMessage()
            ]);
            $response = new JsonResponse([
                'error' => 'Erreur lors de la récupération du profil'
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        }
    }

    /**
     * PUT /api/profile - Mettre à jour les informations du profil
     */
    #[Route('/profile', name: 'api_update_profile', methods: ['PUT', 'POST'])]
    #[IsGranted('ROLE_USER')]
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                $response = new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Traitement FormData
            $data = $request->request->all();
            $profilePicture = $request->files->get('profile_picture');

            $this->logger->debug('Données reçues pour mise à jour profil', [
                'user_id' => $user->getId(),
                'fields' => array_keys($data),
                'has_file' => $profilePicture !== null
            ]);

            // Validation des données avec sécurité renforcée
            $errors = [];

            // Validation email avec protection XSS
            if (isset($data['email'])) {
                $email = trim(strip_tags($data['email']));
                if (empty($email)) {
                    $errors[] = 'L\'email ne peut pas être vide';
                } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = 'Format d\'email invalide';
                } elseif (strlen($email) > 255) {
                    $errors[] = 'L\'email ne peut pas dépasser 255 caractères';
                }
            }

            // Validation pseudo avec sécurité
            if (isset($data['pseudo'])) {
                $pseudo = trim(strip_tags($data['pseudo']));
                if (empty($pseudo)) {
                    $errors[] = 'Le pseudo ne peut pas être vide';
                } elseif (strlen($pseudo) < 3) {
                    $errors[] = 'Le pseudo doit faire au moins 3 caractères';
                } elseif (strlen($pseudo) > 50) {
                    $errors[] = 'Le pseudo ne peut pas dépasser 50 caractères';
                } elseif (!preg_match('/^[a-zA-Z0-9_-]+$/', $pseudo)) {
                    $errors[] = 'Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores';
                }
            }

            // Validation prénom avec protection XSS
            if (isset($data['firstname'])) {
                $firstname = trim(strip_tags($data['firstname']));
                if (empty($firstname)) {
                    $errors[] = 'Le prénom ne peut pas être vide';
                } elseif (strlen($firstname) < 2) {
                    $errors[] = 'Le prénom doit faire au moins 2 caractères';
                } elseif (strlen($firstname) > 100) {
                    $errors[] = 'Le prénom ne peut pas dépasser 100 caractères';
                } elseif (!preg_match('/^[a-zA-ZÀ-ÿ\s\'-]+$/u', $firstname)) {
                    $errors[] = 'Le prénom contient des caractères non autorisés';
                }
            }

            // Validation nom avec protection XSS
            if (isset($data['lastname'])) {
                $lastname = trim(strip_tags($data['lastname']));
                if (empty($lastname)) {
                    $errors[] = 'Le nom ne peut pas être vide';
                } elseif (strlen($lastname) < 2) {
                    $errors[] = 'Le nom doit faire au moins 2 caractères';
                } elseif (strlen($lastname) > 100) {
                    $errors[] = 'Le nom ne peut pas dépasser 100 caractères';
                } elseif (!preg_match('/^[a-zA-ZÀ-ÿ\s\'-]+$/u', $lastname)) {
                    $errors[] = 'Le nom contient des caractères non autorisés';
                }
            }

            // Validation de la photo de profil avec sécurité renforcée
            if ($profilePicture) {
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                $maxSize = 5 * 1024 * 1024; // 5MB
                
                if (!in_array($profilePicture->getMimeType(), $allowedTypes)) {
                    $errors[] = 'Format d\'image non autorisé. Utilisez JPG, PNG, GIF ou WebP';
                }
                
                if ($profilePicture->getSize() > $maxSize) {
                    $errors[] = 'La taille de l\'image ne peut pas dépasser 5MB';
                }
                
                if ($profilePicture->getError() !== UPLOAD_ERR_OK) {
                    $errors[] = 'Erreur lors de l\'upload de l\'image';
                }
            }

            // Vérifier l'unicité de l'email si modifié
            if (isset($data['email']) && trim(strip_tags($data['email'])) !== $user->getEmail()) {
                $existingUser = $this->entityManager->getRepository(User::class)
                    ->findOneBy(['email' => trim(strip_tags($data['email']))]);
                
                if ($existingUser) {
                    $errors[] = 'Cette adresse email est déjà utilisée par un autre utilisateur';
                }
            }

            // Vérifier l'unicité du pseudo si modifié
            if (isset($data['pseudo']) && trim(strip_tags($data['pseudo'])) !== $user->getPseudo()) {
                $existingUser = $this->entityManager->getRepository(User::class)
                    ->findOneBy(['pseudo' => trim(strip_tags($data['pseudo']))]);
                
                if ($existingUser) {
                    $errors[] = 'Ce pseudo est déjà utilisé par un autre utilisateur';
                }
            }

            if (!empty($errors)) {
                $response = new JsonResponse(['errors' => $errors], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Mise à jour des champs avec sécurité
            if (isset($data['firstname'])) {
                $user->setFirstname(trim(strip_tags($data['firstname'])));
            }

            if (isset($data['lastname'])) {
                $user->setLastname(trim(strip_tags($data['lastname'])));
            }

            if (isset($data['pseudo'])) {
                $user->setPseudo(trim(strip_tags($data['pseudo'])));
            }

            if (isset($data['email'])) {
                $user->setEmail(trim(strip_tags($data['email'])));
            }

            // Gestion sécurisée de la photo de profil
            if ($profilePicture) {
                // Supprimer l'ancienne photo si elle existe avec vérification sécurisée du chemin
                if ($user->getProfilePicture()) {
                    $oldImagePath = $this->getParameter('kernel.project_dir') . 
                        '/public' . $user->getProfilePicture();
                    // Protection contre path traversal
                    if (file_exists($oldImagePath) && is_file($oldImagePath) && 
                        strpos(realpath($oldImagePath), realpath($this->getParameter('kernel.project_dir') . '/public')) === 0) {
                        unlink($oldImagePath);
                    }
                }

                // Sauvegarder la nouvelle photo
                $destination = $this->getParameter('kernel.project_dir') . '/public/uploads/avatars';
                if (!file_exists($destination) && !mkdir($destination, 0777, true)) {
                    throw new \RuntimeException('Impossible de créer le dossier uploads/avatars');
                }

                $filename = uniqid() . '.' . $profilePicture->guessExtension();
                $profilePicture->move($destination, $filename);
                $user->setProfilePicture('/uploads/avatars/' . $filename);
            }

            $this->entityManager->flush();

            $this->logger->info('Profil mis à jour avec succès', [
                'user_id' => $user->getId()
            ]);

            $response = new JsonResponse([
                'message' => 'Profil mis à jour avec succès',
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
                    'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
                    'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
                    'email' => $user->getEmail(),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null
                ]
            ]);

            $this->addSecurityHeaders($response);
            return $response;

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la mise à jour du profil', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            $response = new JsonResponse([
                'error' => 'Erreur lors de la mise à jour du profil'
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        }
    }

    /**
     * PUT /api/profile/password - Changer le mot de passe
     */
    #[Route('/profile/password', name: 'api_change_password', methods: ['PUT', 'POST'])]
    #[IsGranted('ROLE_USER')]
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            
            // Validation JSON sécurisée
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $response = new JsonResponse(['error' => 'Données JSON invalides'], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            if (!$user) {
                $response = new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Validation des données avec sécurité renforcée
            if (!isset($data['current_password'], $data['new_password'], $data['confirm_password'])) {
                $response = new JsonResponse([
                    'error' => 'Tous les champs sont requis : mot de passe actuel, nouveau mot de passe et confirmation'
                ], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            $currentPassword = trim($data['current_password']);
            $newPassword = $data['new_password'];
            $confirmPassword = $data['confirm_password'];

            // Validation des mots de passe
            $errors = [];

            if (empty($currentPassword) || !is_string($currentPassword)) {
                $errors[] = 'Le mot de passe actuel est requis';
            }

            if (empty($newPassword) || !is_string($newPassword)) {
                $errors[] = 'Le nouveau mot de passe est requis';
            } elseif (strlen($newPassword) < 8) {
                $errors[] = 'Le nouveau mot de passe doit faire au moins 8 caractères';
            } elseif (strlen($newPassword) > 255) {
                $errors[] = 'Le nouveau mot de passe ne peut pas dépasser 255 caractères';
            } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', $newPassword)) {
                $errors[] = 'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
            }

            if (empty($confirmPassword)) {
                $errors[] = 'La confirmation du mot de passe est requise';
            }

            if (!empty($newPassword) && !empty($confirmPassword) && $newPassword !== $confirmPassword) {
                $errors[] = 'Les nouveaux mots de passe ne correspondent pas';
            }

            if ($currentPassword === $newPassword) {
                $errors[] = 'Le nouveau mot de passe doit être différent de l\'ancien';
            }

            if (!empty($errors)) {
                $response = new JsonResponse(['errors' => $errors], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Vérifier le mot de passe actuel
            if (!$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
                $this->logger->warning('Change password attempt with wrong current password', [
                    'user_id' => $user->getId(),
                    'ip' => $request->getClientIp(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                $response = new JsonResponse(['error' => 'Le mot de passe actuel est incorrect'], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Mettre à jour le mot de passe
            $user->setPassword($this->passwordHasher->hashPassword($user, $newPassword));
            $this->entityManager->flush();

            $this->logger->info('Mot de passe changé avec succès', [
                'user_id' => $user->getId(),
                'ip' => $request->getClientIp(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);

            $response = new JsonResponse(['message' => 'Mot de passe changé avec succès']);
            $this->addSecurityHeaders($response);
            return $response;

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors du changement de mot de passe', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            $response = new JsonResponse([
                'error' => 'Erreur lors du changement de mot de passe'
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        }
    }

    /**
     * 🔒 DELETE /api/profile - Supprimer le compte utilisateur (VERSION COMPLÈTE AVEC GESTION SESSION)
     */
    #[Route('/profile', name: 'api_delete_profile', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function deleteProfile(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                $response = new JsonResponse(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // 🔒 Validation JSON sécurisée
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $response = new JsonResponse(['error' => 'Données JSON invalides'], Response::HTTP_BAD_REQUEST);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // 🔒 Vérification CSRF pour suppression de compte (optionnel)
            if (isset($data['_token']) && $this->csrfTokenManager) {
                if (!$this->isCsrfTokenValid('delete_account', $data['_token'])) {
                    $this->logger->warning('CSRF token invalid on account deletion', [
                        'user_id' => $user->getId(),
                        'ip' => $request->getClientIp(),
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                    throw new InvalidCsrfTokenException('Token CSRF invalide');
                }
            }

            // 🔒 Validation password obligatoire et sécurisée
            if (empty($data['password']) || !is_string($data['password'])) {
                $this->logger->warning('Delete attempt without password', [
                    'user_id' => $user->getId(),
                    'ip' => $request->getClientIp()
                ]);
                $response = new JsonResponse(['error' => 'Le mot de passe est requis pour confirmer la suppression du compte'], Response::HTTP_BAD_REQUEST);
                $this->addSecurityHeaders($response);
                return $response;
            }

            $password = trim($data['password']);

            // 🔒 Vérification password
            if (!$this->passwordHasher->isPasswordValid($user, $password)) {
                $this->logger->warning('Delete attempt with wrong password', [
                    'user_id' => $user->getId(),
                    'ip' => $request->getClientIp(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                $response = new JsonResponse([
                    'error' => 'Mot de passe incorrect. Veuillez vérifier votre mot de passe.'
                ], Response::HTTP_UNAUTHORIZED);
                $this->addSecurityHeaders($response);
                return $response;
            }

            $userId = $user->getId();
            $userEmail = $user->getEmail();

            // 🔥 DÉBUT DE LA SUPPRESSION FORCÉE AVEC GESTION DE SESSION
            $this->logger->info('Début de la suppression forcée du compte', [
                'user_id' => $userId,
                'email' => $userEmail,
                'ip' => $request->getClientIp(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);

            // 🔒 1. INVALIDER LA SESSION IMMÉDIATEMENT
            $session = $request->getSession();
            $sessionInvalidated = false;
            if ($session && $session->isStarted()) {
                try {
                    // Sauvegarder les données importantes avant invalidation
                    $sessionId = $session->getId();
                    
                    // Nettoyer toutes les données de session
                    $session->clear();
                    
                    // Invalider complètement la session
                    $session->invalidate();
                    
                    $sessionInvalidated = true;
                    $this->logger->debug('Session invalidée avec succès', [
                        'user_id' => $userId,
                        'session_id' => $sessionId
                    ]);
                } catch (\Exception $e) {
                    $this->logger->warning('Erreur lors de l\'invalidation de session', [
                        'user_id' => $userId,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // 🔒 2. Suppression sécurisée de la photo de profil
            if ($user->getProfilePicture()) {
                $imagePath = $this->getParameter('kernel.project_dir') . 
                    '/public' . $user->getProfilePicture();
                // 🔒 Vérification sécurisée du chemin (protection contre path traversal)
                if (file_exists($imagePath) && is_file($imagePath) && 
                    strpos(realpath($imagePath), realpath($this->getParameter('kernel.project_dir') . '/public')) === 0) {
                    unlink($imagePath);
                    $this->logger->debug('Photo de profil supprimée', ['path' => $imagePath]);
                }
            }

            // 3. Nettoyer les sessions orphelines en base (si stockées en DB)
            $this->cleanupOrphanedSessions($userId);

            // 4. Supprimer les réactions de l'utilisateur
            $reactions = $this->entityManager->getRepository(Reaction::class)
                ->findBy(['user' => $user]);
            
            foreach ($reactions as $reaction) {
                $this->entityManager->remove($reaction);
            }
            $this->logger->debug('Réactions supprimées', ['count' => count($reactions)]);

            // 5. Supprimer les notifications de l'utilisateur
            $notifications = $this->entityManager->getRepository(Notification::class)
                ->findBy(['user' => $user]);
            
            foreach ($notifications as $notification) {
                $this->entityManager->remove($notification);
            }
            $this->logger->debug('Notifications supprimées', ['count' => count($notifications)]);

            // 6. Supprimer l'historique de bannissements
            $bans = $this->entityManager->getRepository(Ban::class)
                ->findBy(['user' => $user]);
            
            foreach ($bans as $ban) {
                $this->entityManager->remove($ban);
            }
            $this->logger->debug('Bans supprimés', ['count' => count($bans)]);

            // 7. Anonymiser les messages de l'utilisateur (plutôt que les supprimer)
            $messages = $this->entityManager->getRepository(Message::class)
                ->findBy(['user' => $user]);
            
            foreach ($messages as $message) {
                // Anonymiser plutôt que supprimer pour préserver l'intégrité des discussions
                $message->setUser(null); // Met le user_id à NULL
                $message->setContent('[Message supprimé - Utilisateur supprimé]');
                $this->entityManager->persist($message);
            }
            $this->logger->debug('Messages anonymisés', ['count' => count($messages)]);

            // 8. Forcer l'exécution des suppressions avant de supprimer l'utilisateur
            $this->entityManager->flush();

            // 9. 🔥 SUPPRIMER L'UTILISATEUR
            $this->entityManager->remove($user);
            $this->entityManager->flush();

            $this->logger->info('Compte utilisateur supprimé avec succès', [
                'user_id' => $userId,
                'email' => $userEmail,
                'ip' => $request->getClientIp(),
                'session_invalidated' => $sessionInvalidated,
                'reactions_deleted' => count($reactions),
                'notifications_deleted' => count($notifications),
                'bans_deleted' => count($bans),
                'messages_anonymized' => count($messages),
                'timestamp' => date('Y-m-d H:i:s')
            ]);

            // 🔥 RÉPONSE SPÉCIALE POUR INDIQUER QUE LA SESSION EST TERMINÉE
            $response = new JsonResponse([
                'message' => 'Compte supprimé avec succès',
                'session_ended' => true, // Flag pour indiquer au frontend que la session est terminée
                'user_deleted' => true,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            // 🔥 Headers spéciaux pour indiquer la fin de session
            $response->headers->set('X-Session-Ended', 'true');
            $response->headers->set('X-Account-Deleted', 'true');
            $response->headers->set('X-User-Id-Deleted', (string)$userId);
            
            // 🔒 Headers de sécurité renforcés pour suppression
            $this->addSecurityHeaders($response, true);
            
            return $response;

        } catch (\Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException $e) {
            $this->logger->error('Erreur de contrainte de clé étrangère lors de la suppression', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            $response = new JsonResponse([
                'error' => 'Impossible de supprimer le compte en raison de données liées. Contactez l\'administrateur.'
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la suppression du compte', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $this->getUser()?->getId()
            ]);
            $response = new JsonResponse([
                'error' => 'Erreur lors de la suppression du compte',
                'debug' => $e->getMessage() // Temporaire pour debug, à retirer en production
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        }
    }

    /**
     * 🔒 Méthode privée pour nettoyer les sessions orphelines
     */
    private function cleanupOrphanedSessions(int $userId): void
    {
        try {
            // Si vous utilisez doctrine/doctrine-bundle avec sessions en base de données
            // Vous pouvez adapter cette requête selon votre configuration
            
            // Exemple pour des sessions stockées en base via PdoSessionHandler
            $connection = $this->entityManager->getConnection();
            
            // Nettoyer les sessions liées à cet utilisateur (adaptez selon votre schéma)
            $sql = "DELETE FROM sessions WHERE sess_data LIKE :userId";
            $stmt = $connection->prepare($sql);
            $stmt->executeStatement(['userId' => '%user_id";i:' . $userId . ';%']);
            
            $this->logger->debug('Sessions orphelines nettoyées en base', [
                'user_id' => $userId,
                'affected_rows' => $stmt->rowCount()
            ]);
            
        } catch (\Exception $e) {
            // Ne pas faire échouer la suppression si le nettoyage des sessions échoue
            $this->logger->warning('Impossible de nettoyer les sessions orphelines', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * 🔒 Méthode privée pour ajouter les headers de sécurité
     * @param JsonResponse $response
     * @param bool $isAccountDeletion Sécurité renforcée pour suppression de compte
     */
    private function addSecurityHeaders(JsonResponse $response, bool $isAccountDeletion = false): void
    {
        // Headers de sécurité standards
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Content-Security-Policy', "default-src 'self'");
        
        // 🔒 Désactiver complètement la mise en cache
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
        
        // 🔒 Headers spéciaux pour suppression de compte
        if ($isAccountDeletion) {
            $response->headers->set('X-Require-Fresh-Auth', 'true');
            $response->headers->set('X-Clear-All-Caches', 'true');
            $response->headers->set('Clear-Site-Data', '"cache", "cookies", "storage"');
        }
    }
}