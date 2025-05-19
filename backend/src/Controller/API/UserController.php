<?php

namespace App\Controller\API;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\MailerService;
use App\Service\TokenManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\User\UserInterface;
use Psr\Log\LoggerInterface;

class UserController extends AbstractController
{
    private UserRepository $userRepository;
    private EntityManagerInterface $entityManager;
    private TokenManager $tokenManager;
    private ?MailerService $mailerService;
    private ?LoggerInterface $logger;
    private ?UserPasswordHasherInterface $passwordHasher;

    public function __construct(
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        TokenManager $tokenManager,
        ?MailerService $mailerService = null,
        ?LoggerInterface $logger = null,
        ?UserPasswordHasherInterface $passwordHasher = null
    ) {
        $this->userRepository = $userRepository;
        $this->entityManager = $entityManager;
        $this->tokenManager = $tokenManager;
        $this->mailerService = $mailerService;
        $this->logger = $logger;
        $this->passwordHasher = $passwordHasher;
    }
    
    /**
     * 📌 Récupération de l'utilisateur connecté
     */
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof UserInterface) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'pseudo' => $user->getPseudo(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'roles' => $user->getRoles(),
            'isVerified' => $user->isVerified(),
            'profilePicture' => $user->getProfilePicture()
        ]);
    }

    /**
     * 📌 Connexion par identifiants avec création de session
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            return new JsonResponse(['error' => 'Email et mot de passe requis'], Response::HTTP_BAD_REQUEST);
        }
        
        // Trouver l'utilisateur par email
        $user = $this->userRepository->findOneBy(['email' => $data['email']]);
        
        if (!$user || !$this->passwordHasher->isPasswordValid($user, $data['password'])) {
            return new JsonResponse(['error' => 'Identifiants invalides'], Response::HTTP_UNAUTHORIZED);
        }
        
        if (!$user->isVerified()) {
            return new JsonResponse(['error' => 'Veuillez vérifier votre email avant de vous connecter'], Response::HTTP_FORBIDDEN);
        }
        
        try {
            // Générer un token d'authentification en base de données (hashé)
            $this->tokenManager->generateAuthToken($user);
            
            // Créer la session utilisateur
            $this->authenticateUser($user, $request);
            
            if ($this->logger) {
                $this->logger->info('Connexion réussie', ['user_id' => $user->getId()]);
            }
            
            // Retourner toutes les informations dont le frontend a besoin
            return new JsonResponse([
                'success' => true,
                'message' => 'Connexion réussie',
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'pseudo' => $user->getPseudo(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(), 
                    'roles' => $user->getRoles(),
                    'isVerified' => $user->isVerified(),
                    'profilePicture' => $user->getProfilePicture()
                ]
            ]);
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Échec de génération du token d\'authentification', [
                    'user_id' => $user->getId(),
                    'error' => $e->getMessage()
                ]);
            }
            
            return new JsonResponse(
                ['error' => 'Échec de connexion. Veuillez réessayer.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Méthode privée pour authentifier l'utilisateur via session
     */
    private function authenticateUser(User $user, Request $request): void
    {
        // Création manuelle de la session utilisateur
        $token = new UsernamePasswordToken($user, 'main', $user->getRoles());
        $this->container->get('security.token_storage')->setToken($token);
        $request->getSession()->set('_security_main', serialize($token));
    }

    /**
     * 📌 Déconnexion (invalidation du token)
     */
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        $user = $this->getUser();
        
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Déjà déconnecté']);
        }
        
        // Invalider le token d'authentification
        $this->tokenManager->invalidateToken($user);
        
        return new JsonResponse(['message' => 'Déconnexion réussie']);
    }

    /**
     * 📌 Suppression du compte utilisateur
     */
    #[Route('/api/delete-user', name: 'api_delete_user', methods: ['DELETE'])]
    public function deleteUser(Request $request): JsonResponse
    {
        $user = $this->getUser();
        
        if (!$user) {
            return new JsonResponse(['error' => 'Utilisateur non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        
        $data = json_decode($request->getContent(), true);

        if (!isset($data['password']) || !$this->passwordHasher->isPasswordValid($user, $data['password'])) {
            return new JsonResponse(['error' => 'Mot de passe incorrect'], Response::HTTP_UNAUTHORIZED);
        }
        
        // Supprimer l'avatar s'il existe
        if ($user->getProfilePicture()) {
            $imagePath = $this->getParameter('kernel.project_dir') . '/public' . $user->getProfilePicture();
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'User deleted successfully']);
    }
    
    /**
     * 📌 Vérification d'email via API
     */
    #[Route('/api/verify-email', name: 'api_verify_email', methods: ['GET'])]
    public function verifyEmail(Request $request): JsonResponse
    {
        $token = $request->query->get('token');
        
        if (!$token) {
            if ($this->logger) {
                $this->logger->warning('Tentative de vérification sans token');
            }
            return new JsonResponse([
                'error' => 'Token de vérification manquant'
            ], Response::HTTP_BAD_REQUEST);
        }
        
        if ($this->logger) {
            $this->logger->debug('Tentative de vérification d\'email', [
                'token_preview' => substr($token, 0, 8) . '...'
            ]);
        }
        
        try {
            // Utiliser TokenManager pour vérifier le token
            $user = $this->tokenManager->verifyEmailToken($token);
            
            // Si l'utilisateur est déjà vérifié
            if ($user->isVerified()) {
                if ($this->logger) {
                    $this->logger->info('Utilisateur déjà vérifié', [
                        'user_id' => $user->getId()
                    ]);
                }
                
                return new JsonResponse([
                    'message' => 'Votre email a déjà été vérifié',
                    'verified' => true
                ]);
            }
            
            // Mettre à jour l'utilisateur: marquer comme vérifié et mettre à jour le rôle
            $user->setIsVerified(true);
            $user->setRoles(['ROLE_TRAVELER']); // ROLE_TRAVELER au lieu de ROLE_VOYAGEUR
            
            // Invalider le token après utilisation
            $user->setVerificationToken(null);
            $user->setVerificationTokenExpiresAt(null);
            
            $this->entityManager->flush();
            
            if ($this->logger) {
                $this->logger->info('Email vérifié avec succès', [
                    'user_id' => $user->getId()
                ]);
            }
            
            return new JsonResponse([
                'message' => 'Votre email a été vérifié avec succès',
                'verified' => true
            ]);
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->warning('Échec de vérification d\'email', [
                    'error' => $e->getMessage(),
                    'token_preview' => substr($token, 0, 8) . '...'
                ]);
            }
            
            return new JsonResponse([
                'error' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        }
    }
    
    /**
     * 📌 Renvoyer l'email de vérification
     */
    #[Route('/api/resend-verification-email', name: 'api_resend_verification_email', methods: ['POST'])]
    public function resendVerificationEmail(): JsonResponse
    {
        if (!$this->mailerService) {
            return new JsonResponse(['error' => 'Service de mail non disponible'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        
        /** @var User $user */
        $user = $this->getUser();
        
        if (!$user) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }
        
        if ($user->isVerified()) {
            return new JsonResponse(['error' => 'Votre email est déjà vérifié'], Response::HTTP_BAD_REQUEST);
        }
        
        // Générer un nouveau token avec TokenManager
        try {
            $plainToken = $this->tokenManager->generateEmailVerificationToken($user);
            
            // Envoyer l'email de vérification
            $this->mailerService->sendVerificationEmail($user, $plainToken);
            
            if ($this->logger) {
                $this->logger->info('Email de vérification renvoyé', ['user_id' => $user->getId()]);
            }
            
            return new JsonResponse(['message' => 'Email de vérification renvoyé avec succès']);
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Échec d\'envoi de l\'email de vérification', [
                    'user_id' => $user->getId(),
                    'error' => $e->getMessage()
                ]);
            }
            
            return new JsonResponse(
                ['error' => 'Impossible d\'envoyer l\'email de vérification. Veuillez réessayer plus tard.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}