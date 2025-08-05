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
                    'created_at' => $user->getId()
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
     * 🔥 NOUVEAU : PUT /api/profile/info - Mettre à jour les infos texte uniquement
     */
    #[Route('/profile/info', name: 'api_update_profile_info', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function updateProfileInfo(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                $response = new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // 🔥 TRAITEMENT JSON (comme changePassword)
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $response = new JsonResponse(['error' => 'Données JSON invalides'], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            $this->logger->debug('🔥 UpdateProfileInfo - Données reçues', [
                'data' => $data,
                'user_id' => $user->getId()
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

            // 🔥 MISE À JOUR DES CHAMPS avec sécurité
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

            $this->entityManager->flush();

            $this->logger->info('🔥 Informations profil mises à jour avec succès', [
                'user_id' => $user->getId()
            ]);

            $response = new JsonResponse([
                'message' => 'Informations mises à jour avec succès',
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
                    'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
                    'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                    'isVerified' => $user->isVerified(),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null
                ]
            ]);

            $this->addSecurityHeaders($response);
            return $response;

        } catch (\Exception $e) {
            $this->logger->error('🔥 Erreur lors de la mise à jour des infos profil', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            $response = new JsonResponse([
                'error' => 'Erreur lors de la mise à jour des informations'
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        }
    }

  /**
     * 🔥 POST /api/profile/picture - Mettre à jour la photo uniquement
     */
    #[Route('/profile/picture', name: 'api_update_profile_picture', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function updateProfilePicture(Request $request): JsonResponse
    {
        $this->logger->debug('📷 Requête upload', [
    'content_type' => $request->headers->get('Content-Type'),
    'has_file' => $request->files->has('profile_picture'),
    'all_files' => array_keys($request->files->all()),
]);
        try {
            $user = $this->getUser();

            if (!$user) {
                $response = new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
                $this->addSecurityHeaders($response);
                return $response;
            }

            $profilePicture = $request->files->get('profile_picture');

            $this->logger->debug('🔥 UpdateProfilePicture - Requête reçue', [
                'user_id' => $user->getId(),
                'has_file' => $profilePicture !== null,
                'content_type' => $request->headers->get('Content-Type'),
                'method' => $request->getMethod()
            ]);

            if (!$profilePicture) {
                $this->logger->warning('🔥 Aucune image fournie', [
                    'user_id' => $user->getId(),
                    'files' => array_keys($request->files->all()),
                    'post_data' => array_keys($request->request->all())
                ]);
                $response = new JsonResponse(['error' => 'Aucune image fournie'], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Validation de la photo de profil avec sécurité renforcée
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            $maxSize = 5 * 1024 * 1024; // 5MB
            $errors = [];

            $this->logger->debug('🔥 Validation image', [
                'mime_type' => $profilePicture->getMimeType(),
                'size' => $profilePicture->getSize(),
                'error' => $profilePicture->getError(),
                'original_name' => $profilePicture->getClientOriginalName()
            ]);
            
            if (!in_array($profilePicture->getMimeType(), $allowedTypes)) {
                $errors[] = 'Format d\'image non autorisé. Utilisez JPG, PNG, GIF ou WebP';
            }
            
            if ($profilePicture->getSize() > $maxSize) {
                $errors[] = 'La taille de l\'image ne peut pas dépasser 5MB';
            }
            
            if ($profilePicture->getError() !== UPLOAD_ERR_OK) {
                $errors[] = 'Erreur lors de l\'upload de l\'image (code: ' . $profilePicture->getError() . ')';
            }

            if (!empty($errors)) {
                $this->logger->warning('🔥 Erreurs de validation image', [
                    'errors' => $errors,
                    'user_id' => $user->getId()
                ]);
                $response = new JsonResponse(['errors' => $errors], 400);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Supprimer l'ancienne photo si elle existe avec vérification sécurisée du chemin
            if ($user->getProfilePicture()) {
                $oldImagePath = $this->getParameter('kernel.project_dir') . 
                    '/public' . $user->getProfilePicture();
                
                $this->logger->debug('🔥 Suppression ancienne photo', [
                    'old_path' => $oldImagePath,
                    'exists' => file_exists($oldImagePath)
                ]);
                
                // Protection contre path traversal
                if (file_exists($oldImagePath) && is_file($oldImagePath) && 
                    strpos(realpath($oldImagePath), realpath($this->getParameter('kernel.project_dir') . '/public')) === 0) {
                    unlink($oldImagePath);
                    $this->logger->debug('🔥 Ancienne photo supprimée', ['path' => $oldImagePath]);
                }
            }

            // Sauvegarder la nouvelle photo
            $destination = $this->getParameter('kernel.project_dir') . '/public/uploads/avatars';
            if (!file_exists($destination)) {
                if (!mkdir($destination, 0777, true)) {
                    throw new \RuntimeException('Impossible de créer le dossier uploads/avatars');
                }
                $this->logger->debug('🔥 Dossier avatars créé', ['path' => $destination]);
            }

            $filename = uniqid() . '.' . $profilePicture->guessExtension();
            $profilePicture->move($destination, $filename);
            $user->setProfilePicture('/uploads/avatars/' . $filename);

            $this->logger->debug('🔥 Nouvelle photo sauvegardée', [
                'filename' => $filename,
                'destination' => $destination,
                'full_path' => $destination . '/' . $filename
            ]);

            $this->entityManager->flush();

            $this->logger->info('🔥 Photo de profil mise à jour avec succès', [
                'user_id' => $user->getId(),
                'filename' => $filename,
                'old_picture' => $user->getProfilePicture()
            ]);

            $response = new JsonResponse([
                'message' => 'Photo de profil mise à jour avec succès',
                'profile_picture' => 'http://localhost:8000' . $user->getProfilePicture(),
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
                    'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
                    'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                    'isVerified' => $user->isVerified(),
                    'profile_picture' => 'http://localhost:8000' . $user->getProfilePicture()
                ]
            ]);

            $this->addSecurityHeaders($response);
            return $response;

        } catch (\Exception $e) {
            $this->logger->error('🔥 Erreur lors de la mise à jour de la photo', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $this->getUser()?->getId()
            ]);
            $response = new JsonResponse([
                'error' => 'Erreur lors de la mise à jour de la photo: ' . $e->getMessage()
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        }
    }

    /**
     * PUT /api/profile/password - Changer le mot de passe
     */
    #[Route('/profile/password', name: 'api_change_password', methods: ['PUT'])]
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
     * DELETE /api/profile - Supprimer le compte utilisateur
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

            // Validation JSON sécurisée
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $response = new JsonResponse(['error' => 'Données JSON invalides'], Response::HTTP_BAD_REQUEST);
                $this->addSecurityHeaders($response);
                return $response;
            }

            // Validation password obligatoire et sécurisée
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

            // Vérification password
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

            // DÉBUT DE LA SUPPRESSION
            $this->logger->info('Début de la suppression du compte', [
                'user_id' => $userId,
                'email' => $userEmail,
                'ip' => $request->getClientIp(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);

            // Invalider la session
            $session = $request->getSession();
            $sessionInvalidated = false;
            if ($session && $session->isStarted()) {
                try {
                    $session->clear();
                    $session->invalidate();
                    $sessionInvalidated = true;
                } catch (\Exception $e) {
                    $this->logger->warning('Erreur lors de l\'invalidation de session', [
                        'user_id' => $userId,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Supprimer la photo de profil
            if ($user->getProfilePicture()) {
                $imagePath = $this->getParameter('kernel.project_dir') . 
                    '/public' . $user->getProfilePicture();
                if (file_exists($imagePath) && is_file($imagePath) && 
                    strpos(realpath($imagePath), realpath($this->getParameter('kernel.project_dir') . '/public')) === 0) {
                    unlink($imagePath);
                }
            }

            // Supprimer les réactions
            $reactions = $this->entityManager->getRepository(Reaction::class)
                ->findBy(['user' => $user]);
            foreach ($reactions as $reaction) {
                $this->entityManager->remove($reaction);
            }

            // Supprimer les notifications
            $notifications = $this->entityManager->getRepository(Notification::class)
                ->findBy(['user' => $user]);
            foreach ($notifications as $notification) {
                $this->entityManager->remove($notification);
            }

            // Supprimer les bans
            $bans = $this->entityManager->getRepository(Ban::class)
                ->findBy(['user' => $user]);
            foreach ($bans as $ban) {
                $this->entityManager->remove($ban);
            }

            // Anonymiser les messages
            $messages = $this->entityManager->getRepository(Message::class)
                ->findBy(['user' => $user]);
            foreach ($messages as $message) {
                $message->setUser(null);
                $message->setContent('[Message supprimé - Utilisateur supprimé]');
                $this->entityManager->persist($message);
            }

            // Forcer l'exécution
            $this->entityManager->flush();

            // Supprimer l'utilisateur
            $this->entityManager->remove($user);
            $this->entityManager->flush();

            $this->logger->info('Compte utilisateur supprimé avec succès', [
                'user_id' => $userId,
                'email' => $userEmail,
                'ip' => $request->getClientIp(),
                'session_invalidated' => $sessionInvalidated,
                'timestamp' => date('Y-m-d H:i:s')
            ]);

            $response = new JsonResponse([
                'message' => 'Compte supprimé avec succès',
                'session_ended' => true,
                'user_deleted' => true,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            $response->headers->set('X-Session-Ended', 'true');
            $response->headers->set('X-Account-Deleted', 'true');
            $response->headers->set('X-User-Id-Deleted', (string)$userId);
            
            $this->addSecurityHeaders($response, true);
            
            return $response;

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la suppression du compte', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            $response = new JsonResponse([
                'error' => 'Erreur lors de la suppression du compte'
            ], 500);
            $this->addSecurityHeaders($response);
            return $response;
        }
    }

    /**
     * Méthode privée pour ajouter les headers de sécurité
     */
    private function addSecurityHeaders(JsonResponse $response, bool $isAccountDeletion = false): void
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Content-Security-Policy', "default-src 'self'");
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
        
        if ($isAccountDeletion) {
            $response->headers->set('X-Require-Fresh-Auth', 'true');
            $response->headers->set('X-Clear-All-Caches', 'true');
            $response->headers->set('Clear-Site-Data', '"cache", "cookies", "storage"');
        }
    }
}