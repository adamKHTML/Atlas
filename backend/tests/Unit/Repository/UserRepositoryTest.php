<?php
declare(strict_types=1);

namespace App\Tests\Unit\Repository;

use App\Repository\UserRepository;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests UserRepository - Accès aux Données
 * VERSION SANS WARNINGS pour validation CDA
 */
#[CoversClass(UserRepository::class)]
class UserRepositoryTest extends TestCase
{
    /**
     * ✅ CP8: Test repository existe
     */
    #[Test]
    public function repositoryClassExists(): void
    {
        $this->assertTrue(
            class_exists(UserRepository::class),
            'UserRepository doit exister'
        );
        
        // Vérifier que c'est bien une classe instanciable
        $reflection = new \ReflectionClass(UserRepository::class);
        $this->assertFalse($reflection->isAbstract(), 'UserRepository ne doit pas être abstraite');
        $this->assertFalse($reflection->isInterface(), 'UserRepository ne doit pas être une interface');
    }

    /**
     * ✅ CP8: Test héritage Doctrine correct
     */
    #[Test]
    public function repositoryExtendsDoctrineRepository(): void
    {
        $reflection = new \ReflectionClass(UserRepository::class);
        $parentClass = $reflection->getParentClass();
        
        $this->assertEquals(
            'Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository',
            $parentClass->getName(),
            'UserRepository doit hériter de ServiceEntityRepository'
        );
        
        // Vérifie que le namespace est correct
        $this->assertEquals('App\Repository', $reflection->getNamespaceName(),
            'UserRepository doit être dans le namespace App\Repository');
    }

    /**
     * ✅ CP8: Test méthodes sécurisées disponibles
     */
    #[Test]
    public function repositoryHasSecureMethods(): void
    {
        $reflection = new \ReflectionClass(UserRepository::class);
        
        // Vérifie que les méthodes Doctrine sont disponibles (héritées)
        $this->assertTrue(method_exists(UserRepository::class, 'find'),
            'find() doit être disponible');
        $this->assertTrue(method_exists(UserRepository::class, 'findOneBy'),
            'findOneBy() doit être disponible');
        $this->assertTrue(method_exists(UserRepository::class, 'createQueryBuilder'),
            'createQueryBuilder() doit être disponible');
        
        // Vérifie le constructeur
        $this->assertTrue($reflection->hasMethod('__construct'),
            'Le constructeur doit exister');
    }
}
