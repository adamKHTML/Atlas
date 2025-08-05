<?php
// 4a. CRÉER src/Security/AuthSuccessHandler.php (NOUVEAU FICHIER)

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

class AuthSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function onAuthenticationSuccess(Request $request, TokenInterface $token): JsonResponse
    {
        $user = $token->getUser();
        
        return new JsonResponse([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
                'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
                'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
                'roles' => $user->getRoles(),
                'isVerified' => $user->isVerified(),
                'profilePicture' => $user->getProfilePicture()
            ]
        ]);
    }
}
