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
        // Logs pour débogage
        $this->logger->debug('Requête d\'inscription reçue', [
            'content_type' => $request->headers->get('Content-Type'),
            'content_length' => $request->headers->get('Content-Length'),
            'has_files' => $request->files->count() > 0,
            'files' => array_keys($request->files->all()),
            'fields' => array_keys($request->request->all())
        ]);
        
        // Traitement direct du FormData comme dans votre ProductController
        $data = $request->request->all();
        $profilePicture = $request->files->get('profile_picture');
        
        if (empty($data)) {
            $this->logger->error('Aucune donnée reçue pour l\'inscription');
            return $this->jsonResponse(['error' => 'No data received. Please check your request format.'], Response::HTTP_BAD_REQUEST);
        }
        
        // Validation de base
        if (!isset($data['email'], $data['password'], $data['pseudo'], $data['firstname'], $data['lastname'])) {
            $this->logger->error('Champs obligatoires manquants', ['received' => array_keys($data)]);
            return $this->jsonResponse(['error' => 'Missing required fields: email, password, pseudo, firstname, lastname'], Response::HTTP_BAD_REQUEST);
        }
        
        // Validations supplémentaires
        $errors = [];
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email invalide';
        }
        
        if (strlen($data['password']) < 8) {
            $errors[] = 'Le mot de passe doit faire au moins 8 caractères';
        }
        
        if (strlen($data['pseudo']) < 3) {
            $errors[] = 'Le pseudo doit faire au moins 3 caractères';
        }
        
        if (!empty($errors)) {
            return $this->jsonResponse(['errors' => $errors], Response::HTTP_BAD_REQUEST);
        }
        
        // Vérifier si un utilisateur existe déjà avec cet email
        if ($this->entityManager->getRepository(User::class)->findOneBy(['email' => $data['email']])) {
            return $this->jsonResponse(['error' => 'Email already exists'], Response::HTTP_CONFLICT);
        }
        
        try {
            // Créer l'utilisateur
            $user = new User();
            $user->setEmail($data['email'])
                ->setPseudo($data['pseudo'])
                ->setFirstname($data['firstname'])
                ->setLastname($data['lastname'])
                ->setRoles(['ROLE_USER'])
                ->setPassword($this->passwordHasher->hashPassword($user, $data['password']))
                ->setIsVerified(false);
            
            // Gérer la photo de profil s'il y en a une
            if ($profilePicture) {
                $destination = $this->getParameter('kernel.project_dir') . '/public/uploads/avatars';
                if (!file_exists($destination) && !mkdir($destination, 0777, true)) {
                    throw new \RuntimeException('Impossible de créer le dossier uploads/avatars');
                }
                
                $filename = uniqid() . '.' . $profilePicture->guessExtension();
                $profilePicture->move($destination, $filename);
                $user->setProfilePicture('/uploads/avatars/' . $filename);
                
                $this->logger->info('Avatar uploadé', ['filename' => $filename]);
            }
            
            // Persister l'utilisateur avant de générer le token
            $this->entityManager->persist($user);
            $this->entityManager->flush();
            
            // Générer un token avec TokenManager
            $plainToken = $this->tokenManager->generateEmailVerificationToken($user);
            
            // Log du token pour débogage
            $this->logger->debug('Token généré pour l\'utilisateur', [
                'user_id' => $user->getId(),
                'token_preview' => substr($plainToken, 0, 8) . '...',
                'token_length' => strlen($plainToken)
            ]);
            
            // Envoyer l'email de vérification
            try {
                $this->mailerService->sendVerificationEmail($user, $plainToken);
                $this->logger->info('Email de vérification envoyé', ['user_id' => $user->getId()]);
            } catch (\Exception $e) {
                $this->logger->error('Échec d\'envoi de l\'email de vérification', [
                    'user_id' => $user->getId(),
                    'error' => $e->getMessage()
                ]);
                // On continue même si l'envoi d'email échoue
            }
            
            return $this->jsonResponse([
                'message' => 'User created successfully. Please check your email to verify your account.',
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'pseudo' => $user->getPseudo(),
                    'profilePicture' => $user->getProfilePicture(),
                    'isVerified' => $user->isVerified()
                ]
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            $this->logger->error('Échec de l\'inscription', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->jsonResponse(['error' => 'An error occurred during registration: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    
    // Route de débogage des tokens
    #[Route('/api/debug-tokens', name: 'api_debug_tokens', methods: ['GET'])]
    public function debugTokens(): JsonResponse
    {
        // Récupérer tous les utilisateurs avec des tokens
        $users = $this->entityManager->getRepository(User::class)->findAll();
        $tokens = [];
        
        foreach ($users as $user) {
            if ($user->getVerificationToken()) {
                $tokens[] = [
                    'user_id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'token_preview' => substr($user->getVerificationToken(), 0, 15) . '...',
                    'is_hashed' => strpos($user->getVerificationToken(), TokenManager::TOKEN_PREFIX) === 0,
                    'expires_at' => $user->getVerificationTokenExpiresAt() 
                        ? $user->getVerificationTokenExpiresAt()->format('Y-m-d H:i:s') 
                        : null,
                    'is_verified' => $user->isVerified()
                ];
            }
        }
        
        return $this->jsonResponse([
            'tokens_count' => count($tokens),
            'tokens' => $tokens
        ]);
    }
    
    // Route pour tester la vérification d'un token spécifique
    #[Route('/api/test-verify/{token}', name: 'api_test_verify', methods: ['GET'])]
    public function testVerify(string $token): JsonResponse
    {
        // Hasher le token pour voir
        $hashedToken = TokenManager::TOKEN_PREFIX . hash('sha256', $token);
        
        // Chercher avec les deux formats
        $userWithPlain = $this->entityManager->getRepository(User::class)
            ->findOneBy(['verificationToken' => $token]);
        
        $userWithHashed = $this->entityManager->getRepository(User::class)
            ->findOneBy(['verificationToken' => $hashedToken]);
        
        return $this->jsonResponse([
            'input_token' => $token,
            'input_token_preview' => substr($token, 0, 8) . '...',
            'hashed_version' => $hashedToken,
            'hashed_version_preview' => substr($hashedToken, 0, 15) . '...',
            'found_with_plain' => $userWithPlain ? [
                'id' => $userWithPlain->getId(),
                'email' => $userWithPlain->getEmail()
            ] : null,
            'found_with_hashed' => $userWithHashed ? [
                'id' => $userWithHashed->getId(),
                'email' => $userWithHashed->getEmail()
            ] : null
        ]);
    }
    
    private function jsonResponse($data, int $status = Response::HTTP_OK): JsonResponse
    {
        return new JsonResponse($data, $status);
    }
}