<?php

namespace App\Controller\API;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\MailerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\User\UserInterface;
use Psr\Log\LoggerInterface;

class UserController extends AbstractController
{
    private $userRepository;
    private $entityManager;
    private $mailerService;
    private $logger;
    private $passwordHasher;

    public function __construct(
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        MailerService $mailerService = null,
        LoggerInterface $logger = null,
        UserPasswordHasherInterface $passwordHasher = null
    ) {
        $this->userRepository = $userRepository;
        $this->entityManager = $entityManager;
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
            'roles' => $user->getRoles(),
            'isVerified' => $user->isVerified(),
        ]);
    }

    /**
     * 📌 Déconnexion (JWT côté client)
     */
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return new JsonResponse(['message' => 'Logout successful']);
    }

    /**
     * 📌 Suppression du compte utilisateur
     */
    #[Route('/api/delete-user', name: 'api_delete_user', methods: ['DELETE'])]
    public function deleteUser(EntityManagerInterface $em, UserPasswordHasherInterface $hasher, Request $request): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!$hasher->isPasswordValid($user, $data['password'])) {
            return new JsonResponse(['error' => 'Mot de passe incorrect'], Response::HTTP_UNAUTHORIZED);
        }
        
        // Supprimer l'avatar s'il existe
        if ($user->getProfilePicture()) {
            $imagePath = $this->getParameter('kernel.project_dir') . '/public' . $user->getProfilePicture();
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }

        $em->remove($user);
        $em->flush();

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
            return new JsonResponse(['error' => 'Token de vérification manquant'], Response::HTTP_BAD_REQUEST);
        }
        
        $user = $this->userRepository->findOneBy(['verificationToken' => $token]);
        
        if (!$user) {
            return new JsonResponse(['error' => 'Token de vérification invalide'], Response::HTTP_NOT_FOUND);
        }
        
        // Vérifier si le token n'est pas expiré
        if ($user->getVerificationTokenExpiresAt() && $user->getVerificationTokenExpiresAt() < new \DateTime()) {
            return new JsonResponse(['error' => 'Le token de vérification a expiré'], Response::HTTP_GONE);
        }
        
        // Mettre à jour l'utilisateur: marquer comme vérifié et mettre à jour le rôle
        $user->setIsVerified(true);
        $user->setVerificationToken(null);
        $user->setVerificationTokenExpiresAt(null);
        
        // Ajouter le rôle ROLE_VOYAGEUR à l'utilisateur
        $user->setRoles(['ROLE_VOYAGEUR']);
        
        $this->entityManager->flush();
        
        if ($this->logger) {
            $this->logger->info('Email verified successfully', ['user_id' => $user->getId()]);
        }
        
        return new JsonResponse([
            'message' => 'Email vérifié avec succès',
            'verified' => true
        ]);
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
        
        // Générer un nouveau token
        $token = bin2hex(random_bytes(32));
        $expiresAt = new \DateTime('+24 hours');
        
        $user->setVerificationToken($token);
        $user->setVerificationTokenExpiresAt($expiresAt);
        
        $this->entityManager->flush();
        
        // Envoyer l'email de vérification
        try {
            $this->mailerService->sendVerificationEmail($user);
            
            if ($this->logger) {
                $this->logger->info('Verification email resent', ['user_id' => $user->getId()]);
            }
            
            return new JsonResponse(['message' => 'Email de vérification renvoyé avec succès']);
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Failed to send verification email', [
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