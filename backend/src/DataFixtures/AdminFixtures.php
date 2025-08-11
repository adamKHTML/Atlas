<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AdminFixtures extends Fixture
{
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public function load(ObjectManager $manager): void
    {
       
        $admin1 = new User();
        $admin1->setFirstname('Adam');
        $admin1->setLastname('Konaté');
        $admin1->setPseudo('Argie');
        $admin1->setEmail('Argentikk@gmail.com');
        
        // Hash du mot de passe
        $hashedPassword1 = $this->passwordHasher->hashPassword($admin1, '@Argentikk_2025_Royal703');
        $admin1->setPassword($hashedPassword1);
        
        // Rôles admin
        $admin1->setRoles(['ROLE_ADMIN']);
        
        // Compte vérifié
        $admin1->setIsVerified(true);
        
        // Pas d'image pour éviter les complications
        $admin1->setProfilePicture(null);
        
        $manager->persist($admin1);

        // Admin 2: Admin Test
        $admin2 = new User();
        $admin2->setFirstname('Admin');
        $admin2->setLastname('Test');
        $admin2->setPseudo('AdminTest');
        $admin2->setEmail('admin@atlas.com');
        
        // Hash du mot de passe
        $hashedPassword2 = $this->passwordHasher->hashPassword($admin2, '@nonymous_06082520');
        $admin2->setPassword($hashedPassword2);
        
        // Rôles admin
        $admin2->setRoles(['ROLE_ADMIN']);
        
        // Compte vérifié
        $admin2->setIsVerified(true);
        
        // Pas d'image
        $admin2->setProfilePicture(null);
        
        $manager->persist($admin2);

        // Sauvegarde en base
        $manager->flush();
    }
}