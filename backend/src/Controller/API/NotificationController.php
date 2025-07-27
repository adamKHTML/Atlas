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
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api')]
class NotificationController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private ValidatorInterface $validator;

    public function __construct(EntityManagerInterface $entityManager, ValidatorInterface $validator)
    {
        $this->entityManager = $entityManager;
        $this->validator = $validator;
    }

    /**
     * GET /api/notifications - Récupérer les messages de l'utilisateur
     */
    #[Route('/notifications', name: 'api_get_user_notifications', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getUserNotifications(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            
            // Validation des paramètres
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = min(100, max(5, (int) $request->query->get('limit', 100)));
            $offset = ($page - 1) * $limit;

            // Récupérer TOUTES les notifications impliquant l'utilisateur
            $qb = $this->entityManager->getRepository(Notification::class)->createQueryBuilder('n');
            
            $notifications = $qb
                ->where('n.type_notification = :type')
                ->andWhere(
                    $qb->expr()->orX(
                        'n.user = :user', // Messages reçus
                        'n.content_notification LIKE :senderPattern' // Messages envoyés
                    )
                )
                ->setParameter('user', $user)
                ->setParameter('senderPattern', '%[SENDER:' . $user->getId() . ']%')
                ->setParameter('type', 'message')
                ->orderBy('n.created_at', 'DESC')
                ->setMaxResults($limit)
                ->setFirstResult($offset)
                ->getQuery()
                ->getResult();

            // Traitement sécurisé des données
            $notificationsData = array_map(function($notification) use ($user) {
                // Extraction sécurisée des données de l'expéditeur
                $senderData = $this->extractSenderData($notification->getContentNotification());
                
                return [
                    'id' => $notification->getId(),
                    'user_id' => $notification->getUser()->getId(),
                    'sender_id' => $senderData ? $senderData['id'] : null,
                    'type_notification' => $notification->getTypeNotification(),
                    'content_notification' => $this->sanitizeContent($notification->getContentNotification()),
                    'is_read' => $notification->isRead(),
                    'created_at' => $notification->getCreatedAt()->format('Y-m-d H:i:s'),
                    'created_at_formatted' => $this->formatDate($notification->getCreatedAt()),
                    'is_sent_by_me' => $senderData && $senderData['id'] === $user->getId()
                ];
            }, $notifications);

            // Compter uniquement les messages non lus REÇUS
            $unreadCount = $this->entityManager->getRepository(Notification::class)
                ->createQueryBuilder('n')
                ->select('COUNT(n)')
                ->where('n.user = :user')
                ->andWhere('n.is_read = false')
                ->andWhere('n.type_notification = :type')
                ->andWhere('n.content_notification NOT LIKE :senderPattern')
                ->setParameter('user', $user)
                ->setParameter('type', 'message')
                ->setParameter('senderPattern', '%[SENDER:' . $user->getId() . ']%')
                ->getQuery()
                ->getSingleScalarResult();

            return new JsonResponse([
                'notifications' => $notificationsData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => count($notifications),
                    'pages' => ceil(count($notifications) / $limit)
                ],
                'unread_count' => (int) $unreadCount
            ]);

        } catch (\Exception $e) {
            $this->logError('Erreur lors de la récupération des notifications', $e);
            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des notifications'
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

            // Validation des données
            if (!$this->validateNotificationData($data)) {
                return new JsonResponse([
                    'error' => 'Données invalides'
                ], 400);
            }

            $type = $this->sanitizeInput($data['type_notification']);
            
            // Gestion de l'envoi en masse pour les admins
            if (isset($data['recipient_id']) && $data['recipient_id'] === 'all') {
                if (!$this->isGranted('ROLE_ADMIN')) {
                    return new JsonResponse([
                        'error' => 'Accès non autorisé'
                    ], 403);
                }
                return $this->createBulkNotification($data, $currentUser);
            }

            // Validation du destinataire
            if (!isset($data['recipient_id']) || !is_numeric($data['recipient_id'])) {
                return new JsonResponse([
                    'error' => 'Destinataire invalide'
                ], 400);
            }

            $recipientId = (int) $data['recipient_id'];
            
            // Empêcher l'envoi à soi-même
            if ($recipientId === $currentUser->getId()) {
                return new JsonResponse([
                    'error' => 'Vous ne pouvez pas vous envoyer un message à vous-même'
                ], 400);
            }

            // Vérifier le destinataire
            $recipient = $this->entityManager->getRepository(User::class)->findOneBy([
                'id' => $recipientId,
                'isVerified' => true
            ]);
            
            if (!$recipient) {
                return new JsonResponse([
                    'error' => 'Utilisateur destinataire non trouvé ou non vérifié'
                ], 404);
            }

            // Traitement du contenu selon le type
            if ($type === 'message') {
                $content = $this->sanitizeInput($data['content_notification'] ?? '');
                if (empty($content)) {
                    return new JsonResponse(['error' => 'Le contenu du message ne peut pas être vide'], 400);
                }

                // Limite de longueur
                if (strlen($content) > 5000) {
                    return new JsonResponse(['error' => 'Le message est trop long (max 5000 caractères)'], 400);
                }

                // Ajouter les données de l'expéditeur de manière sécurisée
                $senderData = [
                    'id' => $currentUser->getId(),
                    'pseudo' => $currentUser->getPseudo(),
                    'profile_picture' => $currentUser->getProfilePicture(),
                    'firstname' => $currentUser->getFirstname(),
                    'lastname' => $currentUser->getLastname()
                ];
                
                $senderDataEncoded = base64_encode(json_encode($senderData));
                $content .= "[SENDER:{$currentUser->getId()}][SENDER_DATA:{$senderDataEncoded}]";

            } elseif ($type === 'system') {
                if (!$this->isGranted('ROLE_ADMIN')) {
                    return new JsonResponse([
                        'error' => 'Accès non autorisé'
                    ], 403);
                }
                $content = $this->sanitizeInput($data['content_notification'] ?? '');
                if (empty($content)) {
                    return new JsonResponse(['error' => 'Le contenu du message système ne peut pas être vide'], 400);
                }
            } else {
                return new JsonResponse(['error' => 'Type de notification non valide'], 400);
            }

            // Créer la notification
            $notification = new Notification();
            $notification->setUser($recipient);
            $notification->setTypeNotification($type);
            $notification->setContentNotification($content);
            $notification->setIsRead(false);
            $notification->setCreatedAt(new \DateTimeImmutable());

            // Validation de l'entité
            $errors = $this->validator->validate($notification);
            if (count($errors) > 0) {
                return new JsonResponse([
                    'error' => 'Données invalides',
                    'details' => (string) $errors
                ], 400);
            }

            $this->entityManager->persist($notification);
            $this->entityManager->flush();

            return new JsonResponse([
                'message' => 'Notification créée avec succès',
                'notification' => [
                    'id' => $notification->getId(),
                    'type_notification' => $notification->getTypeNotification(),
                    'content_notification' => $this->sanitizeContent($notification->getContentNotification()),
                    'created_at' => $notification->getCreatedAt()->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            $this->logError('Erreur lors de la création de la notification', $e);
            return new JsonResponse([
                'error' => 'Erreur lors de la création de la notification'
            ], 500);
        }
    }

    /**
     * Fonction pour créer une notification en masse (Admin uniquement)
     */
    private function createBulkNotification($data, $currentUser): JsonResponse
    {
        try {
            $content = $this->sanitizeInput($data['content_notification'] ?? '');
            if (empty($content)) {
                return new JsonResponse(['error' => 'Le contenu du message ne peut pas être vide'], 400);
            }

            // Récupérer tous les utilisateurs vérifiés sauf l'expéditeur
            $users = $this->entityManager->getRepository(User::class)
                ->createQueryBuilder('u')
                ->where('u.isVerified = true')
                ->andWhere('u.id != :currentUserId')
                ->setParameter('currentUserId', $currentUser->getId())
                ->getQuery()
                ->getResult();

            // Ajouter les données SENDER
            $senderData = [
                'id' => $currentUser->getId(),
                'pseudo' => $currentUser->getPseudo(),
                'profile_picture' => $currentUser->getProfilePicture(),
                'firstname' => $currentUser->getFirstname(),
                'lastname' => $currentUser->getLastname()
            ];
            
            $senderDataEncoded = base64_encode(json_encode($senderData));
            $contentWithSender = $content . "[SENDER:{$currentUser->getId()}][SENDER_DATA:{$senderDataEncoded}]";

            $sentCount = 0;
            foreach ($users as $user) {
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
            $this->logError('Erreur lors de l\'envoi en masse', $e);
            return new JsonResponse([
                'error' => 'Erreur lors de l\'envoi en masse'
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

            // Vérifier les permissions
            if ($notification->getUser()->getId() !== $user->getId()) {
                return new JsonResponse(['error' => 'Accès non autorisé'], 403);
            }

            $notification->setIsRead(true);
            $this->entityManager->flush();

            return new JsonResponse(['message' => 'Notification marquée comme lue']);

        } catch (\Exception $e) {
            $this->logError('Erreur lors de la mise à jour', $e);
            return new JsonResponse([
                'error' => 'Erreur lors de la mise à jour'
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

            // Vérifier les permissions
            if ($notification->getUser()->getId() !== $user->getId() && 
                !$this->isGranted('ROLE_ADMIN')) {
                return new JsonResponse(['error' => 'Accès non autorisé'], 403);
            }

            $this->entityManager->remove($notification);
            $this->entityManager->flush();

            return new JsonResponse(['message' => 'Notification supprimée avec succès']);

        } catch (\Exception $e) {
            $this->logError('Erreur lors de la suppression', $e);
            return new JsonResponse([
                'error' => 'Erreur lors de la suppression'
            ], 500);
        }
    }

    /**
     * GET /api/notifications/users/list - Liste des utilisateurs VÉRIFIÉS pour le select
     */
    #[Route('/notifications/users/list', name: 'api_get_users_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getUsersList(Request $request): JsonResponse
    {
        try {
            $currentUser = $this->getUser();
            $search = $this->sanitizeInput($request->query->get('search', ''));
            
            // Créer la requête
            $qb = $this->entityManager->getRepository(User::class)->createQueryBuilder('u')
                ->where('u.isVerified = true')
                ->andWhere('u.id != :currentUserId')
                ->setParameter('currentUserId', $currentUser->getId());

            // Ajouter la recherche si fournie
            if (!empty($search)) {
                $qb->andWhere(
                    $qb->expr()->orX(
                        'u.pseudo LIKE :search',
                        'u.firstname LIKE :search',
                        'u.lastname LIKE :search'
                    )
                )
                ->setParameter('search', '%' . $search . '%');
            }

            $users = $qb->orderBy('u.pseudo', 'ASC')->getQuery()->getResult();

            $usersData = array_map(function($user) {
                return [
                    'id' => $user->getId(),
                    'pseudo' => htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'),
                    'firstname' => htmlspecialchars($user->getFirstname(), ENT_QUOTES, 'UTF-8'),
                    'lastname' => htmlspecialchars($user->getLastname(), ENT_QUOTES, 'UTF-8'),
                    'roles' => $user->getRoles(),
                    'profile_picture' => $user->getProfilePicture() ? 
                        'http://localhost:8000' . $user->getProfilePicture() : null,
                    'main_role' => $this->getMainRole($user->getRoles()),
                    'is_verified' => $user->isVerified()
                ];
            }, $users);

            return new JsonResponse(['users' => $usersData]);

        } catch (\Exception $e) {
            $this->logError('Erreur lors de la récupération des utilisateurs', $e);
            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des utilisateurs'
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
            
            // Compter uniquement les messages REÇUS non lus
            $unreadCount = $this->entityManager->getRepository(Notification::class)
                ->createQueryBuilder('n')
                ->select('COUNT(n)')
                ->where('n.user = :user')
                ->andWhere('n.is_read = false')
                ->andWhere('n.type_notification = :type')
                ->andWhere('n.content_notification NOT LIKE :senderPattern')
                ->setParameter('user', $user)
                ->setParameter('type', 'message')
                ->setParameter('senderPattern', '%[SENDER:' . $user->getId() . ']%')
                ->getQuery()
                ->getSingleScalarResult();

            return new JsonResponse(['unread_count' => (int) $unreadCount]);

        } catch (\Exception $e) {
            $this->logError('Erreur lors du comptage', $e);
            return new JsonResponse([
                'error' => 'Erreur lors du comptage'
            ], 500);
        }
    }

    /**
     * Méthodes utilitaires privées
     */
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

    /**
     * Méthodes de sécurité
     */
    private function sanitizeInput(string $input): string
    {
        // Nettoyer l'entrée
        $input = trim($input);
        $input = stripslashes($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        
        // Supprimer les balises HTML potentiellement dangereuses
        $input = strip_tags($input);
        
        return $input;
    }

    private function sanitizeContent(string $content): string
    {
        // Supprimer les données SENDER pour l'affichage
        $content = preg_replace('/\[SENDER:\d+\]\[SENDER_DATA:[A-Za-z0-9+\/=]+\]/', '', $content);
        return htmlspecialchars(trim($content), ENT_QUOTES, 'UTF-8');
    }

    private function extractSenderData(string $content): ?array
    {
        if (preg_match('/\[SENDER:(\d+)\]\[SENDER_DATA:([A-Za-z0-9+\/=]+)\]/', $content, $matches)) {
            try {
                $senderId = (int) $matches[1];
                $senderData = json_decode(base64_decode($matches[2]), true);
                
                if ($senderData && is_array($senderData)) {
                    $senderData['id'] = $senderId;
                    return $senderData;
                }
            } catch (\Exception $e) {
                $this->logError('Erreur lors de l\'extraction des données de l\'expéditeur', $e);
            }
        }
        
        return null;
    }

    private function validateNotificationData(array $data): bool
    {
        // Vérifier les champs obligatoires
        if (!isset($data['type_notification'])) {
            return false;
        }

        // Vérifier le type
        $allowedTypes = ['message', 'system', 'ban'];
        if (!in_array($data['type_notification'], $allowedTypes)) {
            return false;
        }

        // Vérifier le contenu pour les messages
        if ($data['type_notification'] === 'message' && empty($data['content_notification'])) {
            return false;
        }

        return true;
    }

    private function logError(string $message, \Exception $e): void
    {
        // Logger l'erreur (utiliser le logger Symfony)
        error_log($message . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ' at line ' . $e->getLine());
    }
}