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

class RegisterController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
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

        $user = $this->createUser($data, $profilePicture);
        
        return $this->jsonResponse([
            'message' => 'User created with ROLE_VOYAGEUR',
            'user' => $this->getUserData($user)
        ], Response::HTTP_CREATED);
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
            ->setRoles(['ROLE_VOYAGEUR'])
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
            return ['success' => false, 'message' => 'Erreur lors de l\'upload'];
        }
    }

    private function getUserData(User $user): array
    {
        return [
            'email' => $user->getEmail(),
            'pseudo' => $user->getPseudo(),
            'profilePicture' => $user->getProfilePicture()
        ];
    }

    private function jsonResponse($data, int $status = Response::HTTP_OK): JsonResponse
    {
        return new JsonResponse($data, $status);
    }
}