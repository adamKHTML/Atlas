<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class TokenManager
{
    private $entityManager;
    private $logger;
    
    // Préfixes pour les différents types de tokens
    public const TOKEN_PREFIX = 'hashed:';
    public const EMAIL_VERIFICATION_TYPE = 'v:'; // Préfixe pour différencier les tokens de vérification
    public const AUTH_TYPE = 'a:'; // Préfixe pour les tokens d'authentification
    
    public function __construct(
        EntityManagerInterface $entityManager,
        LoggerInterface $logger
    ) {
        $this->entityManager = $entityManager;
        $this->logger = $logger;
    }
    
    /**
     * Génère un token de vérification d'email sécurisé
     */
    public function generateEmailVerificationToken(User $user, int $expiresInHours = 24): string
    {
        // Générer un token aléatoire
        $plainToken = bin2hex(random_bytes(32));
        
        // Hasher le token avec préfixe de type pour le stockage
        $hashedToken = self::TOKEN_PREFIX . hash('sha256', self::EMAIL_VERIFICATION_TYPE . $plainToken);
        
        // Définir la date d'expiration
        $expiresAt = new \DateTime("+{$expiresInHours} hours");
        
        // Stocker le token et la date d'expiration
        $user->setVerificationToken($hashedToken);
        $user->setVerificationTokenExpiresAt($expiresAt);
        
        $this->logger->info('Token de vérification généré', [
            'user_id' => $user->getId(),
            'token_type' => 'email_verification',
            'expires_at' => $expiresAt->format('Y-m-d H:i:s')
        ]);
        
        // Persister les changements
        $this->entityManager->flush();
        
        // Retourner le token en clair pour l'email
        return $plainToken;
    }
    
    /**
     * Vérifie un token de vérification d'email
     */
    public function verifyEmailToken(string $plainToken): User
    {
        if (empty($plainToken)) {
            throw new \RuntimeException('Token manquant');
        }
        
        // Hasher le token pour la comparaison (avec préfixe de type)
        $hashedToken = self::TOKEN_PREFIX . hash('sha256', self::EMAIL_VERIFICATION_TYPE . $plainToken);
        
        $this->logger->debug('Vérification de token email', [
            'hashed_token_preview' => substr($hashedToken, 0, 15) . '...'
        ]);
        
        // Rechercher l'utilisateur avec le token haché
        $user = $this->entityManager->getRepository(User::class)
            ->findOneBy(['verificationToken' => $hashedToken]);
        
        // Tenter avec l'ancien format si l'utilisateur n'est pas trouvé
        if (!$user) {
            // Ancienne façon sans préfixe de type
            $oldHashedToken = self::TOKEN_PREFIX . hash('sha256', $plainToken);
            $user = $this->entityManager->getRepository(User::class)
                ->findOneBy(['verificationToken' => $oldHashedToken]);
                
            // Tenter avec le token en clair (compatibilité avec anciens tokens)
            if (!$user) {
                $user = $this->entityManager->getRepository(User::class)
                    ->findOneBy(['verificationToken' => $plainToken]);
                
                if ($user) {
                    $this->logger->info('Token trouvé avec format ancien (non haché)', [
                        'user_id' => $user->getId()
                    ]);
                }
            }
        }
        
        if (!$user) {
            throw new \RuntimeException('Token invalide');
        }
        
        // Vérifier l'expiration
        if ($user->getVerificationTokenExpiresAt() && $user->getVerificationTokenExpiresAt() < new \DateTime()) {
            throw new \RuntimeException('Token expiré');
        }
        
        return $user;
    }
    
    /**
     * Génère un token d'authentification (pour la connexion)
     */
    public function generateAuthToken(User $user, int $expiresInDays = 30): string
    {
        // L'utilisateur doit être vérifié
        if (!$user->isVerified()) {
            throw new \LogicException('Impossible de générer un token d\'authentification pour un utilisateur non vérifié');
        }
        
        // Générer un token aléatoire
        $plainToken = bin2hex(random_bytes(32));
        
        // Hasher le token pour le stockage (avec préfixe de type)
        $hashedToken = self::TOKEN_PREFIX . hash('sha256', self::AUTH_TYPE . $plainToken);
        
        // Définir la date d'expiration
        $expiresAt = new \DateTime("+{$expiresInDays} days");
        
        // Stocker le token et la date d'expiration
        $user->setVerificationToken($hashedToken);
        $user->setVerificationTokenExpiresAt($expiresAt);
        
        // Persister les changements
        $this->entityManager->flush();
        
        $this->logger->info('Token d\'authentification généré', [
            'user_id' => $user->getId(),
            'token_type' => 'auth',
            'expires_at' => $expiresAt->format('Y-m-d H:i:s')
        ]);
        
        // Retourner le token en clair
        return $plainToken;
    }
    
    /**
     * Vérifie un token d'authentification
     */
    public function verifyAuthToken(string $plainToken): User
    {
        if (empty($plainToken)) {
            throw new \RuntimeException('Token manquant');
        }
        
        // Hasher le token pour la comparaison (avec préfixe de type)
        $hashedToken = self::TOKEN_PREFIX . hash('sha256', self::AUTH_TYPE . $plainToken);
        
        $this->logger->debug('Vérification de token auth', [
            'hashed_token_preview' => substr($hashedToken, 0, 15) . '...'
        ]);
        
        // Rechercher l'utilisateur avec le token haché
        $user = $this->entityManager->getRepository(User::class)
            ->findOneBy(['verificationToken' => $hashedToken]);
        
        // Tenter avec l'ancien format si l'utilisateur n'est pas trouvé
        if (!$user) {
            // Ancienne façon sans préfixe de type
            $oldHashedToken = self::TOKEN_PREFIX . hash('sha256', $plainToken);
            $user = $this->entityManager->getRepository(User::class)
                ->findOneBy(['verificationToken' => $oldHashedToken]);
                
            // Tenter avec le token en clair (compatibilité)
            if (!$user) {
                $user = $this->entityManager->getRepository(User::class)
                    ->findOneBy(['verificationToken' => $plainToken]);
            }
        }
        
        if (!$user) {
            throw new \RuntimeException('Token invalide');
        }
        
        // Vérifier si le token n'est pas expiré
        if ($user->getVerificationTokenExpiresAt() && $user->getVerificationTokenExpiresAt() < new \DateTime()) {
            // Invalider automatiquement le token expiré
            $this->invalidateToken($user);
            throw new \RuntimeException('Token expiré');
        }
        
        // Vérifier que l'utilisateur est bien vérifié
        if (!$user->isVerified()) {
            throw new \RuntimeException('Utilisateur non vérifié');
        }
        
        return $user;
    }
    
    /**
     * Invalide le token d'un utilisateur
     */
    public function invalidateToken(User $user): void
    {
        $user->setVerificationToken(null);
        $user->setVerificationTokenExpiresAt(null);
        $this->entityManager->flush();
        
        $this->logger->info('Token invalidé', [
            'user_id' => $user->getId()
        ]);
    }
    
    /**
     * Prolonge la durée de vie d'un token
     */
    public function extendTokenExpiration(User $user, int $expiresInDays = 30): void
    {
        if (!$user->getVerificationToken()) {
            return; // Pas de token à prolonger
        }
        
        // Nouvelle date d'expiration
        $newExpiresAt = new \DateTime("+{$expiresInDays} days");
        $user->setVerificationTokenExpiresAt($newExpiresAt);
        $this->entityManager->flush();
        
        $this->logger->info('Durée du token prolongée', [
            'user_id' => $user->getId(),
            'new_expires_at' => $newExpiresAt->format('Y-m-d H:i:s')
        ]);
    }
}