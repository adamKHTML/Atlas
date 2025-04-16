<?php

namespace App\Controller\API;

use App\Entity\User;
use App\Service\MailerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;

class RegisterController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private MailerService $mailerService,
        private LoggerInterface $logger
    ) {}

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $response = $this->processRegistration($request);
        return $response;
    }

    private function processRegistration(Request $request): JsonResponse
    {
        $data = $request->request->all();
        $profilePicture = $request->files->get('profile_picture');

        // Validation
        if (!$this->validateRequiredFields($data)) {
            return $this->jsonResponse('Missing fields', Response::HTTP_BAD_REQUEST);
        }

        $errors = $this->validateUserData($data);
        if (!empty($errors)) {
            return $this->jsonResponse(['errors' => $errors], Response::HTTP_BAD_REQUEST);
        }

        if ($this->userExists($data['email'])) {
            return $this->jsonResponse('Email already exists', Response::HTTP_CONFLICT);
        }

        try {
            $user = $this->createUser($data, $profilePicture);
            
            // Générer le token pour la vérification d'email
            $token = bin2hex(random_bytes(32));
            $expiresAt = new \DateTime('+24 hours');
            
            $user->setVerificationToken($token);
            $user->setVerificationTokenExpiresAt($expiresAt);
            
            $this->entityManager->flush();
            
            // Envoyer l'email de vérification
            try {
                $this->mailerService->sendVerificationEmail($user);
                $this->logger->info('Verification email sent', ['user_id' => $user->getId()]);
            } catch (\Exception $e) {
                $this->logger->error('Failed to send verification email', [
                    'user_id' => $user->getId(),
                    'error' => $e->getMessage()
                ]);
                // On continue même si l'envoi d'email échoue
            }
            
            return $this->jsonResponse([
                'message' => 'User created successfully. Please check your email to verify your account.',
                'user' => $this->getUserData($user)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            $this->logger->error('Registration failed', ['error' => $e->getMessage()]);
            return $this->jsonResponse(['error' => 'An error occurred during registration'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function validateRequiredFields(array $data): bool
    {
        return isset($data['email'], $data['password'], $data['pseudo']);
    }

    private function validateUserData(array $data): array
    {
        $errors = [];
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email invalide';
        }
        
        if (strlen($data['password']) < 8) {
            $errors[] = 'Le mot de passe doit faire 8 caractères minimum';
        }
        
        if (empty($data['pseudo'])) {
            $errors[] = 'Le pseudo est obligatoire';
        } elseif (strlen($data['pseudo']) < 3) {
            $errors[] = 'Le pseudo doit faire au moins 3 caractères';
        }

        return $errors;
    }

    private function userExists(string $email): bool
    {
        return (bool)$this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
    }

    private function createUser(array $data, $profilePicture): User
    {
        $user = new User();
        $user->setEmail($data['email'])
            ->setPseudo($data['pseudo'])
            ->setRoles(['ROLE_USER']) // Rôle de base, sera promu en ROLE_VOYAGEUR après vérification
            ->setPassword($this->passwordHasher->hashPassword($user, $data['password']))
            ->setIsVerified(false);

        if ($profilePicture) {
            $uploadResult = $this->handleAvatarUpload($profilePicture);
            if ($uploadResult['success']) {
                $user->setProfilePicture($uploadResult['path']);
            }
        }

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function handleAvatarUpload($file): array
    {
        $uploadsDirectory = $this->getParameter('kernel.project_dir') . '/public/uploads/avatars';

        if (!file_exists($uploadsDirectory) && !mkdir($uploadsDirectory, 0777, true)) {
            return ['success' => false, 'message' => 'Impossible de créer le dossier'];
        }

        try {
            $filename = uniqid() . '.' . $file->guessExtension();
            $file->move($uploadsDirectory, $filename);
            return ['success' => true, 'path' => '/uploads/avatars/' . $filename];
        } catch (\Exception $e) {
            $this->logger->error('Avatar upload failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Erreur lors de l\'upload'];
        }
    }

    private function getUserData(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'pseudo' => $user->getPseudo(),
            'profilePicture' => $user->getProfilePicture(),
            'roles' => $user->getRoles(),
            'isVerified' => $user->isVerified()
        ];
    }

    private function jsonResponse($data, int $status = Response::HTTP_OK): JsonResponse
    {
        return new JsonResponse($data, $status);
    }
}