<?php

namespace App\Controller\API;

use App\Entity\Discussion;
use App\Entity\Message;
use App\Entity\Reaction;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class UserStatsController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    /**
     * Get user statistics
     * Route: GET /api/user/stats
     */
    #[Route('/api/user/stats', name: 'api_user_stats', methods: ['GET'])]
    public function getUserStats(): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            // Récupérer les discussions où l'utilisateur a posté des messages
            $discussionsWithUserMessagesQuery = $this->entityManager->createQuery('
                SELECT DISTINCT d.id
                FROM App\Entity\Discussion d
                JOIN App\Entity\Message m WITH m.discussion = d
                WHERE m.user = :user
            ')->setParameter('user', $user);

            $discussionIds = $discussionsWithUserMessagesQuery->getResult();
            $totalDiscussions = count($discussionIds);

            // Messages totaux de l'utilisateur
            $totalMessagesQuery = $this->entityManager->getRepository(Message::class)
                ->createQueryBuilder('m')
                ->select('COUNT(m.id)')
                ->where('m.user = :user')
                ->setParameter('user', $user)
                ->getQuery();

            $totalMessages = (int) $totalMessagesQuery->getSingleScalarResult();

            // Likes reçus sur tous les messages de l'utilisateur
            $likesReceivedQuery = $this->entityManager->createQuery('
                SELECT COUNT(r.id) as total_likes
                FROM App\Entity\Reaction r
                JOIN App\Entity\Message m WITH r.message = m
                WHERE m.user = :user AND r.type = :like_type
            ')->setParameter('user', $user)->setParameter('like_type', true);

            $totalLikesReceived = (int) $likesReceivedQuery->getSingleScalarResult();

            // Message le plus liké
            $mostLikedMessageQuery = $this->entityManager->createQuery('
                SELECT m.id, m.content, m.created_at, COUNT(r.id) as likes_count, d.title as discussion_title, d.id as discussion_id, c.name as country_name
                FROM App\Entity\Message m
                JOIN App\Entity\Discussion d WITH m.discussion = d
                JOIN App\Entity\Country c WITH d.country = c
                LEFT JOIN App\Entity\Reaction r WITH r.message = m AND r.type = :like_type
                WHERE m.user = :user
                GROUP BY m.id, m.content, m.created_at, d.id, d.title, c.name
                HAVING COUNT(r.id) > 0
                ORDER BY likes_count DESC
            ')->setParameter('user', $user)->setParameter('like_type', true)->setMaxResults(1);

            $mostLikedMessageResult = $mostLikedMessageQuery->getResult();
            $mostLikedMessage = !empty($mostLikedMessageResult) ? $mostLikedMessageResult[0] : null;

            // Discussion la plus active (celle avec le plus de messages de l'utilisateur)
            $mostActiveDiscussionQuery = $this->entityManager->createQuery('
                SELECT d.id, d.title, c.name as country_name, COUNT(m.id) as user_messages_count
                FROM App\Entity\Discussion d
                JOIN App\Entity\Country c WITH d.country = c
                JOIN App\Entity\Message m WITH m.discussion = d
                WHERE m.user = :user
                GROUP BY d.id, d.title, c.name
                HAVING COUNT(m.id) > 0
                ORDER BY user_messages_count DESC
            ')->setParameter('user', $user)->setMaxResults(1);

            $mostActiveDiscussionResult = $mostActiveDiscussionQuery->getResult();
            $mostActiveDiscussion = !empty($mostActiveDiscussionResult) ? $mostActiveDiscussionResult[0] : null;

            // Statistiques générales
            $averageMessagesPerDiscussion = $totalDiscussions > 0 ? round($totalMessages / $totalDiscussions, 1) : 0;

            return new JsonResponse([
                'overview' => [
                    'total_discussions' => $totalDiscussions,
                    'total_messages' => $totalMessages,
                    'total_likes_received' => $totalLikesReceived,
                    'avg_messages_per_discussion' => $averageMessagesPerDiscussion,
                    'most_liked_message_likes' => $mostLikedMessage ? (int) $mostLikedMessage['likes_count'] : 0,
                    'most_active_discussion_messages' => $mostActiveDiscussion ? (int) $mostActiveDiscussion['user_messages_count'] : 0
                ],
                'top_performers' => [
                    'most_liked_message' => $mostLikedMessage ? [
                        'id' => $mostLikedMessage['id'],
                        'content' => substr($mostLikedMessage['content'], 0, 100) . (strlen($mostLikedMessage['content']) > 100 ? '...' : ''),
                        'likes' => (int) $mostLikedMessage['likes_count'],
                        'discussion_title' => $mostLikedMessage['discussion_title'],
                        'discussion_id' => $mostLikedMessage['discussion_id'],
                        'country' => $mostLikedMessage['country_name'],
                        'created_at' => $mostLikedMessage['created_at']->format('Y-m-d H:i:s')
                    ] : null,
                    'most_active_discussion' => $mostActiveDiscussion ? [
                        'id' => $mostActiveDiscussion['id'],
                        'title' => $mostActiveDiscussion['title'],
                        'country' => $mostActiveDiscussion['country_name'],
                        'user_messages' => (int) $mostActiveDiscussion['user_messages_count']
                    ] : null
                ]
            ]);

        } catch (\Exception $e) {
            error_log('Get User Stats Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user discussions
     * Route: GET /api/user/discussions
     */
    #[Route('/api/user/discussions', name: 'api_user_discussions', methods: ['GET'])]
    public function getUserDiscussions(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $offset = ($page - 1) * $limit;

            // Récupérer TOUTES les discussions où l'utilisateur a participé
            $discussionsQuery = $this->entityManager->createQuery('
                SELECT DISTINCT d.id, d.title, d.created_at, c.name as country_name, c.id as country_id
                FROM App\Entity\Discussion d
                JOIN App\Entity\Country c WITH d.country = c
                JOIN App\Entity\Message m WITH m.discussion = d
                WHERE m.user = :user
                ORDER BY d.created_at DESC
            ')->setParameter('user', $user)
              ->setFirstResult($offset)
              ->setMaxResults($limit);

            $discussions = $discussionsQuery->getResult();

            // Count total pour la pagination
            $totalQuery = $this->entityManager->createQuery('
                SELECT COUNT(DISTINCT d.id)
                FROM App\Entity\Discussion d
                JOIN App\Entity\Message m WITH m.discussion = d
                WHERE m.user = :user
            ')->setParameter('user', $user);

            $total = (int) $totalQuery->getSingleScalarResult();

            $discussionsData = [];
            foreach ($discussions as $discussion) {
                // Compter les messages de l'utilisateur dans cette discussion
                $userMessagesQuery = $this->entityManager->getRepository(Message::class)
                    ->createQueryBuilder('m')
                    ->select('COUNT(m.id)')
                    ->where('m.discussion = :discussion_id AND m.user = :user')
                    ->setParameter('discussion_id', $discussion['id'])
                    ->setParameter('user', $user)
                    ->getQuery();

                $userMessageCount = (int) $userMessagesQuery->getSingleScalarResult();

                // Compter les likes reçus sur cette discussion
                $likesReceivedQuery = $this->entityManager->createQuery('
                    SELECT COUNT(r.id) as likes_count
                    FROM App\Entity\Reaction r
                    JOIN App\Entity\Message m WITH r.message = m
                    WHERE m.discussion = :discussion_id AND m.user = :user AND r.type = :like_type
                ')->setParameter('discussion_id', $discussion['id'])
                  ->setParameter('user', $user)
                  ->setParameter('like_type', true);

                $likesReceived = (int) $likesReceivedQuery->getSingleScalarResult();

                // Dernière activité de l'utilisateur dans cette discussion
                $lastActivityQuery = $this->entityManager->getRepository(Message::class)
                    ->createQueryBuilder('m')
                    ->select('m.created_at')
                    ->where('m.discussion = :discussion_id AND m.user = :user')
                    ->setParameter('discussion_id', $discussion['id'])
                    ->setParameter('user', $user)
                    ->orderBy('m.created_at', 'DESC')
                    ->setMaxResults(1)
                    ->getQuery();

                $lastActivityResult = $lastActivityQuery->getResult();
                $lastActivity = !empty($lastActivityResult) ? $lastActivityResult[0]['created_at'] : null;

                $discussionsData[] = [
                    'id' => $discussion['id'],
                    'title' => $discussion['title'],
                    'country' => $discussion['country_name'],
                    'country_id' => $discussion['country_id'],
                    'created_at' => $discussion['created_at']->format('Y-m-d H:i:s'),
                    'user_message_count' => $userMessageCount,
                    'likes_received' => $likesReceived,
                    'last_activity' => $lastActivity ? $lastActivity->format('Y-m-d H:i:s') : null,
                    'status' => 'active'
                ];
            }

            return new JsonResponse([
                'discussions' => $discussionsData,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total_items' => $total,
                    'total_pages' => $total > 0 ? ceil($total / $limit) : 1
                ]
            ]);

        } catch (\Exception $e) {
            error_log('Get User Discussions Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user messages
     * Route: GET /api/user/messages
     */
    #[Route('/api/user/messages', name: 'api_user_messages', methods: ['GET'])]
    public function getUserMessages(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $offset = ($page - 1) * $limit;

            // Récupérer les messages de l'utilisateur avec informations sur la discussion
            $messagesQuery = $this->entityManager->createQuery('
                SELECT m.id, m.content, m.created_at, d.id as discussion_id, d.title as discussion_title, c.name as country_name
                FROM App\Entity\Message m
                JOIN App\Entity\Discussion d WITH m.discussion = d
                JOIN App\Entity\Country c WITH d.country = c
                WHERE m.user = :user
                ORDER BY m.created_at DESC
            ')->setParameter('user', $user)
              ->setFirstResult($offset)
              ->setMaxResults($limit);

            $messages = $messagesQuery->getResult();

            // Count total pour la pagination
            $totalQuery = $this->entityManager->getRepository(Message::class)
                ->createQueryBuilder('m')
                ->select('COUNT(m.id)')
                ->where('m.user = :user')
                ->setParameter('user', $user)
                ->getQuery();

            $total = (int) $totalQuery->getSingleScalarResult();

            $messagesData = [];
            foreach ($messages as $message) {
                // Compter les likes pour ce message
                $likesQuery = $this->entityManager->getRepository(Reaction::class)
                    ->createQueryBuilder('r')
                    ->select('COUNT(r.id)')
                    ->where('r.message = :message_id AND r.type = :like_type')
                    ->setParameter('message_id', $message['id'])
                    ->setParameter('like_type', true)
                    ->getQuery();

                $likesReceived = (int) $likesQuery->getSingleScalarResult();

                // Vérifier si c'est le premier message de la discussion
                $firstMessageQuery = $this->entityManager->getRepository(Message::class)
                    ->createQueryBuilder('m')
                    ->select('m.id')
                    ->where('m.discussion = :discussion_id')
                    ->setParameter('discussion_id', $message['discussion_id'])
                    ->orderBy('m.created_at', 'ASC')
                    ->setMaxResults(1)
                    ->getQuery();

                $firstMessageResult = $firstMessageQuery->getResult();
                $isOriginalPost = !empty($firstMessageResult) && $firstMessageResult[0]['id'] == $message['id'];

                $messagesData[] = [
                    'id' => $message['id'],
                    'content' => $message['content'],
                    'discussion_id' => $message['discussion_id'],
                    'discussion_title' => $message['discussion_title'],
                    'country' => $message['country_name'],
                    'created_at' => $message['created_at']->format('Y-m-d H:i:s'),
                    'likes_received' => $likesReceived,
                    'is_original_post' => $isOriginalPost
                ];
            }

            return new JsonResponse([
                'messages' => $messagesData,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total_items' => $total,
                    'total_pages' => $total > 0 ? ceil($total / $limit) : 1
                ]
            ]);

        } catch (\Exception $e) {
            error_log('Get User Messages Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}