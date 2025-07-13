<?php

namespace App\Controller\API;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Psr\Log\LoggerInterface;

#[Route('/api')]
class ProfileController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $passwordHasher;
    private LoggerInterface $logger;

    public function __construct(
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        LoggerInterface $logger
    ) {
        $this->entityManager = $entityManager;
        $this->passwordHasher = $passwordHasher;
        $this->logger = $logger;
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
                return new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
            }

            return new JsonResponse([
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'pseudo' => $user->getPseudo(),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null,
                    'is_verified' => $user->isVerified(),
                    'created_at' => $user->getId() // Simulation de date de création
                ]
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération du profil', [
                'error' => $e->getMessage()
            ]);
            return new JsonResponse([
                'error' => 'Erreur lors de la récupération du profil'
            ], 500);
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
                return new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
            }

            // Traitement FormData
            $data = $request->request->all();
            $profilePicture = $request->files->get('profile_picture');

            $this->logger->debug('Données reçues pour mise à jour profil', [
                'user_id' => $user->getId(),
                'fields' => array_keys($data),
                'has_file' => $profilePicture !== null
            ]);

            // Validation des données
            $errors = [];

            // Validation email
            if (isset($data['email'])) {
                $email = trim($data['email']);
                if (empty($email)) {
                    $errors[] = 'L\'email ne peut pas être vide';
                } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = 'Format d\'email invalide';
                } elseif (strlen($email) > 255) {
                    $errors[] = 'L\'email ne peut pas dépasser 255 caractères';
                }
            }

            // Validation pseudo
            if (isset($data['pseudo'])) {
                $pseudo = trim($data['pseudo']);
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

            // Validation prénom
            if (isset($data['firstname'])) {
                $firstname = trim($data['firstname']);
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

            // Validation nom
            if (isset($data['lastname'])) {
                $lastname = trim($data['lastname']);
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

            // Validation de la photo de profil
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
            if (isset($data['email']) && trim($data['email']) !== $user->getEmail()) {
                $existingUser = $this->entityManager->getRepository(User::class)
                    ->findOneBy(['email' => trim($data['email'])]);
                
                if ($existingUser) {
                    $errors[] = 'Cette adresse email est déjà utilisée par un autre utilisateur';
                }
            }

            // Vérifier l'unicité du pseudo si modifié
            if (isset($data['pseudo']) && trim($data['pseudo']) !== $user->getPseudo()) {
                $existingUser = $this->entityManager->getRepository(User::class)
                    ->findOneBy(['pseudo' => trim($data['pseudo'])]);
                
                if ($existingUser) {
                    $errors[] = 'Ce pseudo est déjà utilisé par un autre utilisateur';
                }
            }

            if (!empty($errors)) {
                return new JsonResponse(['errors' => $errors], 400);
            }

            // Mise à jour des champs
            if (isset($data['firstname'])) {
                $user->setFirstname(trim($data['firstname']));
            }

            if (isset($data['lastname'])) {
                $user->setLastname(trim($data['lastname']));
            }

            if (isset($data['pseudo'])) {
                $user->setPseudo(trim($data['pseudo']));
            }

            if (isset($data['email'])) {
                $user->setEmail(trim($data['email']));
            }

            // Gestion de la photo de profil
            if ($profilePicture) {
                // Supprimer l'ancienne photo si elle existe
                if ($user->getProfilePicture()) {
                    $oldImagePath = $this->getParameter('kernel.project_dir') . 
                        '/public' . $user->getProfilePicture();
                    if (file_exists($oldImagePath)) {
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

            return new JsonResponse([
                'message' => 'Profil mis à jour avec succès',
                'user' => [
                    'id' => $user->getId(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'pseudo' => $user->getPseudo(),
                    'email' => $user->getEmail(),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null
                ]
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la mise à jour du profil', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            return new JsonResponse([
                'error' => 'Erreur lors de la mise à jour du profil'
            ], 500);
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
            $data = json_decode($request->getContent(), true);

            if (!$user) {
                return new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
            }

            // Validation des données
            if (!isset($data['current_password'], $data['new_password'], $data['confirm_password'])) {
                return new JsonResponse([
                    'error' => 'Tous les champs sont requis : mot de passe actuel, nouveau mot de passe et confirmation'
                ], 400);
            }

            $currentPassword = trim($data['current_password']);
            $newPassword = $data['new_password'];
            $confirmPassword = $data['confirm_password'];

            // Validation des mots de passe
            $errors = [];

            if (empty($currentPassword)) {
                $errors[] = 'Le mot de passe actuel est requis';
            }

            if (empty($newPassword)) {
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
                return new JsonResponse(['errors' => $errors], 400);
            }

            // Vérifier le mot de passe actuel
            if (!$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
                return new JsonResponse(['error' => 'Le mot de passe actuel est incorrect'], 400);
            }

            // Mettre à jour le mot de passe
            $user->setPassword($this->passwordHasher->hashPassword($user, $newPassword));
            $this->entityManager->flush();

            $this->logger->info('Mot de passe changé avec succès', [
                'user_id' => $user->getId()
            ]);

            return new JsonResponse(['message' => 'Mot de passe changé avec succès']);

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors du changement de mot de passe', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            return new JsonResponse([
                'error' => 'Erreur lors du changement de mot de passe'
            ], 500);
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
            $data = json_decode($request->getContent(), true);

            if (!$user) {
                return new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
            }

            // Vérification du mot de passe pour confirmer la suppression
            if (!isset($data['password']) || empty(trim($data['password']))) {
                return new JsonResponse([
                    'error' => 'Le mot de passe est requis pour confirmer la suppression du compte'
                ], 400);
            }

            $password = trim($data['password']);

            if (!$this->passwordHasher->isPasswordValid($user, $password)) {
                return new JsonResponse([
                    'error' => 'Mot de passe incorrect. Veuillez vérifier votre mot de passe.'
                ], 400);
            }

            // Vérification supplémentaire pour les comptes admin (optionnel)
            if (in_array('ROLE_ADMIN', $user->getRoles())) {
                $this->logger->warning('Tentative de suppression d\'un compte administrateur', [
                    'user_id' => $user->getId(),
                    'email' => $user->getEmail()
                ]);
                // Vous pouvez ajouter des restrictions supplémentaires ici si nécessaire
            }

            // Supprimer la photo de profil si elle existe
            if ($user->getProfilePicture()) {
                $imagePath = $this->getParameter('kernel.project_dir') . 
                    '/public' . $user->getProfilePicture();
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
            }

            $userId = $user->getId();
            $this->entityManager->remove($user);
            $this->entityManager->flush();

            $this->logger->info('Compte utilisateur supprimé', [
                'user_id' => $userId
            ]);

            return new JsonResponse(['message' => 'Compte supprimé avec succès']);

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la suppression du compte', [
                'error' => $e->getMessage(),
                'user_id' => $this->getUser()?->getId()
            ]);
            return new JsonResponse([
                'error' => 'Erreur lors de la suppression du compte'
            ], 500);
        }
    }
}