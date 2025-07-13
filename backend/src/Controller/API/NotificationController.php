<?php

namespace App\Controller\API;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class NotificationController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

   /**
 * GET /api/notifications - Récupérer TOUTES les notifications de messagerie
 */
#[Route('/notifications', name: 'api_get_user_notifications', methods: ['GET'])]
#[IsGranted('ROLE_USER')]
public function getUserNotifications(Request $request): JsonResponse
{
    try {
        $user = $this->getUser();
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(100, max(5, (int) $request->query->get('limit', 100)));
        $offset = ($page - 1) * $limit;

        // 🔥 RÉCUPÉRER TOUTES LES NOTIFICATIONS DE MESSAGERIE 
        // (les miennes reçues + celles où je suis l'expéditeur)
        $qb = $this->entityManager->getRepository(Notification::class)->createQueryBuilder('n');
        
        $notifications = $qb
            ->where('n.user = :user') // Messages que je reçois
            ->orWhere('n.content_notification LIKE :senderPattern') // Messages que j'envoie
            ->andWhere('n.type_notification = :type')
            ->setParameter('user', $user)
            ->setParameter('senderPattern', '%[SENDER:' . $user->getId() . ']%')
            ->setParameter('type', 'message')
            ->orderBy('n.created_at', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();

        // Ajouter user_id dans la réponse pour identifier le destinataire
        $notificationsData = array_map(function($notification) {
            return [
                'id' => $notification->getId(),
                'user_id' => $notification->getUser()->getId(), // 🆕 AJOUTÉ
                'type_notification' => $notification->getTypeNotification(),
                'content_notification' => $notification->getContentNotification(),
                'is_read' => $notification->isRead(),
                'created_at' => $notification->getCreatedAt()->format('Y-m-d H:i:s'),
                'created_at_formatted' => $this->formatDate($notification->getCreatedAt())
            ];
        }, $notifications);

        return new JsonResponse([
            'notifications' => $notificationsData,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => count($notifications), // Approximation
                'pages' => 1
            ],
            'unread_count' => 0 // On s'en fout pour la messagerie
        ]);

    } catch (\Exception $e) {
        return new JsonResponse([
            'error' => 'Erreur lors de la récupération des notifications',
            'message' => $e->getMessage()
        ], 500);
    }
}

    /**
     * POST /api/notifications - Créer une nouvelle notification
     */
    #[Route('/notifications', name: 'api_create_notification', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function createNotification(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $currentUser = $this->getUser();

            if (!isset($data['type_notification'])) {
                return new JsonResponse([
                    'error' => 'Données manquantes (type_notification requis)'
                ], 400);
            }

            $type = $data['type_notification'];
            
            // 🆕 Gestion de l'envoi en masse pour les admins
            if (isset($data['recipient_id']) && $data['recipient_id'] === 'all') {
                if (!in_array('ROLE_ADMIN', $currentUser->getRoles())) {
                    return new JsonResponse([
                        'error' => 'Seuls les administrateurs peuvent envoyer des messages en masse'
                    ], 403);
                }

                return $this->createBulkNotification($data, $currentUser);
            }

            // Envoi individuel
            if (!isset($data['recipient_id'])) {
                return new JsonResponse([
                    'error' => 'Données manquantes (recipient_id requis)'
                ], 400);
            }

            // Vérifier le destinataire ET qu'il soit vérifié
            $recipient = $this->entityManager->getRepository(User::class)->findOneBy([
                'id' => $data['recipient_id'],
                'isVerified' => true
            ]);
            
            if (!$recipient) {
                return new JsonResponse(['error' => 'Utilisateur destinataire non trouvé ou non vérifié'], 404);
            }

            if ($type === 'message') {
                $content = trim($data['content_notification'] ?? '');
                if (empty($content)) {
                    return new JsonResponse(['error' => 'Le contenu du message ne peut pas être vide'], 400);
                }

                // ✅ REMETTRE l'ajout automatique des données SENDER pour la messagerie
                $senderData = [
                    'id' => $currentUser->getId(),
                    'pseudo' => $currentUser->getPseudo(),
                    'profile_picture' => $currentUser->getProfilePicture()
                ];
                
                $senderDataEncoded = base64_encode(json_encode($senderData));
                $content .= "[SENDER:{$currentUser->getId()}][SENDER_DATA:{$senderDataEncoded}]";

            } elseif ($type === 'system') {
                if (!in_array('ROLE_ADMIN', $currentUser->getRoles())) {
                    return new JsonResponse([
                        'error' => 'Seuls les administrateurs peuvent envoyer des messages système'
                    ], 403);
                }
                $content = trim($data['content_notification'] ?? '');
                if (empty($content)) {
                    return new JsonResponse(['error' => 'Le contenu du message système ne peut pas être vide'], 400);
                }
            } else {
                return new JsonResponse(['error' => 'Type de notification non valide'], 400);
            }

            $notification = new Notification();
            $notification->setUser($recipient);
            $notification->setTypeNotification($type);
            $notification->setContentNotification($content);
            $notification->setIsRead(false);
            $notification->setCreatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($notification);
            $this->entityManager->flush();

            return new JsonResponse([
                'message' => 'Notification créée avec succès',
                'notification' => [
                    'id' => $notification->getId(),
                    'type_notification' => $notification->getTypeNotification(),
                    'content_notification' => $notification->getContentNotification(),
                    'created_at' => $notification->getCreatedAt()->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la création de la notification',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 Fonction pour créer une notification en masse
     */
    private function createBulkNotification($data, $currentUser): JsonResponse
    {
        try {
            $content = trim($data['content_notification'] ?? '');
            if (empty($content)) {
                return new JsonResponse(['error' => 'Le contenu du message ne peut pas être vide'], 400);
            }

            // Récupérer tous les utilisateurs vérifiés sauf l'expéditeur
            $users = $this->entityManager->getRepository(User::class)->findBy([
                'isVerified' => true
            ]);

            // ✅ Ajouter les données SENDER pour l'envoi en masse aussi
            $senderData = [
                'id' => $currentUser->getId(),
                'pseudo' => $currentUser->getPseudo(),
                'profile_picture' => $currentUser->getProfilePicture()
            ];
            
            $senderDataEncoded = base64_encode(json_encode($senderData));
            $contentWithSender = $content . "[SENDER:{$currentUser->getId()}][SENDER_DATA:{$senderDataEncoded}]";

            $sentCount = 0;
            foreach ($users as $user) {
                // Ne pas s'envoyer à soi-même
                if ($user->getId() === $currentUser->getId()) {
                    continue;
                }

                $notification = new Notification();
                $notification->setUser($user);
                $notification->setTypeNotification('message');
                $notification->setContentNotification($contentWithSender);
                $notification->setIsRead(false);
                $notification->setCreatedAt(new \DateTimeImmutable());

                $this->entityManager->persist($notification);
                $sentCount++;
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'message' => "Message envoyé en masse avec succès à {$sentCount} utilisateurs",
                'sent_count' => $sentCount
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de l\'envoi en masse',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/notifications/{id}/read - Marquer une notification comme lue
     */
    #[Route('/notifications/{id}/read', name: 'api_mark_notification_read', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function markAsRead(int $id): JsonResponse
    {
        try {
            $user = $this->getUser();
            $notification = $this->entityManager->getRepository(Notification::class)->find($id);

            if (!$notification) {
                return new JsonResponse(['error' => 'Notification non trouvée'], 404);
            }

            if ($notification->getUser()->getId() !== $user->getId()) {
                return new JsonResponse(['error' => 'Accès non autorisé'], 403);
            }

            $notification->setIsRead(true);
            $this->entityManager->flush();

            return new JsonResponse(['message' => 'Notification marquée comme lue']);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la mise à jour',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/notifications/{id} - Supprimer une notification
     */
    #[Route('/notifications/{id}', name: 'api_delete_notification', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function deleteNotification(int $id): JsonResponse
    {
        try {
            $user = $this->getUser();
            $notification = $this->entityManager->getRepository(Notification::class)->find($id);

            if (!$notification) {
                return new JsonResponse(['error' => 'Notification non trouvée'], 404);
            }

            // Vérifier que l'utilisateur peut supprimer cette notification
            if ($notification->getUser()->getId() !== $user->getId() && 
                !in_array('ROLE_ADMIN', $user->getRoles())) {
                return new JsonResponse(['error' => 'Accès non autorisé'], 403);
            }

            $this->entityManager->remove($notification);
            $this->entityManager->flush();

            return new JsonResponse(['message' => 'Notification supprimée avec succès']);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la suppression',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/notifications/users/list - Liste des utilisateurs VÉRIFIÉS pour le select
     */
    #[Route('/notifications/users/list', name: 'api_get_users_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getUsersList(): JsonResponse
    {
        try {
            // ✅ Filtrer uniquement les utilisateurs vérifiés (isVerified = true)
            $users = $this->entityManager->getRepository(User::class)->findBy([
                'isVerified' => true
            ]);

            $usersData = array_map(function($user) {
                return [
                    'id' => $user->getId(),
                    'pseudo' => $user->getPseudo(),
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'roles' => $user->getRoles(),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null,
                    'main_role' => $this->getMainRole($user->getRoles()),
                    'is_verified' => $user->isVerified()
                ];
            }, $users);

            return new JsonResponse(['users' => $usersData]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des utilisateurs',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/notifications/unread-count - Nombre de notifications non lues
     */
    #[Route('/notifications/unread-count', name: 'api_get_unread_count', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getUnreadCount(): JsonResponse
    {
        try {
            $user = $this->getUser();
            $unreadCount = $this->entityManager->getRepository(Notification::class)
                ->count([
                    'user' => $user, 
                    'is_read' => false,
                    'type_notification' => 'message' // ✅ Compter seulement les messages
                ]);

            return new JsonResponse(['unread_count' => $unreadCount]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors du comptage',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function formatDate(\DateTimeImmutable $date): string
    {
        $now = new \DateTimeImmutable();
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

    private function getMainRole(array $roles): string
    {
        if (in_array('ROLE_ADMIN', $roles)) return 'Admin';
        if (in_array('ROLE_MODERATOR', $roles)) return 'Modérateur';
        if (in_array('ROLE_TRAVELER', $roles)) return 'Voyageur';
        return 'Utilisateur';
    }
}