<?php

namespace App\Controller\API;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\User\UserInterface;

class UserController extends AbstractController
{
    
    //  📌 Récupération de l'utilisateur connecté
   
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof UserInterface) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
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

    $entityManager->remove($user);
    $entityManager->flush();

    return new JsonResponse(['message' => 'User deleted successfully']);
}

}
