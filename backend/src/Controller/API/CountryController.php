<?php

namespace App\Controller\API;

use App\Entity\Country;
use App\Entity\Content;
use App\Repository\CountryRepository;
use App\Repository\ContentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\SluggerInterface;
use Psr\Log\LoggerInterface;

class CountryController extends AbstractController
{
    private CountryRepository $countryRepository;
    private ContentRepository $contentRepository;
    private EntityManagerInterface $entityManager;
    private SluggerInterface $slugger;
    private ?LoggerInterface $logger;

    public function __construct(
        CountryRepository $countryRepository,
        ContentRepository $contentRepository,
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger,
        ?LoggerInterface $logger = null
    ) {
        $this->countryRepository = $countryRepository;
        $this->contentRepository = $contentRepository;
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
        $this->logger = $logger;
    }

    // ==========================================
    // 📌 ENDPOINTS PUBLICS
    // ==========================================

    #[Route('/api/countries', name: 'api_countries_list', methods: ['GET'])]
    public function getAllCountries(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(50, max(1, (int) $request->query->get('limit', 12)));
        $withImages = $request->query->get('with_images', 'false') === 'true';
        $offset = ($page - 1) * $limit;

        try {
            $countries = $this->countryRepository->findBy([], ['created_at' => 'DESC'], $limit, $offset);
            $total = $this->countryRepository->count([]);

            $countriesData = [];
            foreach ($countries as $country) {
                if ($withImages) {
                    $contents = $this->contentRepository->findBy(['country' => $country]);
                    $countryData = $this->serializeCountryWithImages($country, $contents);
                } else {
                    $countryData = $this->serializeCountryBasic($country);
                }
                $countriesData[] = $countryData;
            }

            return new JsonResponse([
                'countries' => $countriesData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la récupération des pays', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des pays',
                'details' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/countries/{id}', name: 'api_country_details', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getCountryById(int $id): JsonResponse
    {
        $country = $this->countryRepository->find($id);

        if (!$country) {
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse($this->serializeCountryDetailed($country));
    }

    #[Route('/api/countries/{id}/full', name: 'api_country_full', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getCountryWithContent(int $id): JsonResponse
    {
        $country = $this->countryRepository->find($id);

        if (!$country) {
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        $contents = $this->contentRepository->findBy(['country' => $country], ['id' => 'ASC']);
        
        $countryData = $this->serializeCountryDetailed($country);
        $countryData['sections'] = array_map([$this, 'serializeContent'], $contents);

        return new JsonResponse($countryData);
    }

    // ==========================================
    // 📌 ENDPOINTS ADMIN
    // ==========================================

    #[Route('/api/admin/countries', name: 'api_admin_country_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function createCountry(Request $request): JsonResponse
    {
        $name = $request->request->get('name');
        $code = $request->request->get('code');
        $flagUrl = $request->request->get('flag_url');
        $description = $request->request->get('description');
        $countryImageFile = $request->files->get('country_image');

        if (!$name || !$code || !$description) {
            return new JsonResponse([
                'error' => 'Les champs nom, code et description sont obligatoires'
            ], Response::HTTP_BAD_REQUEST);
        }

        $existingCountry = $this->countryRepository->findOneBy(['name' => $name]);
        if ($existingCountry) {
            return new JsonResponse([
                'error' => 'Ce pays existe déjà dans le système'
            ], Response::HTTP_CONFLICT);
        }

        try {
            $country = new Country();
            $country->setName($name);
            $country->setCode($code);
            $country->setFlagUrl($flagUrl);
            $country->setDescription($description);
            $country->setCreatedAt(new \DateTimeImmutable());
            $country->setUpdatedAt(new \DateTimeImmutable());

            if ($countryImageFile) {
                $countryImagePath = $this->handleImageUpload($countryImageFile, 'countries');
                if ($countryImagePath) {
                    $country->setCountryImage($countryImagePath);
                }
            }

            $this->entityManager->persist($country);
            $this->entityManager->flush();

            return new JsonResponse($this->serializeCountryAdmin($country), Response::HTTP_CREATED);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Erreur lors de la création du pays'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // 🆕 MISE À JOUR D'UN PAYS (pour CountryEdit)
    #[Route('/api/admin/countries/{id}', name: 'api_admin_country_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateCountry(int $id, Request $request): JsonResponse
    {
        $country = $this->countryRepository->find($id);

        if (!$country) {
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        try {
            // Récupération des données selon le type de contenu
            $contentType = $request->headers->get('Content-Type');
            
            if (str_contains($contentType, 'multipart/form-data')) {
                // FormData (avec image)
                $name = $request->request->get('name');
                $code = $request->request->get('code');
                $flagUrl = $request->request->get('flag_url');
                $description = $request->request->get('description');
                $countryImageFile = $request->files->get('country_image');
            } else {
                // JSON classique (sans image)
                $data = json_decode($request->getContent(), true);
                $name = $data['name'] ?? null;
                $code = $data['code'] ?? null;
                $flagUrl = $data['flag_url'] ?? null;
                $description = $data['description'] ?? null;
                $countryImageFile = null;
            }

            // Validation des champs obligatoires
            if (!$name || !$code || !$description) {
                return new JsonResponse([
                    'error' => 'Les champs nom, code et description sont obligatoires'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Vérifier que le nom n'est pas déjà utilisé par un autre pays
            $existingCountry = $this->countryRepository->findOneBy(['name' => $name]);
            if ($existingCountry && $existingCountry->getId() !== $id) {
                return new JsonResponse([
                    'error' => 'Ce nom de pays est déjà utilisé par un autre pays'
                ], Response::HTTP_CONFLICT);
            }

            // Mise à jour des champs
            $country->setName($name);
            $country->setCode($code);
            $country->setFlagUrl($flagUrl);
            $country->setDescription($description);
            $country->setUpdatedAt(new \DateTimeImmutable());

            // Gestion de l'upload d'image si présente
            if ($countryImageFile) {
                // Supprimer l'ancienne image si elle existe
                if ($country->getCountryImage()) {
                    $oldImagePath = $this->getParameter('kernel.project_dir') . '/public' . $country->getCountryImage();
                    if (file_exists($oldImagePath)) {
                        unlink($oldImagePath);
                    }
                }

                // Upload de la nouvelle image
                $newImagePath = $this->handleImageUpload($countryImageFile, 'countries');
                if ($newImagePath) {
                    $country->setCountryImage($newImagePath);
                }
            }

            $this->entityManager->flush();

            if ($this->logger) {
                $this->logger->info('✅ Pays mis à jour avec succès', [
                    'country_id' => $id,
                    'name' => $name,
                    'image_updated' => $countryImageFile !== null
                ]);
            }

            return new JsonResponse($this->serializeCountryAdmin($country));

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la mise à jour du pays', [
                    'country_id' => $id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la mise à jour du pays: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // 🆕 SUPPRESSION D'UN PAYS (pour CountryPage)
    #[Route('/api/admin/countries/{id}', name: 'api_admin_country_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteCountry(int $id): JsonResponse
    {
        $country = $this->countryRepository->find($id);

        if (!$country) {
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        try {
            $countryName = $country->getName();

            // Supprimer tous les contenus associés
            $contents = $this->contentRepository->findBy(['country' => $country]);
            foreach ($contents as $content) {
                $this->entityManager->remove($content);
            }

            // Supprimer l'image du pays si elle existe
            if ($country->getCountryImage()) {
                $imagePath = $this->getParameter('kernel.project_dir') . '/public' . $country->getCountryImage();
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
            }

            // Supprimer le pays
            $this->entityManager->remove($country);
            $this->entityManager->flush();

            if ($this->logger) {
                $this->logger->info('✅ Pays supprimé avec succès', [
                    'country_id' => $id,
                    'name' => $countryName,
                    'contents_deleted' => count($contents)
                ]);
            }

            return new JsonResponse([
                'message' => "Le pays \"{$countryName}\" a été supprimé avec succès",
                'deleted_contents' => count($contents)
            ]);

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la suppression du pays', [
                    'country_id' => $id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la suppression du pays: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // ENDPOINT POUR GÉRER LES IMAGES DE SECTIONS
    #[Route('/api/admin/countries/{id}/content', name: 'api_admin_country_update_content', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateCountryContent(int $id, Request $request): JsonResponse
    {
        $country = $this->countryRepository->find($id);

        if (!$country) {
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $sections = $data['sections'] ?? [];

        if (empty($sections)) {
            return new JsonResponse([
                'error' => 'Aucune section fournie'
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            // Supprimer l'ancien contenu
            $existingContents = $this->contentRepository->findBy(['country' => $country]);
            foreach ($existingContents as $content) {
                $this->entityManager->remove($content);
            }

            $this->entityManager->flush(); // Flush la suppression

            // Créer le nouveau contenu
            foreach ($sections as $sectionData) {
                $content = new Content();
                $content->setCountry($country);
                $content->setTitle($sectionData['title'] ?? '');
                $content->setType($sectionData['type'] ?? 'text');
                $content->setCreatedAt(new \DateTimeImmutable());
                $content->setUpdatedAt(new \DateTimeImmutable());

                // Le contenu va toujours dans 'section'
                // Que ce soit une URL d'image, du texte ou une URL de vidéo
                $content->setSection($sectionData['content'] ?? '');

                $this->entityManager->persist($content);
            }
            $country->setUpdatedAt(new \DateTimeImmutable());
            $this->entityManager->flush();

            if ($this->logger) {
                $this->logger->info('✅ Contenu mis à jour avec succès', [
                    'country_id' => $id,
                    'sections_count' => count($sections)
                ]);
            }

            return new JsonResponse([
                'message' => 'Contenu mis à jour avec succès',
                'country' => $this->serializeCountryAdmin($country),
                'sections_created' => count($sections)
            ]);

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la mise à jour du contenu', [
                    'country_id' => $id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la mise à jour du contenu: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/admin/countries/upload-section-image', name: 'api_admin_upload_section_image', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function uploadSectionImage(Request $request): JsonResponse
    {
        $imageFile = $request->files->get('section_image');
        
        if (!$imageFile) {
            return new JsonResponse(['error' => 'Aucune image fournie'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $imagePath = $this->handleImageUpload($imageFile, 'sections');
            
            if (!$imagePath) {
                return new JsonResponse(['error' => 'Erreur lors de l\'upload de l\'image'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            if ($this->logger) {
                $this->logger->info('✅ Image de section uploadée avec succès', [
                    'image_path' => $imagePath,
                    'file_name' => $imageFile->getClientOriginalName()
                ]);
            }

            return new JsonResponse([
                'image_url' => $imagePath,
                'message' => 'Image uploadée avec succès'
            ]);

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de l\'upload d\'image de section', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de l\'upload: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // ==========================================
    // 📌 MÉTHODES PRIVÉES
    // ==========================================

    private function serializeCountryBasic(Country $country): array
    {
        return [
            'id' => $country->getId(),
            'name' => $country->getName(),
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => substr($country->getDescription() ?? '', 0, 150) . '...'
        ];
    }

    private function serializeCountryDetailed(Country $country): array
    {
        return [
            'id' => $country->getId(),
            'name' => $country->getName(),
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => $country->getDescription(),
            'country_image' => $country->getCountryImage(),
            'created_at' => $country->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $country->getUpdatedAt()->format('Y-m-d H:i:s')
        ];
    }

    private function serializeCountryAdmin(Country $country): array
    {
        return [
            'id' => $country->getId(),
            'name' => $country->getName(),
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => $country->getDescription(),
            'country_image' => $country->getCountryImage(),
            'created_at' => $country->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $country->getUpdatedAt()->format('Y-m-d H:i:s'),
            'content_count' => $this->contentRepository->count(['country' => $country])
        ];
    }

    private function serializeCountryWithImages(Country $country, array $contents = []): array
    {
        // Logique de fallback pour l'image
        $imageUrl = $country->getCountryImage(); // Image principale du pays
        
        if (!$imageUrl) {
            // Chercher une image dans le contenu
            foreach ($contents as $content) {
                if ($content->getType() === 'image' && $content->getSection()) {
                    $imageUrl = $content->getSection();
                    break;
                }
            }
        }
        
        if (!$imageUrl) {
            // Dernier fallback : drapeau
            $imageUrl = $country->getFlagUrl();
        }

        return [
            'id' => $country->getId(),
            'name' => $country->getName(),
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => $country->getDescription(),
            'country_image' => $country->getCountryImage(),
            'image_url' => $imageUrl,
            'created_at' => $country->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $country->getUpdatedAt()->format('Y-m-d H:i:s'),
            'content_count' => count($contents)
        ];
    }

    private function serializeContent(Content $content): array
    {
        $baseData = [
            'id' => $content->getId(),
            'title' => $content->getTitle(),
            'type' => $content->getType(),
            'created_at' => $content->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $content->getUpdatedAt()->format('Y-m-d H:i:s')
        ];

        // Adaptation selon le type de contenu
        if ($content->getType() === 'image') {
            $baseData['content'] = ''; // Pas de texte pour les images
            $baseData['image_url'] = $content->getSection(); // L'URL de l'image
        } else {
            $baseData['content'] = $content->getSection(); // Le contenu textuel/URL vidéo
            $baseData['image_url'] = null;
        }

        return $baseData;
    }

    /**
     * Gestion d'upload d'images
     */
    private function handleImageUpload($file, string $subfolder): ?string
    {
        if (!$file || !$file->isValid()) {
            return null;
        }

        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return null;
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return null;
        }

        try {
            $projectDir = $this->getParameter('kernel.project_dir');
            $uploadsDirectory = $projectDir . '/public/uploads/' . $subfolder;
            
            if (!is_dir($uploadsDirectory)) {
                mkdir($uploadsDirectory, 0755, true);
            }

            $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $this->slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

            $file->move($uploadsDirectory, $newFilename);

            return '/uploads/' . $subfolder . '/' . $newFilename;

        } catch (\Exception $e) {
            return null;
        }
    }
}