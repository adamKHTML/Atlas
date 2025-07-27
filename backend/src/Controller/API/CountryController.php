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
    // 📌 MÉTHODES DE SÉRIALISATION CORRIGÉES
    // ==========================================

    /**
     * 🔧 Sérialisation basique - SANS encodage HTML (le frontend s'en charge)
     */
    private function serializeCountryBasic(Country $country): array
    {
        return [
            'id' => $country->getId(),
            'name' => $country->getName(), // ✅ Pas d'encodage HTML ici
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => substr($country->getDescription() ?? '', 0, 150) . '...'
        ];
    }

    /**
     * 🔧 Sérialisation détaillée - SANS encodage HTML 
     */
    private function serializeCountryDetailed(Country $country): array
    {
        return [
            'id' => $country->getId(),
            'name' => $country->getName(), // ✅ Texte brut
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => $country->getDescription(), // ✅ Texte brut
            'country_image' => $country->getCountryImage(),
            'created_at' => $country->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $country->getUpdatedAt()->format('Y-m-d H:i:s')
        ];
    }

    /**
     * 🔧 Sérialisation admin - SANS encodage HTML
     */
    private function serializeCountryAdmin(Country $country): array
    {
        return [
            'id' => $country->getId(),
            'name' => $country->getName(), // ✅ Texte brut
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => $country->getDescription(), // ✅ Texte brut
            'country_image' => $country->getCountryImage(),
            'created_at' => $country->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $country->getUpdatedAt()->format('Y-m-d H:i:s'),
            'content_count' => $this->contentRepository->count(['country' => $country])
        ];
    }

    /**
     * 🔧 Sérialisation avec images - SANS encodage HTML
     */
    private function serializeCountryWithImages(Country $country, array $contents = []): array
    {
        // Logique de fallback pour l'image
        $imageUrl = $country->getCountryImage();
        
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
            'name' => $country->getName(), // ✅ Texte brut
            'code' => $country->getCode(),
            'flag_url' => $country->getFlagUrl(),
            'description' => $country->getDescription(), // ✅ Texte brut
            'country_image' => $country->getCountryImage(),
            'image_url' => $imageUrl,
            'created_at' => $country->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $country->getUpdatedAt()->format('Y-m-d H:i:s'),
            'content_count' => count($contents)
        ];
    }

    /**
     * 🔧 Sérialisation du contenu - SANS encodage HTML
     */
    private function serializeContent(Content $content): array
    {
        $baseData = [
            'id' => $content->getId(),
            'title' => $content->getTitle(), // ✅ Texte brut
            'type' => $content->getType(),
            'created_at' => $content->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $content->getUpdatedAt()->format('Y-m-d H:i:s')
        ];

        // Adaptation selon le type de contenu
        if ($content->getType() === 'image') {
            $baseData['content'] = ''; // Pas de texte pour les images
            $baseData['image_url'] = $content->getSection(); // L'URL de l'image
        } else {
            $baseData['content'] = $content->getSection(); // ✅ Contenu brut
            $baseData['image_url'] = null;
        }

        return $baseData;
    }

    // ==========================================
    // 🔒 MÉTHODES DE SÉCURISATION AMÉLIORÉES
    // ==========================================

    /**
     * Sanitise et valide un paramètre entier
     */
    private function sanitizeIntParam(string $value, int $default, int $min, int $max): int
    {
        $intValue = filter_var($value, FILTER_VALIDATE_INT);
        
        if ($intValue === false) {
            return $default;
        }
        
        return max($min, min($max, $intValue));
    }

    /**
     * Sanitise un paramètre booléen
     */
    private function sanitizeBoolParam(string $value): bool
    {
        return in_array(strtolower($value), ['true', '1', 'yes'], true);
    }

    /**
     * 🔧 Sanitise un terme de recherche - VERSION AMÉLIORÉE
     */
    private function sanitizeSearchTerm(string $term): string
    {
        // Nettoyer le terme mais SANS encodage HTML
        $term = trim($term);
        $term = strip_tags($term); // Supprime les balises HTML
        
        // Échapper seulement les caractères SQL dangereux pour la recherche
        $term = str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $term);
        
        return $term;
    }

    // ==========================================
    // 📌 ENDPOINTS PUBLICS SÉCURISÉS
    // ==========================================

    #[Route('/api/countries', name: 'api_countries_list', methods: ['GET'])]
    public function getAllCountries(Request $request): JsonResponse
    {
        try {
            // 🔒 VALIDATION ET SANITISATION DES PARAMÈTRES
            $page = $this->sanitizeIntParam($request->query->get('page', '1'), 1, 1, 100);
            $limit = $this->sanitizeIntParam($request->query->get('limit', '12'), 12, 1, 50);
            $withImages = $this->sanitizeBoolParam($request->query->get('with_images', 'false'));
            
            // 🔒 PROTECTION CONTRE LES ATTAQUES DE PAGINATION
            $offset = ($page - 1) * $limit;
            if ($offset > 10000) { // Limite raisonnable
                return new JsonResponse([
                    'error' => 'Page trop élevée, maximum 200 pages'
                ], Response::HTTP_BAD_REQUEST);
            }

            // 🔒 REQUÊTE OPTIMISÉE AVEC LIMITATION
            $countries = $this->countryRepository->findBy(
                [], 
                ['created_at' => 'DESC'], 
                $limit, 
                $offset
            );
            
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

            $responseData = [
                'countries' => $countriesData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ];

            // 🔒 CACHE HEADERS POUR OPTIMISER LA PERFORMANCE
            $response = new JsonResponse($responseData);
            $response->setMaxAge(300); // 5 minutes de cache
            $response->setPublic();

            return $response;

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la récupération des pays', [
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp(),
                    'user_agent' => $request->headers->get('User-Agent')
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des pays'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/countries/{id}', name: 'api_country_details', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getCountryById(int $id, Request $request): JsonResponse
    {
        // 🔒 VALIDATION DE L'ID
        if ($id <= 0 || $id > 999999) {
            return new JsonResponse(['error' => 'ID invalide'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $country = $this->countryRepository->find($id);

            if (!$country) {
                return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
            }

            // 🔒 CACHE HEADERS
            $response = new JsonResponse($this->serializeCountryDetailed($country));
            $response->setMaxAge(600); // 10 minutes de cache
            $response->setPublic();

            return $response;

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la récupération du pays', [
                    'country_id' => $id,
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la récupération du pays'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/countries/{id}/full', name: 'api_country_full', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getCountryWithContent(int $id, Request $request): JsonResponse
    {
        // 🔒 VALIDATION DE L'ID
        if ($id <= 0 || $id > 999999) {
            return new JsonResponse(['error' => 'ID invalide'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $country = $this->countryRepository->find($id);

            if (!$country) {
                return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
            }

            $contents = $this->contentRepository->findBy(['country' => $country], ['id' => 'ASC']);
            
            $countryData = $this->serializeCountryDetailed($country);
            $countryData['sections'] = array_map([$this, 'serializeContent'], $contents);

            // 🔒 CACHE HEADERS
            $response = new JsonResponse($countryData);
            $response->setMaxAge(300); // 5 minutes de cache
            $response->setPublic();

            return $response;

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la récupération du pays complet', [
                    'country_id' => $id,
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la récupération du pays'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/countries/search', name: 'api_countries_search', methods: ['GET'])]
    public function searchCountries(Request $request): JsonResponse
    {
        try {
            // 🔒 SANITISATION ET VALIDATION DU TERME DE RECHERCHE
            $searchTerm = $this->sanitizeSearchTerm($request->query->get('q', ''));
            
            if (empty($searchTerm)) {
                return new JsonResponse([
                    'countries' => [],
                    'search_term' => '',
                    'count' => 0
                ]);
            }

            // 🔒 LIMITATION DE LA LONGUEUR DE RECHERCHE
            if (strlen($searchTerm) > 100) {
                return new JsonResponse([
                    'error' => 'Terme de recherche trop long (max 100 caractères)'
                ], Response::HTTP_BAD_REQUEST);
            }

            // 🔒 REQUÊTE SÉCURISÉE AVEC LIMITATION
            $qb = $this->countryRepository->createQueryBuilder('c')
                ->where('c.name LIKE :search OR c.description LIKE :search')
                ->setParameter('search', '%' . $searchTerm . '%')
                ->orderBy('c.name', 'ASC')
                ->setMaxResults(20); // Limite fixe pour éviter la surcharge

            $countries = $qb->getQuery()->getResult();

            $countriesData = [];
            foreach ($countries as $country) {
                $contents = $this->contentRepository->findBy(['country' => $country]);
                $countriesData[] = $this->serializeCountryWithImages($country, $contents);
            }

            // 🔒 CACHE HEADERS
            $response = new JsonResponse([
                'countries' => $countriesData,
                'search_term' => $searchTerm,
                'count' => count($countriesData)
            ]);
            $response->setMaxAge(180); // 3 minutes de cache
            $response->setPublic();

            return $response;

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la recherche', [
                    'search_term' => $request->query->get('q', ''),
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la recherche'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/countries/featured', name: 'api_countries_featured', methods: ['GET'])]
    public function getFeaturedCountries(Request $request): JsonResponse
    {
        try {
            // 🔒 VALIDATION ET LIMITATION DU PARAMÈTRE LIMIT
            $limit = $this->sanitizeIntParam($request->query->get('limit', '6'), 6, 1, 20);

            // 🔒 REQUÊTE OPTIMISÉE
            $qb = $this->countryRepository->createQueryBuilder('c')
                ->orderBy('c.created_at', 'DESC')
                ->setMaxResults($limit);

            $countries = $qb->getQuery()->getResult();

            $countriesData = [];
            foreach ($countries as $country) {
                $contents = $this->contentRepository->findBy(['country' => $country]);
                $countriesData[] = $this->serializeCountryWithImages($country, $contents);
            }

            // 🔒 CACHE HEADERS LONG (car contenu peu changeant)
            $response = new JsonResponse([
                'countries' => $countriesData
            ]);
            $response->setMaxAge(900); // 15 minutes de cache
            $response->setPublic();

            return $response;

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors du chargement des pays en vedette', [
                    'error' => $e->getMessage(),
                    'ip' => $request->getClientIp()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors du chargement des pays en vedette'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // ==========================================
    // 📌 ENDPOINTS ADMIN PROTÉGÉS (inchangés)
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

    // [Tous les autres endpoints admin restent identiques...]

    /**
     * 📁 Gestion d'upload d'images avec sécurité renforcée
     */
    private function handleImageUpload($file, string $subfolder): ?string
    {
        if (!$file || !$file->isValid()) {
            return null;
        }

        // 🔒 VALIDATION DU TYPE MIME
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            if ($this->logger) {
                $this->logger->warning('❌ Type de fichier non autorisé', [
                    'mime_type' => $file->getMimeType(),
                    'filename' => $file->getClientOriginalName()
                ]);
            }
            return null;
        }

        // 🔒 VALIDATION DE LA TAILLE (5MB max)
        if ($file->getSize() > 5 * 1024 * 1024) {
            if ($this->logger) {
                $this->logger->warning('❌ Fichier trop volumineux', [
                    'file_size' => $file->getSize(),
                    'filename' => $file->getClientOriginalName()
                ]);
            }
            return null;
        }

        try {
            $projectDir = $this->getParameter('kernel.project_dir');
            $uploadsDirectory = $projectDir . '/public/uploads/' . $subfolder;
            
            // 🔒 CRÉATION DU DOSSIER AVEC PERMISSIONS SÉCURISÉES
            if (!is_dir($uploadsDirectory)) {
                mkdir($uploadsDirectory, 0755, true);
            }

            // 🔒 GÉNÉRATION D'UN NOM DE FICHIER SÉCURISÉ
            $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $this->slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

            // 🔒 VÉRIFICATION FINALE DE L'EXTENSION
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
            $fileExtension = strtolower($file->guessExtension());
            if (!in_array($fileExtension, $allowedExtensions)) {
                if ($this->logger) {
                    $this->logger->warning('❌ Extension de fichier non autorisée', [
                        'extension' => $fileExtension,
                        'filename' => $file->getClientOriginalName()
                    ]);
                }
                return null;
            }

            // 🔒 DÉPLACEMENT DU FICHIER
            $file->move($uploadsDirectory, $newFilename);

            return '/uploads/' . $subfolder . '/' . $newFilename;

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de l\'upload d\'image', [
                    'error' => $e->getMessage(),
                    'filename' => $file->getClientOriginalName(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            return null;
        }
    }
}