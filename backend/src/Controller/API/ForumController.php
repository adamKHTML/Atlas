<?php

namespace App\Controller\API;

use App\Entity\Country;
use App\Entity\Discussion;
use App\Entity\Message;
use App\Entity\Reaction;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\String\Slugger\SluggerInterface;

class ForumController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private SluggerInterface $slugger;

    public function __construct(EntityManagerInterface $entityManager, SluggerInterface $slugger)
    {
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
    }

    // =============== DISCUSSIONS ===============

    /**
     * Get all discussions for a country
     * Route: GET /api/country/{id}/discussions
     */
    #[Route('/api/country/{id}/discussions', name: 'api_get_country_discussions', methods: ['GET'])]
    public function getCountryDiscussions(int $id, Request $request): JsonResponse
    {
        try {
            $country = $this->entityManager->getRepository(Country::class)->find($id);
            if (!$country) {
                return new JsonResponse(['error' => 'Country not found'], 404);
            }

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 15);
            $offset = ($page - 1) * $limit;

            // ✅ SOLUTION 1: Utiliser findBy simple (sans QueryBuilder)
            $discussions = $this->entityManager->getRepository(Discussion::class)
                ->findBy(['country' => $country], ['id' => 'DESC'], $limit, $offset);

            // Count total discussions
            $totalQuery = $this->entityManager->getRepository(Discussion::class)
                ->createQueryBuilder('d')
                ->select('COUNT(d.id)')
                ->where('d.country = :country')
                ->setParameter('country', $country)
                ->getQuery();

            $total = $totalQuery->getSingleScalarResult();

            $discussionsData = [];

            foreach ($discussions as $discussion) {
                // Get message count for this discussion
                $messageCountQuery = $this->entityManager->getRepository(Message::class)
                    ->createQueryBuilder('m')
                    ->select('COUNT(m.id)')
                    ->where('m.discussion = :discussion')
                    ->setParameter('discussion', $discussion)
                    ->getQuery();

                $messageCount = $messageCountQuery->getSingleScalarResult();

                // Get latest message with user info (utilise findBy pour éviter le problème)
                $latestMessages = $this->entityManager->getRepository(Message::class)
                    ->findBy(['discussion' => $discussion], ['id' => 'DESC'], 1);

                $latestMessage = !empty($latestMessages) ? $latestMessages[0] : null;

                $discussionsData[] = [
                    'id' => $discussion->getId(),
                    'title' => $discussion->getTitle(),
                    'created_at' => $discussion->getCreatedAt()->format('Y-m-d H:i:s'),
                    'message_count' => (int) $messageCount,
                    'latest_message' => $latestMessage ? [
                        'id' => $latestMessage->getId(),
                        'content' => substr($latestMessage->getContent(), 0, 100) . (strlen($latestMessage->getContent()) > 100 ? '...' : ''),
                        'created_at' => $latestMessage->getCreatedAt()->format('Y-m-d H:i:s'),
                        'user' => [
                            'id' => $latestMessage->getUser()->getId(),
                            'pseudo' => $latestMessage->getUser()->getPseudo(),
                            'profile_picture' => $latestMessage->getUser()->getProfilePicture()
                        ]
                    ] : null
                ];
            }

            return new JsonResponse([
                'discussions' => $discussionsData,
                'pagination' => [
                    'current_page' => (int) $page,
                    'total_pages' => $total > 0 ? ceil($total / $limit) : 1,
                    'total_items' => (int) $total,
                    'per_page' => (int) $limit
                ],
                'country' => [
                    'id' => $country->getId(),
                    'name' => $country->getName()
                ]
            ]);

        } catch (\Exception $e) {
            error_log('ForumController Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new discussion
     * Route: POST /api/country/{id}/discussions
     */
    #[Route('/api/country/{id}/discussions', name: 'api_create_discussion', methods: ['POST'])]
    public function createDiscussion(int $id, Request $request): JsonResponse
    {
        try {
            $country = $this->entityManager->getRepository(Country::class)->find($id);
            if (!$country) {
                return new JsonResponse(['error' => 'Country not found'], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['title']) || empty(trim($data['title']))) {
                return new JsonResponse(['error' => 'Title is required'], 400);
            }

            if (!isset($data['content']) || empty(trim($data['content']))) {
                return new JsonResponse(['error' => 'Content is required'], 400);
            }

            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            // Create discussion
            $discussion = new Discussion();
            $discussion->setCountry($country);
            $discussion->setTitle(trim($data['title']));
            $discussion->setCreatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($discussion);

            // Create first message
            $message = new Message();
            $message->setUser($user);
            $message->setDiscussion($discussion);
            $message->setContent(trim($data['content']));
            $message->setCreatedAt(new \DateTimeImmutable());
            $message->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($message);
            $this->entityManager->flush();

            return new JsonResponse([
                'id' => $discussion->getId(),
                'title' => $discussion->getTitle(),
                'created_at' => $discussion->getCreatedAt()->format('Y-m-d H:i:s'),
                'message_count' => 1,
                'latest_message' => [
                    'id' => $message->getId(),
                    'content' => substr($message->getContent(), 0, 100) . (strlen($message->getContent()) > 100 ? '...' : ''),
                    'created_at' => $message->getCreatedAt()->format('Y-m-d H:i:s'),
                    'user' => [
                        'id' => $user->getId(),
                        'pseudo' => $user->getPseudo(),
                        'profile_picture' => $user->getProfilePicture()
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            error_log('Create Discussion Error: ' . $e->getMessage());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single discussion with messages
     * Route: GET /api/discussions/{id}
     */
    #[Route('/api/discussions/{id}', name: 'api_get_discussion', methods: ['GET'])]
    public function getDiscussion(int $id, Request $request): JsonResponse
    {
        try {
            $discussion = $this->entityManager->getRepository(Discussion::class)->find($id);
            if (!$discussion) {
                return new JsonResponse(['error' => 'Discussion not found'], 404);
            }

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 20);
            $offset = ($page - 1) * $limit;

            // ✅ Utiliser findBy pour éviter les problèmes de QueryBuilder
            $messages = $this->entityManager->getRepository(Message::class)
                ->findBy(['discussion' => $discussion], ['id' => 'ASC'], $limit, $offset);

            // Count total messages
            $totalQuery = $this->entityManager->getRepository(Message::class)
                ->createQueryBuilder('m')
                ->select('COUNT(m.id)')
                ->where('m.discussion = :discussion')
                ->setParameter('discussion', $discussion)
                ->getQuery();

            $total = $totalQuery->getSingleScalarResult();

            $messagesData = [];
            $currentUser = $this->getUser();

            foreach ($messages as $message) {
                // Get likes count
                $likesQuery = $this->entityManager->getRepository(Reaction::class)
                    ->createQueryBuilder('r')
                    ->select('COUNT(r.id)')
                    ->where('r.message = :message AND r.type = :type')
                    ->setParameter('message', $message)
                    ->setParameter('type', true)
                    ->getQuery();

                $likes = $likesQuery->getSingleScalarResult();

                // Get dislikes count
                $dislikesQuery = $this->entityManager->getRepository(Reaction::class)
                    ->createQueryBuilder('r')
                    ->select('COUNT(r.id)')
                    ->where('r.message = :message AND r.type = :type')
                    ->setParameter('message', $message)
                    ->setParameter('type', false)
                    ->getQuery();

                $dislikes = $dislikesQuery->getSingleScalarResult();

                // Get user reaction
                $userReaction = null;
                if ($currentUser) {
                    $userReactionQuery = $this->entityManager->getRepository(Reaction::class)
                        ->findOneBy(['message' => $message, 'user' => $currentUser]);
                    
                    $userReaction = $userReactionQuery ? $userReactionQuery->getType() : null;
                }

                $messagesData[] = [
                    'id' => $message->getId(),
                    'content' => $message->getContent(),
                    'created_at' => $message->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updated_at' => $message->getUpdatedAt()->format('Y-m-d H:i:s'),
                    'user' => [
                        'id' => $message->getUser()->getId(),
                        'pseudo' => $message->getUser()->getPseudo(),
                        'profile_picture' => $message->getUser()->getProfilePicture()
                    ],
                    'reactions' => [
                        'likes' => (int) $likes,
                        'dislikes' => (int) $dislikes,
                        'user_reaction' => $userReaction
                    ]
                ];
            }

            return new JsonResponse([
                'discussion' => [
                    'id' => $discussion->getId(),
                    'title' => $discussion->getTitle(),
                    'created_at' => $discussion->getCreatedAt()->format('Y-m-d H:i:s'),
                    'country' => [
                        'id' => $discussion->getCountry()->getId(),
                        'name' => $discussion->getCountry()->getName()
                    ]
                ],
                'messages' => $messagesData,
                'pagination' => [
                    'current_page' => (int) $page,
                    'total_pages' => $total > 0 ? ceil($total / $limit) : 1,
                    'total_items' => (int) $total,
                    'per_page' => (int) $limit
                ]
            ]);

        } catch (\Exception $e) {
            error_log('Get Discussion Error: ' . $e->getMessage());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add message to discussion
     * Route: POST /api/discussions/{id}/messages
     */
    #[Route('/api/discussions/{id}/messages', name: 'api_add_message', methods: ['POST'])]
    public function addMessage(int $id, Request $request): JsonResponse
    {
        try {
            $discussion = $this->entityManager->getRepository(Discussion::class)->find($id);
            if (!$discussion) {
                return new JsonResponse(['error' => 'Discussion not found'], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['content']) || empty(trim($data['content']))) {
                return new JsonResponse(['error' => 'Content is required'], 400);
            }

            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            $message = new Message();
            $message->setUser($user);
            $message->setDiscussion($discussion);
            $message->setContent(trim($data['content']));
            $message->setCreatedAt(new \DateTimeImmutable());
            $message->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($message);
            $this->entityManager->flush();

            return new JsonResponse([
                'id' => $message->getId(),
                'content' => $message->getContent(),
                'created_at' => $message->getCreatedAt()->format('Y-m-d H:i:s'),
                'updated_at' => $message->getUpdatedAt()->format('Y-m-d H:i:s'),
                'user' => [
                    'id' => $message->getUser()->getId(),
                    'pseudo' => $message->getUser()->getPseudo(),
                    'profile_picture' => $message->getUser()->getProfilePicture()
                ],
                'reactions' => [
                    'likes' => 0,
                    'dislikes' => 0,
                    'user_reaction' => null
                ]
            ], 201);

        } catch (\Exception $e) {
            error_log('Add Message Error: ' . $e->getMessage());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * React to message (like/dislike)
     * Route: POST /api/messages/{id}/react
     */
    #[Route('/api/messages/{id}/react', name: 'api_react_to_message', methods: ['POST'])]
    public function reactToMessage(int $id, Request $request): JsonResponse
    {
        try {
            $message = $this->entityManager->getRepository(Message::class)->find($id);
            if (!$message) {
                return new JsonResponse(['error' => 'Message not found'], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['type']) || !is_bool($data['type'])) {
                return new JsonResponse(['error' => 'Type is required (true for like, false for dislike)'], 400);
            }

            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            // Check if user already reacted
            $existingReaction = $this->entityManager->getRepository(Reaction::class)
                ->findOneBy(['message' => $message, 'user' => $user]);

            if ($existingReaction) {
                if ($existingReaction->getType() === $data['type']) {
                    // Same reaction - remove it
                    $this->entityManager->remove($existingReaction);
                    $userReaction = null;
                } else {
                    // Different reaction - update it
                    $existingReaction->setType($data['type']);
                    $userReaction = $data['type'];
                }
            } else {
                // Create new reaction
                $reaction = new Reaction();
                $reaction->setMessage($message);
                $reaction->setUser($user);
                $reaction->setType($data['type']);
                $this->entityManager->persist($reaction);
                $userReaction = $data['type'];
            }

            $this->entityManager->flush();

            // Return updated counts
            $likesQuery = $this->entityManager->getRepository(Reaction::class)
                ->createQueryBuilder('r')
                ->select('COUNT(r.id)')
                ->where('r.message = :message AND r.type = :type')
                ->setParameter('message', $message)
                ->setParameter('type', true)
                ->getQuery();

            $likes = $likesQuery->getSingleScalarResult();

            $dislikesQuery = $this->entityManager->getRepository(Reaction::class)
                ->createQueryBuilder('r')
                ->select('COUNT(r.id)')
                ->where('r.message = :message AND r.type = :type')
                ->setParameter('message', $message)
                ->setParameter('type', false)
                ->getQuery();

            $dislikes = $dislikesQuery->getSingleScalarResult();

            return new JsonResponse([
                'likes' => (int) $likes,
                'dislikes' => (int) $dislikes,
                'user_reaction' => $userReaction
            ]);

        } catch (\Exception $e) {
            error_log('React to Message Error: ' . $e->getMessage());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove reaction from message
     * Route: DELETE /api/messages/{id}/unreact
     */
    #[Route('/api/messages/{id}/unreact', name: 'api_unreact_to_message', methods: ['DELETE'])]
    public function unreactToMessage(int $id): JsonResponse
    {
        try {
            $message = $this->entityManager->getRepository(Message::class)->find($id);
            if (!$message) {
                return new JsonResponse(['error' => 'Message not found'], 404);
            }

            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            $reaction = $this->entityManager->getRepository(Reaction::class)
                ->findOneBy(['message' => $message, 'user' => $user]);

            if ($reaction) {
                $this->entityManager->remove($reaction);
                $this->entityManager->flush();
            }

            return new JsonResponse(['message' => 'Reaction removed']);

        } catch (\Exception $e) {
            error_log('Unreact to Message Error: ' . $e->getMessage());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload image for message
     * Route: POST /api/messages/upload-image
     */
    #[Route('/api/messages/upload-image', name: 'api_upload_message_image', methods: ['POST'])]
    public function uploadMessageImage(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse(['error' => 'User not authenticated'], 401);
            }

            $uploadedFile = $request->files->get('image');
            
            if (!$uploadedFile) {
                return new JsonResponse(['error' => 'No file uploaded'], 400);
            }

            $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($uploadedFile->getMimeType(), $allowedMimeTypes)) {
                return new JsonResponse(['error' => 'Invalid file type'], 400);
            }

            $maxFileSize = 5 * 1024 * 1024; // 5MB
            if ($uploadedFile->getSize() > $maxFileSize) {
                return new JsonResponse(['error' => 'File too large'], 400);
            }

            $originalFilename = pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $this->slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $uploadedFile->guessExtension();

            // Assurez-vous que le dossier existe
            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/messages';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            try {
                $uploadedFile->move($uploadDir, $newFilename);
            } catch (FileException $e) {
                return new JsonResponse(['error' => 'Upload failed'], 500);
            }

            return new JsonResponse([
                'filename' => $newFilename,
                'url' => '/uploads/messages/' . $newFilename
            ]);

        } catch (\Exception $e) {
            error_log('Upload Message Image Error: ' . $e->getMessage());
            
            return new JsonResponse([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}