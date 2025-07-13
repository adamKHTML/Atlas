<?php

namespace App\Controller\API;

use App\Entity\Ban;
use App\Entity\User;
use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class GestionUserController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    /**
     * GET /api/admin/users - Récupérer tous les utilisateurs pour la gestion
     */
    #[Route('/admin/users', name: 'api_admin_get_users', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getAllUsers(Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur a au moins le rôle MODERATOR
        $user = $this->getUser();
        if (!in_array('ROLE_MODERATOR', $user->getRoles()) && !in_array('ROLE_ADMIN', $user->getRoles())) {
            return new JsonResponse(['error' => 'Accès refusé'], 403);
        }
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = min(50, max(5, (int) $request->query->get('limit', 20)));
            $offset = ($page - 1) * $limit;
            $role = $request->query->get('role');
            $status = $request->query->get('status');
            $search = $request->query->get('search');

            $qb = $this->entityManager->getRepository(User::class)->createQueryBuilder('u');
            
            // Filtres
            if ($role) {
                $qb->andWhere('u.roles LIKE :role')
                   ->setParameter('role', '%' . $role . '%');
            }
            
            if ($search) {
                $qb->andWhere('(u.pseudo LIKE :search OR u.firstname LIKE :search OR u.lastname LIKE :search OR u.email LIKE :search)')
                   ->setParameter('search', '%' . $search . '%');
            }

            // Obtenir les utilisateurs avec pagination
            $users = $qb
                ->orderBy('u.id', 'DESC')
                ->setMaxResults($limit)
                ->setFirstResult($offset)
                ->getQuery()
                ->getResult();

            // Total pour pagination
            $totalQb = $this->entityManager->getRepository(User::class)->createQueryBuilder('u')
                ->select('COUNT(u.id)');
            
            if ($role) {
                $totalQb->andWhere('u.roles LIKE :role')
                        ->setParameter('role', '%' . $role . '%');
            }
            
            if ($search) {
                $totalQb->andWhere('(u.pseudo LIKE :search OR u.firstname LIKE :search OR u.lastname LIKE :search OR u.email LIKE :search)')
                        ->setParameter('search', '%' . $search . '%');
            }

            $total = $totalQb->getQuery()->getSingleScalarResult();

            // Formatage des données utilisateur
            $usersData = array_map(function($user) use ($status) {
                $currentBan = $this->getCurrentBan($user);
                $isBanned = $currentBan !== null;
                
                // Filtrer par statut si spécifié
                if ($status === 'banned' && !$isBanned) return null;
                if ($status === 'active' && $isBanned) return null;

                return [
                    'id' => $user->getId(),
                    'pseudo' => $user->getPseudo(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                    'main_role' => $this->getMainRole($user->getRoles()),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null,
                    'is_verified' => $user->isVerified(),
                    'created_at' => $this->formatDate(new \DateTimeImmutable('2024-01-01')),
                    'is_banned' => $isBanned,
                    'current_ban' => $currentBan ? [
                        'id' => $currentBan->getId(),
                        'reason' => $currentBan->getReason(),
                        'start_date' => $currentBan->getStartDate()->format('Y-m-d'),
                        'end_date' => $currentBan->getEndDate()->format('Y-m-d'),
                        'is_active' => $currentBan->getEndDate() > new \DateTime(),
                        'days_remaining' => max(0, $currentBan->getEndDate()->diff(new \DateTime())->days)
                    ] : null
                ];
            }, $users);

            // Filtrer les nulls (utilisateurs exclus par le filtre statut)
            $usersData = array_filter($usersData);

            return new JsonResponse([
                'users' => array_values($usersData),
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des utilisateurs',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/users/list - Liste simple des utilisateurs pour select/autocomplete
     */
    #[Route('/admin/users/list', name: 'api_admin_get_users_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getUsersListForSelect(): JsonResponse
    {
        // Vérifier que l'utilisateur a au moins le rôle MODERATOR
        $user = $this->getUser();
        if (!in_array('ROLE_MODERATOR', $user->getRoles()) && !in_array('ROLE_ADMIN', $user->getRoles())) {
            return new JsonResponse(['error' => 'Accès refusé'], 403);
        }
        try {
            $users = $this->entityManager->getRepository(User::class)->findBy([
                'isVerified' => true
            ]);

            $usersData = array_map(function($user) {
                $currentBan = $this->getCurrentBan($user);
                return [
                    'id' => $user->getId(),
                    'pseudo' => $user->getPseudo(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                    'main_role' => $this->getMainRole($user->getRoles()),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null,
                    'is_verified' => $user->isVerified(),
                    'is_banned' => $currentBan !== null
                ];
            }, $users);

            return new JsonResponse(['users' => $usersData]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la récupération de la liste des utilisateurs',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/users/stats - Statistiques des utilisateurs
     */
    #[Route('/admin/users/stats', name: 'api_admin_users_stats', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getUsersStats(): JsonResponse
    {
        // Vérifier que l'utilisateur a au moins le rôle MODERATOR
        $user = $this->getUser();
        if (!in_array('ROLE_MODERATOR', $user->getRoles()) && !in_array('ROLE_ADMIN', $user->getRoles())) {
            return new JsonResponse(['error' => 'Accès refusé'], 403);
        }
        try {
            $userRepo = $this->entityManager->getRepository(User::class);
            $banRepo = $this->entityManager->getRepository(Ban::class);

            $totalUsers = $userRepo->count([]);
            $verifiedUsers = $userRepo->count(['isVerified' => true]);
            $unverifiedUsers = $totalUsers - $verifiedUsers;

            // Compter les utilisateurs bannis actuellement
            $activeBans = $banRepo->createQueryBuilder('b')
                ->where('b.end_date > :now')
                ->setParameter('now', new \DateTime())
                ->getQuery()
                ->getResult();

            $bannedUsers = count($activeBans);

            // Statistiques par rôle
            $adminCount = $userRepo->createQueryBuilder('u')
                ->select('COUNT(u.id)')
                ->where('u.roles LIKE :role')
                ->setParameter('role', '%ROLE_ADMIN%')
                ->getQuery()
                ->getSingleScalarResult();

            $moderatorCount = $userRepo->createQueryBuilder('u')
                ->select('COUNT(u.id)')
                ->where('u.roles LIKE :role')
                ->setParameter('role', '%ROLE_MODERATOR%')
                ->getQuery()
                ->getSingleScalarResult();

            $travelerCount = $userRepo->createQueryBuilder('u')
                ->select('COUNT(u.id)')
                ->where('u.roles LIKE :role')
                ->setParameter('role', '%ROLE_TRAVELER%')
                ->getQuery()
                ->getSingleScalarResult();

            return new JsonResponse([
                'total_users' => $totalUsers,
                'verified_users' => $verifiedUsers,
                'unverified_users' => $unverifiedUsers,
                'banned_users' => $bannedUsers,
                'active_users' => $totalUsers - $bannedUsers,
                'roles_distribution' => [
                    'admins' => $adminCount,
                    'moderators' => $moderatorCount,
                    'travelers' => $travelerCount,
                    'users' => $totalUsers - $adminCount - $moderatorCount - $travelerCount
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des statistiques',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/admin/users/{id}/ban - Bannir un utilisateur
     */
    #[Route('/admin/users/{id}/ban', name: 'api_admin_ban_user', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function banUser(int $id, Request $request): JsonResponse
    {
        $currentUser = $this->getUser();
        // Vérifier que l'utilisateur a au moins le rôle MODERATOR
        if (!in_array('ROLE_MODERATOR', $currentUser->getRoles()) && !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return new JsonResponse(['error' => 'Accès refusé'], 403);
        }
        try {
            $data = json_decode($request->getContent(), true);

            $user = $this->entityManager->getRepository(User::class)->find($id);
            if (!$user) {
                return new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
            }

            // Vérifier qu'on ne peut pas se bannir soi-même
            if ($user->getId() === $currentUser->getId()) {
                return new JsonResponse(['error' => 'Vous ne pouvez pas vous bannir vous-même'], 400);
            }

            // Empêcher les modérateurs de bannir des admins
            if (in_array('ROLE_ADMIN', $user->getRoles()) && !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
                return new JsonResponse(['error' => 'Vous ne pouvez pas bannir un administrateur'], 403);
            }

            $duration = $data['duration'] ?? 1;
            $reason = trim($data['reason'] ?? 'Violation des règles de la communauté');
            $notify = $data['notify'] ?? true;

            if (empty($reason)) {
                return new JsonResponse(['error' => 'La raison du bannissement est obligatoire'], 400);
            }

            // Calculer la date de fin
            $startDate = new \DateTime();
            $endDate = (clone $startDate)->modify("+{$duration} days");

            // Créer le ban
            $ban = new Ban();
            $ban->setUser($user);
            $ban->setStartDate($startDate);
            $ban->setEndDate($endDate);
            $ban->setReason($reason);

            $this->entityManager->persist($ban);

            // Créer notification si demandé
            if ($notify) {
                $durationText = $duration === 1 ? '1 jour' : "{$duration} jours";
                $notificationContent = "🚫 Votre compte a été suspendu pour {$durationText}.\n\nRaison: {$reason}\n\nFin de la suspension: " . $endDate->format('d/m/Y à H:i');

                $notification = new Notification();
                $notification->setUser($user);
                $notification->setTypeNotification('system');
                $notification->setContentNotification($notificationContent);
                $notification->setIsRead(false);
                $notification->setCreatedAt(new \DateTimeImmutable());

                $this->entityManager->persist($notification);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'message' => 'Utilisateur banni avec succès',
                'ban' => [
                    'id' => $ban->getId(),
                    'start_date' => $ban->getStartDate()->format('Y-m-d H:i:s'),
                    'end_date' => $ban->getEndDate()->format('Y-m-d H:i:s'),
                    'reason' => $ban->getReason(),
                    'duration_days' => $duration
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors du bannissement',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/admin/users/{id}/unban - Débannir un utilisateur
     */
    #[Route('/admin/users/{id}/unban', name: 'api_admin_unban_user', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function unbanUser(int $id): JsonResponse
    {
        // Vérifier que l'utilisateur a au moins le rôle MODERATOR
        $currentUser = $this->getUser();
        if (!in_array('ROLE_MODERATOR', $currentUser->getRoles()) && !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return new JsonResponse(['error' => 'Accès refusé'], 403);
        }
        try {
            $user = $this->entityManager->getRepository(User::class)->find($id);
            if (!$user) {
                return new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
            }

            $currentBan = $this->getCurrentBan($user);
            if (!$currentBan) {
                return new JsonResponse(['error' => 'Cet utilisateur n\'est pas banni'], 400);
            }

            // Mettre la date de fin à maintenant pour terminer le ban
            $currentBan->setEndDate(new \DateTime());
            
            // Créer notification de débannissement
            $notification = new Notification();
            $notification->setUser($user);
            $notification->setTypeNotification('system');
            $notification->setContentNotification("✅ Votre suspension a été levée. Vous pouvez à nouveau accéder normalement à Atlas.\n\nMerci de respecter les règles de la communauté.");
            $notification->setIsRead(false);
            $notification->setCreatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($notification);
            $this->entityManager->flush();

            return new JsonResponse(['message' => 'Utilisateur débanni avec succès']);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors du débannissement',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/admin/users/{id}/role - Changer le rôle d'un utilisateur (Admin uniquement)
     */
    #[Route('/admin/users/{id}/role', name: 'api_admin_change_user_role', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function changeUserRole(int $id, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $currentUser = $this->getUser();

            $user = $this->entityManager->getRepository(User::class)->find($id);
            if (!$user) {
                return new JsonResponse(['error' => 'Utilisateur non trouvé'], 404);
            }

            $newRole = $data['new_role'] ?? '';
            $notify = $data['notify'] ?? true;

            $validRoles = ['ROLE_USER', 'ROLE_TRAVELER', 'ROLE_MODERATOR', 'ROLE_ADMIN'];
            if (!in_array($newRole, $validRoles)) {
                return new JsonResponse(['error' => 'Rôle invalide'], 400);
            }

            // Empêcher de se rétrograder soi-même en tant qu'admin
            if ($user->getId() === $currentUser->getId() && $newRole !== 'ROLE_ADMIN') {
                return new JsonResponse(['error' => 'Vous ne pouvez pas changer votre propre rôle d\'administrateur'], 400);
            }

            $oldRoles = $user->getRoles();
            $oldMainRole = $this->getMainRole($oldRoles);

            // Mettre à jour les rôles
            $newRoles = ['ROLE_USER']; // Base role
            if ($newRole !== 'ROLE_USER') {
                $newRoles[] = $newRole;
            }

            $user->setRoles($newRoles);

            // Créer notification si demandé
            if ($notify) {
                $newMainRole = $this->getMainRole($newRoles);
                $notificationContent = "🎭 Votre rôle sur Atlas a été modifié.\n\nAncien rôle: {$oldMainRole}\nNouveau rôle: {$newMainRole}\n\nVos permissions ont été mises à jour.";

                $notification = new Notification();
                $notification->setUser($user);
                $notification->setTypeNotification('system');
                $notification->setContentNotification($notificationContent);
                $notification->setIsRead(false);
                $notification->setCreatedAt(new \DateTimeImmutable());

                $this->entityManager->persist($notification);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'message' => 'Rôle modifié avec succès',
                'user' => [
                    'id' => $user->getId(),
                    'old_role' => $oldMainRole,
                    'new_role' => $this->getMainRole($user->getRoles()),
                    'roles' => $user->getRoles()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors du changement de rôle',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/users/search - Rechercher des utilisateurs
     */
    #[Route('/admin/users/search', name: 'api_admin_search_users', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function searchUsers(Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur a au moins le rôle MODERATOR
        $currentUser = $this->getUser();
        if (!in_array('ROLE_MODERATOR', $currentUser->getRoles()) && !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return new JsonResponse(['error' => 'Accès refusé'], 403);
        }
        try {
            $query = $request->query->get('q', '');
            
            if (strlen($query) < 2) {
                return new JsonResponse(['users' => []]);
            }

            $users = $this->entityManager->getRepository(User::class)->createQueryBuilder('u')
                ->where('u.pseudo LIKE :query OR u.firstname LIKE :query OR u.lastname LIKE :query OR u.email LIKE :query')
                ->setParameter('query', '%' . $query . '%')
                ->setMaxResults(10)
                ->getQuery()
                ->getResult();

            $usersData = array_map(function($user) {
                $currentBan = $this->getCurrentBan($user);
                return [
                    'id' => $user->getId(),
                    'pseudo' => $user->getPseudo(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'email' => $user->getEmail(),
                    'main_role' => $this->getMainRole($user->getRoles()),
                    'is_banned' => $currentBan !== null,
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null
                ];
            }, $users);

            return new JsonResponse(['users' => $usersData]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la recherche',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ========== MÉTHODES UTILITAIRES ==========

    /**
     * Obtenir le ban actuel d'un utilisateur (s'il existe)
     */
    private function getCurrentBan(User $user): ?Ban
    {
        $activeBan = $this->entityManager->getRepository(Ban::class)->createQueryBuilder('b')
            ->where('b.user = :user')
            ->andWhere('b.end_date > :now')
            ->setParameter('user', $user)
            ->setParameter('now', new \DateTime())
            ->orderBy('b.end_date', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $activeBan;
    }

    /**
     * Obtenir le rôle principal d'un utilisateur
     */
    private function getMainRole(array $roles): string
    {
        if (in_array('ROLE_ADMIN', $roles)) return 'Administrateur';
        if (in_array('ROLE_MODERATOR', $roles)) return 'Modérateur';
        if (in_array('ROLE_TRAVELER', $roles)) return 'Voyageur';
        return 'Utilisateur';
    }

    /**
     * Formater une date relative
     */
    private function formatDate(\DateTimeInterface $date): string
    {
        $now = new \DateTime();
        $diff = $now->getTimestamp() - $date->getTimestamp();

        if ($diff < 60) {
            return "À l'instant";
        } elseif ($diff < 3600) {
            $minutes = floor($diff / 60);
            return "Il y a {$minutes} minute" . ($minutes > 1 ? 's' : '');
        } elseif ($diff < 86400) {
            $hours = floor($diff / 3600);
            return "Il y a {$hours} heure" . ($hours > 1 ? 's' : '');
        } elseif ($diff < 604800) {
            $days = floor($diff / 86400);
            return "Il y a {$days} jour" . ($days > 1 ? 's' : '');
        } else {
            return $date->format('d/m/Y à H:i');
        }
    }
}