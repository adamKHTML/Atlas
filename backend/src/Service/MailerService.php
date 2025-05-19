<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RouterInterface;
use App\Entity\User;
use Psr\Log\LoggerInterface;

class MailerService
{
    private MailerInterface $mailer;
    private LoggerInterface $logger;
    private RouterInterface $router;
    private string $appEnv;
    private string $mailerDsn;
    private string $frontendUrl;

    public function __construct(
        MailerInterface $mailer, 
        LoggerInterface $logger,
        RouterInterface $router,
        string $appEnv = 'dev',
        string $mailerDsn = 'null://null',
        string $frontendUrl = 'http://localhost:5173'
    ) {
        $this->mailer = $mailer;
        $this->logger = $logger;
        $this->router = $router;
        $this->appEnv = $appEnv;
        $this->mailerDsn = $mailerDsn;
        $this->frontendUrl = $frontendUrl;
    }

    /**
     * Envoie un email de vérification à l'utilisateur
     * 
     * @param User $user L'utilisateur
     * @param string|null $plainToken Le token en clair (si null, utilise celui de l'utilisateur)
     * @return bool Succès ou échec de l'envoi
     */
    public function sendVerificationEmail(User $user, string $plainToken = null): bool
    {
        try {
            // Si un token est fourni, l'utiliser, sinon utiliser celui de l'utilisateur
            $token = $plainToken ?? $user->getVerificationToken();
            
            // Ne pas envoyer un token haché
            if ($token && strpos($token, 'hashed:') === 0) {
                $this->logger->error('Tentative d\'envoi d\'un token haché - erreur', [
                    'user_id' => $user->getId(),
                    'token_preview' => substr($token, 0, 15) . '...'
                ]);
                throw new \LogicException('Impossible d\'envoyer un token haché par email');
            }
            
            // Log du token pour débogage
            $this->logger->debug('Préparation de l\'email avec token', [
                'token_preview' => substr($token, 0, 8) . '...',
                'token_length' => strlen($token)
            ]);
            
            // Génération du lien de vérification
            $verificationLink = $this->frontendUrl . '/verify-email?token=' . $token;
            
            $this->logger->debug('Lien de vérification généré', [
                'link' => $verificationLink
            ]);
    
            $email = (new Email())
                ->from('noreply.atlasbot@gmail.com')  
                ->to($user->getEmail()) 
                ->subject('Confirmez votre adresse e-mail')
                ->html($this->generateEmailTemplate($user, $verificationLink));
    
            $this->mailer->send($email);
            $this->logger->info('Email de vérification envoyé', [
                'user_id' => $user->getId(),
                'email' => $user->getEmail()
            ]);
            
            return true;
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de l\'envoi de l\'email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->getId()
            ]);
            
            // En développement, on ne veut pas bloquer l'inscription même si l'envoi d'email échoue
            return false;
        }
    }
    
    private function generateEmailTemplate(User $user, string $verificationLink): string
    {
        return "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;'>
                <h2 style='color: #333; text-align: center;'>Bienvenue sur Atlas!</h2>
                <p>Bonjour <strong>{$user->getPseudo()}</strong>,</p>
                <p>Merci de vous être inscrit sur Atlas !</p>
                <p>Veuillez cliquer sur le bouton ci-dessous pour activer votre compte :</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='$verificationLink' style='background-color: #F3CB23; color: #1c2a28; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;'>
                        Activer mon compte
                    </a>
                </div>
                <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.</p>
                <hr style='border: 1px solid #eaeaea; margin: 20px 0;'>
                <p style='text-align: center; color: #666; font-size: 12px;'>
                    À bientôt sur <strong>Atlas</strong> ! 🚀<br>
                    L'équipe Atlas
                </p>
            </div>
        ";
    }
}