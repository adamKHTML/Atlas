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
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Core\Exception\InvalidCsrfTokenException;
use Psr\Log\LoggerInterface;

class UserController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
        private TokenManager $tokenManager,
        private CsrfTokenManagerInterface $csrfTokenManager,
        private ?MailerService $mailerService = null,
        private ?LoggerInterface $logger = null,
        private ?UserPasswordHasherInterface $passwordHasher = null
    ) {}

    /**
     * 🔒 Récupération des informations utilisateur sécurisée
     */
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(Request $request): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof UserInterface) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $response = new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            // 🔒 Protection XSS : échappement HTML
            'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
            'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
            'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
            'roles' => $user->getRoles(),
            'isVerified' => $user->isVerified(),
            'profilePicture' => $user->getProfilePicture()
        ]);

        $this->addSecurityHeaders($response);
        
        return $response;
    }

    /**
     * 🔒 Connexion sécurisée avec protection CSRF
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        // 🔒 Vérification CSRF
        $data = json_decode($request->getContent(), true);
        
        if (isset($data['_token'])) {
            if (!$this->isCsrfTokenValid('authenticate', $data['_token'])) {
                if ($this->logger) {
                    $this->logger->warning('CSRF token invalid on login', [
                        'ip' => $request->getClientIp(),
                        'user_agent' => $request->headers->get('User-Agent'),
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                }
                throw new InvalidCsrfTokenException('Token CSRF invalide');
            }
        }

        $user = $this->getUser();
        
        if ($user instanceof User) {
            // 🔒 Log de connexion réussie
            if ($this->logger) {
                $this->logger->info('Login success', [
                    'user_id' => $user->getId(),
                    'ip' => $request->getClientIp(),
                    'user_agent' => $request->headers->get('User-Agent'),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
            $response = new JsonResponse([
                'success' => true,
                'message' => 'Connexion réussie',
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    // 🔒 Protection XSS
                    'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
                    'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
                    'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
                    'roles' => $user->getRoles(),
                    'isVerified' => $user->isVerified(),
                    'profilePicture' => $user->getProfilePicture()
                ]
            ]);
            
            $this->addSecurityHeaders($response);
            
            return $response;
        }
        
        // 🔒 Log des tentatives de connexion échouées
        if ($this->logger) {
            $this->logger->warning('Login failed', [
                'ip' => $request->getClientIp(),
                'user_agent' => $request->headers->get('User-Agent'),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
        
        $response = new JsonResponse(['error' => 'Identifiants invalides'], Response::HTTP_UNAUTHORIZED);
        $this->addSecurityHeaders($response);
        
        return $response;
    }

    /**
     * 🔒 Déconnexion sécurisée avec protection CSRF
     */
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        // 🔒 Vérification CSRF pour logout
        $data = json_decode($request->getContent(), true);
        
        if (isset($data['_token'])) {
            if (!$this->isCsrfTokenValid('logout', $data['_token'])) {
                if ($this->logger) {
                    $this->logger->warning('CSRF token invalid on logout', [
                        'ip' => $request->getClientIp(),
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                }
                throw new InvalidCsrfTokenException('Token CSRF invalide');
            }
        }

        $user = $this->getUser();
        
        if ($user instanceof User) {
            if ($this->logger) {
                $this->logger->info('Logout', [
                    'user_id' => $user->getId(),
                    'ip' => $request->getClientIp(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
        }
        
        $response = new JsonResponse(['message' => 'Déconnexion réussie']);
        $this->addSecurityHeaders($response);
        
        return $response;
    }

    /**
     * 🔒 Endpoint pour générer un token CSRF
     */
    #[Route('/api/csrf-token', name: 'api_csrf_token', methods: ['GET'])]
    public function getCsrfToken(Request $request): JsonResponse
    {
        $intention = $request->query->get('intention', 'authenticate');
        
        // 🔒 Validation de l'intention
        $allowedIntentions = ['authenticate', 'logout', 'delete_account', 'update_profile'];
        if (!in_array($intention, $allowedIntentions)) {
            $intention = 'authenticate';
        }

        $token = $this->csrfTokenManager->getToken($intention)->getValue();
        
        $response = new JsonResponse([
            'csrf_token' => $token,
            'intention' => $intention
        ]);
        
        $this->addSecurityHeaders($response);
        
        return $response;
    }

   
    
    /**
     * 🔒 Vérification email sécurisée
     */
    #[Route('/api/verify-email', name: 'api_verify_email', methods: ['GET'])]
    public function verifyEmail(Request $request): JsonResponse
    {
        $token = $request->query->get('token');
        
        // 🔒 Validation token
        if (empty($token) || !is_string($token) || strlen($token) < 10 || strlen($token) > 255) {
            $response = new JsonResponse(['error' => 'Token invalide'], Response::HTTP_BAD_REQUEST);
            $this->addSecurityHeaders($response);
            return $response;
        }
        
        // 🔒 Sanitisation token (caractères autorisés uniquement)
        if (!preg_match('/^[a-zA-Z0-9]+$/', $token)) {
            $response = new JsonResponse(['error' => 'Format de token invalide'], Response::HTTP_BAD_REQUEST);
            $this->addSecurityHeaders($response);
            return $response;
        }
        
        try {
            $user = $this->tokenManager->verifyEmailToken($token);
            
            if ($user->isVerified()) {
                $response = new JsonResponse([
                    'message' => 'Email déjà vérifié',
                    'verified' => true
                ]);
                $this->addSecurityHeaders($response);
                return $response;
            }
            
            $user->setIsVerified(true);
            $user->setRoles(['ROLE_TRAVELER']);
            $user->setVerificationToken(null);
            $user->setVerificationTokenExpiresAt(null);
            
            $this->entityManager->flush();
            
            if ($this->logger) {
                $this->logger->info('Email verified', [
                    'user_id' => $user->getId(),
                    'ip' => $request->getClientIp(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
            $response = new JsonResponse([
                'message' => 'Email vérifié avec succès',
                'verified' => true
            ]);
            $this->addSecurityHeaders($response);
            
            return $response;
            
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->warning('Email verify failed', [
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
            $response = new JsonResponse(['error' => 'Token invalide ou expiré'], Response::HTTP_BAD_REQUEST);
            $this->addSecurityHeaders($response);
            
            return $response;
        }
    }
    
    /**
     * 🔒 Renvoyer email vérification sécurisé
     */
    #[Route('/api/resend-verification-email', name: 'api_resend_verification_email', methods: ['POST'])]
    public function resendVerificationEmail(Request $request): JsonResponse
    {
        if (!$this->mailerService) {
            $response = new JsonResponse(['error' => 'Service mail indisponible'], Response::HTTP_INTERNAL_SERVER_ERROR);
            $this->addSecurityHeaders($response);
            return $response;
        }
        
        $user = $this->getUser();
        
        if (!$user) {
            $response = new JsonResponse(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
            $this->addSecurityHeaders($response);
            return $response;
        }
        
        if ($user->isVerified()) {
            $response = new JsonResponse(['error' => 'Email déjà vérifié'], Response::HTTP_BAD_REQUEST);
            $this->addSecurityHeaders($response);
            return $response;
        }
        
        try {
            $token = $this->tokenManager->generateEmailVerificationToken($user);
            $this->mailerService->sendVerificationEmail($user, $token);
            
            if ($this->logger) {
                $this->logger->info('Verification email resent', [
                    'user_id' => $user->getId(),
                    'ip' => $request->getClientIp(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
            $response = new JsonResponse(['message' => 'Email de vérification renvoyé']);
            $this->addSecurityHeaders($response);
            
            return $response;
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Email resend failed', [
                    'user_id' => $user->getId(),
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
            $response = new JsonResponse(['error' => 'Erreur envoi email'], Response::HTTP_INTERNAL_SERVER_ERROR);
            $this->addSecurityHeaders($response);
            
            return $response;
        }
    }

    /**
     * 🔒 Méthode privée pour ajouter les headers de sécurité
     */
    private function addSecurityHeaders(JsonResponse $response): void
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Content-Security-Policy', "default-src 'self'");
        // 🔒 Désactiver la mise en cache des réponses sensibles
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
    }
}