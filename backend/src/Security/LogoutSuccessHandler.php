<?php
// 4c. CRÉER src/Security/LogoutSuccessHandler.php (NOUVEAU FICHIER)

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\Logout\LogoutSuccessHandlerInterface;

class LogoutSuccessHandler implements LogoutSuccessHandlerInterface
{
    public function onLogoutSuccess(Request $request): JsonResponse
    {
        return new JsonResponse([
            'message' => 'Déconnexion réussie'
        ]);
    }
}