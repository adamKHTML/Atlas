<?php

namespace App\Controller\API;

use App\Entity\User;
use App\Service\MailerService;
use App\Service\TokenManager;
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
    
    private const MAX_FILE_SIZE = 2 * 1024 * 1024; 
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private MailerService $mailerService,
        private LoggerInterface $logger,
        private TokenManager $tokenManager
    ) {}

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        // 1. Logs de sécurité
        $this->logger->info('Registration attempt', [
            'ip' => $request->getClientIp(),
            'user_agent' => $request->headers->get('User-Agent'),
            'content_type' => $request->headers->get('Content-Type'),
            'has_files' => $request->files->count() > 0,
            'fields' => array_keys($request->request->all())
        ]);
        
        $data = $request->request->all();
        $profilePicture = $request->files->get('profile_picture');
        
        if (empty($data)) {
            $this->logger->error('No data received for registration', [
                'ip' => $request->getClientIp()
            ]);
            return $this->jsonResponse(['error' => 'No data received. Please check your request format.'], Response::HTTP_BAD_REQUEST);
        }
        
        // 2. Validation et sanitisation des données
        try {
            $sanitizedData = $this->sanitizeAndValidateData($data);
        } catch (\InvalidArgumentException $e) {
            $this->logger->warning('Data validation failed', [
                'error' => $e->getMessage(),
                'ip' => $request->getClientIp()
            ]);
            return $this->jsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        // Validation de la photo de profil
        if ($profilePicture) {
            try {
                $this->validateProfilePicture($profilePicture);
            } catch (\InvalidArgumentException $e) {
                $this->logger->warning('Profile picture validation failed', [
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp()
                ]);
                return $this->jsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        }

        // 4. Vérification unicité email et pseudo
        if ($this->entityManager->getRepository(User::class)->findOneBy(['email' => $sanitizedData['email']])) {
            return $this->jsonResponse(['error' => 'Un compte avec cette adresse email existe déjà.'], Response::HTTP_CONFLICT);
        }

        if ($this->entityManager->getRepository(User::class)->findOneBy(['pseudo' => $sanitizedData['pseudo']])) {
            return $this->jsonResponse(['error' => 'Ce pseudo est déjà utilisé.'], Response::HTTP_CONFLICT);
        }
        
        try {
            // 5. Création sécurisée de l'utilisateur
            $user = new User();
            $user->setEmail($sanitizedData['email'])
                ->setPseudo($sanitizedData['pseudo'])
                ->setFirstname($sanitizedData['firstname'])
                ->setLastname($sanitizedData['lastname'])
                ->setRoles(['ROLE_USER'])
                ->setPassword($this->passwordHasher->hashPassword($user, $sanitizedData['password']))
                ->setIsVerified(false);
            
            // 6. Upload sécurisé de la photo
            if ($profilePicture) {
                $profilePicturePath = $this->handleSecureFileUpload($profilePicture);
                $user->setProfilePicture($profilePicturePath);
            }
            
            $this->entityManager->persist($user);
            $this->entityManager->flush();
            
            // 7. Génération du token
            $plainToken = $this->tokenManager->generateEmailVerificationToken($user);
            
            $this->logger->info('User successfully registered', [
                'user_id' => $user->getId(),
                'email' => $user->getEmail(),
                'ip' => $request->getClientIp()
            ]);
            
            // 8. Envoi email
            try {
                $this->mailerService->sendVerificationEmail($user, $plainToken);
            } catch (\Exception $e) {
                $this->logger->error('Failed to send verification email', [
                    'user_id' => $user->getId(),
                    'error' => $e->getMessage()
                ]);
            }
            
            return $this->jsonResponse([
                'message' => 'User created successfully. Please check your email to verify your account.',
                'user' => [
                    'id' => $user->getId(),
                    'email' => $this->obfuscateEmail($user->getEmail()),
                    'pseudo' => $user->getPseudo(),
                    'profilePicture' => $user->getProfilePicture(),
                    'isVerified' => $user->isVerified()
                ]
            ], Response::HTTP_CREATED);
            
        } catch (\Exception $e) {
            $this->logger->error('Registration failed', [
                'error' => $e->getMessage(),
                'ip' => $request->getClientIp()
            ]);
            return $this->jsonResponse(['error' => 'An error occurred during registration: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 🛡️ NOUVELLES MÉTHODES DE SÉCURITÉ À AJOUTER
     */

    private function sanitizeAndValidateData(array $data): array
    {
        $errors = [];

        // Validation email
        if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email invalide';
        }

        // Validation pseudo 
        if (!isset($data['pseudo']) || !preg_match('/^[a-zA-Z0-9_-]{3,30}$/', $data['pseudo'])) {
            $errors[] = 'Le pseudo doit contenir 3-30 caractères (lettres, chiffres, - et _ uniquement)';
        }

        // Validation noms et prenoms
        if (!isset($data['firstname']) || !preg_match('/^[a-zA-ZÀ-ÿ\s\'-]{1,50}$/u', $data['firstname'])) {
            $errors[] = 'Prénom invalide';
        }

        if (!isset($data['lastname']) || !preg_match('/^[a-zA-ZÀ-ÿ\s\'-]{1,50}$/u', $data['lastname'])) {
            $errors[] = 'Nom invalide';
        }

        // Validation mot de passe fort
        if (!isset($data['password']) || !$this->isStrongPassword($data['password'])) {
            $errors[] = 'Mot de passe trop faible (8+ caractères avec maj, min, chiffre et caractère spécial)';
        }

        if (!empty($errors)) {
            throw new \InvalidArgumentException(implode(', ', $errors));
        }

        
        return [
            'email' => filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL),
            'pseudo' => htmlspecialchars(trim($data['pseudo']), ENT_QUOTES, 'UTF-8'),
            'firstname' => htmlspecialchars(trim($data['firstname']), ENT_QUOTES, 'UTF-8'),
            'lastname' => htmlspecialchars(trim($data['lastname']), ENT_QUOTES, 'UTF-8'),
            'password' => $data['password']
        ];
    }

    private function isStrongPassword(string $password): bool
    {
        return strlen($password) >= 8 
            && preg_match('/[a-z]/', $password)
            && preg_match('/[A-Z]/', $password)
            && preg_match('/[0-9]/', $password)
            && preg_match('/[^A-Za-z0-9]/', $password);
    }

    private function validateProfilePicture($file): void
    {
        // Taille
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('Fichier trop volumineux (2MB max)');
        }

        // Type MIME
        if (!in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES)) {
            throw new \InvalidArgumentException('Format non autorisé (JPG, PNG, GIF, WebP uniquement)');
        }

        // Vérification que c'est vraiment une image
        if (!@getimagesize($file->getPathname())) {
            throw new \InvalidArgumentException('Fichier corrompu ou non valide');
        }
    }

    private function handleSecureFileUpload($file): string
    {
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/avatars';
        
        if (!file_exists($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            throw new \RuntimeException('Impossible de créer le dossier de destination');
        }

        // Nom sécurisé
        $extension = strtolower($file->getClientOriginalExtension());
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        
        $file->move($uploadDir, $filename);

        $this->logger->info('File uploaded successfully', ['filename' => $filename]);

        return '/uploads/avatars/' . $filename;
    }

    private function obfuscateEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) return $email;

        $local = $parts[0];
        $obfuscated = substr($local, 0, 2) . str_repeat('*', max(0, strlen($local) - 2));
        
        return $obfuscated . '@' . $parts[1];
    }

    private function jsonResponse($data, int $status = Response::HTTP_OK): JsonResponse
    {
        $response = new JsonResponse($data, $status);
        
        // Headers de sécurité
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        return $response;
    }

    // Garde tes autres méthodes existantes (debug-tokens, test-verify, etc.)
}