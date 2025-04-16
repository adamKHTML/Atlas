<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use App\Entity\User;

class MailerService
{
    private MailerInterface $mailer;

    public function __construct(MailerInterface $mailer)
    {
        $this->mailer = $mailer;
    }

    public function sendVerificationEmail(User $user): void
    {
        $verificationLink = 'http://127.0.0.1:8000/verify-email?token=' . $user->getVerificationToken();

        $email = (new Email())
            ->from('BotAtlas <noreply@Atlas.com>')  
            ->to($user->getEmail()) 
            ->subject('Confirmez votre adresse e-mail')
            ->html("
                <p>Bonjour <strong>{$user->getPseudo()}</strong>,</p>
                <p>Merci de vous être inscrit sur Atlas !</p>
                <p>Veuillez cliquer sur le lien ci-dessous pour activer votre compte :</p>
                <p><a href='$verificationLink'>🔗 Activer mon compte</a></p>
                <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.</p>
                <p>À bientôt sur <strong>Atlas</strong> !</p>
                <p>— L'équipe Atlas 🚀</p>
            ");

        $this->mailer->send($email);
    }
}
