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

   

    /**
     * Sérialisation basique - SANS encodage HTML (le frontend s'en charge)
     */
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

    /**
     *  Sérialisation détaillée - SANS encodage HTML 
     */
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

    /**
     * 🔧 Sérialisation admin - SANS encodage HTML
     */
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

    /**
     * Sérialisation avec images - SANS encodage HTML
     */
    private function serializeCountryWithImages(Country $country, array $contents = []): array
    {
        // Logique de fallback pour l'image
        $imageUrl = $country->getCountryImage();
        
        if (!$imageUrl) {
            // Cherche une image dans le contenu
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

    /**
     *  Sérialisation du contenu - SANS encodage HTML
     */
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
            $baseData['content'] = $content->getSection(); // ✅ Contenu brut
            $baseData['image_url'] = null;
        }

        return $baseData;
    }

  
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
     *  Sanitise un terme de recherche - VERSION AMÉLIORÉE
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
    //  ENDPOINTS PUBLICS SÉCURISÉS
    // ==========================================

  
#[Route('/api/countries', name: 'api_countries_list', methods: ['GET'])]
public function getAllCountries(Request $request): JsonResponse
{
    try {
        // Log de chaque requête GET
        if ($this->logger) {
            $this->logger->info(' Requête GET /api/countries reçue', [
                'params' => $request->query->all(),
                'timestamp' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
                'ip' => $request->getClientIp()
            ]);
        }

        
        $page = $this->sanitizeIntParam($request->query->get('page', '1'), 1, 1, 100);
        $limit = $this->sanitizeIntParam($request->query->get('limit', '12'), 12, 1, 50);
        $withImages = $this->sanitizeBoolParam($request->query->get('with_images', 'false'));
        
        $offset = ($page - 1) * $limit;
        if ($offset > 10000) {
            return new JsonResponse([
                'error' => 'Page trop élevée, maximum 200 pages'
            ], Response::HTTP_BAD_REQUEST);
        }

        $countries = $this->countryRepository->findBy(
            [], 
            ['created_at' => 'DESC'], 
            $limit, 
            $offset
        );
        
        $total = $this->countryRepository->count([]);

        //  Log du résultat
        if ($this->logger) {
            $this->logger->info('📊 Résultat requête countries:', [
                'total_in_db' => $total,
                'returned_count' => count($countries),
                'page' => $page,
                'limit' => $limit,
                'country_ids' => array_map(fn($c) => $c->getId(), $countries),
                'country_names' => array_map(fn($c) => $c->getName(), $countries)
            ]);
        }

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
            ],
            // DEBUG INFO dans la réponse
            'debug_info' => [
                'timestamp' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
                'fresh_from_db' => true,
                'total_countries_in_db' => $total
            ]
        ];

        // Headers sans cache pour forcer le refresh
        $response = new JsonResponse($responseData);
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

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
        // VALIDATION DE L'ID
        if ($id <= 0 || $id > 999999) {
            return new JsonResponse(['error' => 'ID invalide'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $country = $this->countryRepository->find($id);

            if (!$country) {
                return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
            }

            //  CACHE HEADERS
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
        // VALIDATION DE L'ID
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

            //  CACHE HEADERS
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

            //  LIMITATION DE LA LONGUEUR DE RECHERCHE
            if (strlen($searchTerm) > 100) {
                return new JsonResponse([
                    'error' => 'Terme de recherche trop long (max 100 caractères)'
                ], Response::HTTP_BAD_REQUEST);
            }

            //  REQUÊTE SÉCURISÉE AVEC LIMITATION
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
            //  VALIDATION ET LIMITATION DU PARAMÈTRE LIMIT
            $limit = $this->sanitizeIntParam($request->query->get('limit', '6'), 6, 1, 20);

            //  REQUÊTE OPTIMISÉE
            $qb = $this->countryRepository->createQueryBuilder('c')
                ->orderBy('c.created_at', 'DESC')
                ->setMaxResults($limit);

            $countries = $qb->getQuery()->getResult();

            $countriesData = [];
            foreach ($countries as $country) {
                $contents = $this->contentRepository->findBy(['country' => $country]);
                $countriesData[] = $this->serializeCountryWithImages($country, $contents);
            }

            //  CACHE HEADERS LONG (car contenu peu changeant)
            $response = new JsonResponse([
                'countries' => $countriesData
            ]);
            $response->setMaxAge(900); 
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
    //  ENDPOINTS ADMIN PROTÉGÉS
    // ==========================================

    #[Route('/api/admin/countries', name: 'api_admin_countries_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getCountriesAdmin(Request $request): JsonResponse
    {
        try {
            $page = $this->sanitizeIntParam($request->query->get('page', '1'), 1, 1, 100);
            $limit = $this->sanitizeIntParam($request->query->get('limit', '10'), 10, 1, 50);
            $search = $this->sanitizeSearchTerm($request->query->get('search', ''));

            $offset = ($page - 1) * $limit;

            // Construction de la requête avec recherche optionnelle
            $qb = $this->countryRepository->createQueryBuilder('c');
            
            if (!empty($search)) {
                $qb->where('c.name LIKE :search OR c.description LIKE :search')
                   ->setParameter('search', '%' . $search . '%');
            }
            
            $qb->orderBy('c.created_at', 'DESC')
               ->setFirstResult($offset)
               ->setMaxResults($limit);

            $countries = $qb->getQuery()->getResult();

            // Compter le total pour la pagination
            $totalQb = $this->countryRepository->createQueryBuilder('c')
                ->select('COUNT(c.id)');
                
            if (!empty($search)) {
                $totalQb->where('c.name LIKE :search OR c.description LIKE :search')
                       ->setParameter('search', '%' . $search . '%');
            }
            
            $total = $totalQb->getQuery()->getSingleScalarResult();

            $countriesData = [];
            foreach ($countries as $country) {
                $countriesData[] = $this->serializeCountryAdmin($country);
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
                $this->logger->error('❌ Erreur lors de la récupération des pays admin', [
                    'error' => $e->getMessage(),
                    'admin_user' => $this->getUser()?->getEmail()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des pays'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/admin/countries', name: 'api_admin_country_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function createCountry(Request $request): JsonResponse
    {
       
    if ($this->logger) {
        $this->logger->info('🔍 DEBUG Création pays - Données reçues:', [
            'content_type' => $request->headers->get('Content-Type'),
            'method' => $request->getMethod(),
            'request_data' => $request->request->all(),
            'files_data' => array_keys($request->files->all()),
            'raw_content' => substr($request->getContent(), 0, 200) // Premier 200 caractères
        ]);
    }

    $name = $request->request->get('name');
    $code = $request->request->get('code');
    $flagUrl = $request->request->get('flag_url');
    $description = $request->request->get('description');
    $countryImageFile = $request->files->get('country_image');

    // Vérifie les données reçues
    if ($this->logger) {
        $this->logger->info('🔍 DEBUG Données extraites:', [
            'name' => $name,
            'code' => $code,  
            'flag_url' => $flagUrl,
            'description' => $description ? substr($description, 0, 50) : null,
            'has_image_file' => $countryImageFile !== null,
            'image_file_info' => $countryImageFile ? [
                'original_name' => $countryImageFile->getClientOriginalName(),
                'size' => $countryImageFile->getSize(),
                'mime_type' => $countryImageFile->getMimeType()
            ] : null
        ]);
    }

    if (!$name || !$code || !$description) {
        if ($this->logger) {
            $this->logger->error('❌ Champs manquants:', [
                'name_missing' => !$name,
                'code_missing' => !$code,
                'description_missing' => !$description
            ]);
        }
        
        return new JsonResponse([
            'error' => 'Les champs nom, code et description sont obligatoires',
            'details' => [
                'name' => $name ? 'OK' : 'MANQUANT',
                'code' => $code ? 'OK' : 'MANQUANT', 
                'description' => $description ? 'OK' : 'MANQUANT'
            ]
        ], Response::HTTP_BAD_REQUEST);
    }
    
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

            if ($this->logger) {
                $this->logger->info('✅ Pays créé avec succès', [
                    'country_id' => $country->getId(),
                    'country_name' => $name,
                    'admin_user' => $this->getUser()?->getEmail()
                ]);
            }

            return new JsonResponse($this->serializeCountryAdmin($country), Response::HTTP_CREATED);

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la création du pays', [
                    'error' => $e->getMessage(),
                    'admin_user' => $this->getUser()?->getEmail()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la création du pays'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/admin/countries/{id}', name: 'api_admin_country_by_id', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getCountryByIdAdmin(int $id): JsonResponse
    {
        if ($id <= 0 || $id > 999999) {
            return new JsonResponse(['error' => 'ID invalide'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $country = $this->countryRepository->find($id);

            if (!$country) {
                return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
            }

            return new JsonResponse($this->serializeCountryAdmin($country));

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la récupération du pays admin', [
                    'country_id' => $id,
                    'error' => $e->getMessage(),
                    'admin_user' => $this->getUser()?->getEmail()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la récupération du pays'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

   #[Route('/api/admin/countries/{id}', name: 'api_admin_country_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
#[IsGranted('ROLE_ADMIN')]
public function updateCountry(int $id, Request $request): JsonResponse
{
    if ($id <= 0 || $id > 999999) {
        return new JsonResponse(['error' => 'ID invalide'], Response::HTTP_BAD_REQUEST);
    }

    try {
        //  État AVANT modification
        $allCountriesBefore = $this->countryRepository->findAll();
        $country = $this->countryRepository->find($id);

        if (!$country) {
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Log état avant modification
        if ($this->logger) {
            $this->logger->info('🔍 AVANT modification pays:', [
                'country_id' => $id,
                'current_name' => $country->getName(),
                'current_code' => $country->getCode(),
                'current_description' => substr($country->getDescription() ?? '', 0, 100),
                'total_countries' => count($allCountriesBefore),
                'admin_user' => $this->getUser()?->getEmail()
            ]);
        }

        // Vérifier si c'est du FormData (avec image) ou du JSON
        $contentType = $request->headers->get('Content-Type');
        
        if (str_contains($contentType, 'multipart/form-data')) {
            // FormData avec potentiellement une nouvelle image
            $name = $request->request->get('name');
            $code = $request->request->get('code');
            $flagUrl = $request->request->get('flag_url');
            $description = $request->request->get('description');
            $countryImageFile = $request->files->get('country_image');
        } else {
            
            $data = json_decode($request->getContent(), true);
            if (!$data) {
                return new JsonResponse(['error' => 'Données JSON invalides'], Response::HTTP_BAD_REQUEST);
            }
            
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

        // Vérifier que le nom n'existe pas déjà (sauf pour ce pays)
        $existingCountry = $this->countryRepository->findOneBy(['name' => $name]);
        if ($existingCountry && $existingCountry->getId() !== $id) {
            return new JsonResponse([
                'error' => 'Ce nom de pays existe déjà'
            ], Response::HTTP_CONFLICT);
        }

        // 🔍 DEBUG : Log des changements
        if ($this->logger) {
            $this->logger->info('📝 Modifications à appliquer:', [
                'country_id' => $id,
                'changes' => [
                    'name' => ['old' => $country->getName(), 'new' => $name],
                    'code' => ['old' => $country->getCode(), 'new' => $code],
                    'description' => ['old' => substr($country->getDescription() ?? '', 0, 50), 'new' => substr($description, 0, 50)],
                    'flag_url' => ['old' => $country->getFlagUrl(), 'new' => $flagUrl],
                    'has_new_image' => $countryImageFile !== null
                ]
            ]);
        }

        // Mise à jour des données
        $country->setName($name);
        $country->setCode($code);
        $country->setFlagUrl($flagUrl);
        $country->setDescription($description);
        $country->setUpdatedAt(new \DateTimeImmutable());

        // Gestion de la nouvelle image si fournie
        if ($countryImageFile) {
            $countryImagePath = $this->handleImageUpload($countryImageFile, 'countries');
            if ($countryImagePath) {
                $country->setCountryImage($countryImagePath);
                
                if ($this->logger) {
                    $this->logger->info('📷 Nouvelle image uploadée:', [
                        'country_id' => $id,
                        'image_path' => $countryImagePath
                    ]);
                }
            }
        }

        $this->entityManager->flush();

        // État APRÈS modification
        $allCountriesAfter = $this->countryRepository->findAll();
        $updatedCountry = $this->countryRepository->find($id); 

        if ($this->logger) {
            $this->logger->info('✅ APRÈS modification pays:', [
                'country_id' => $id,
                'updated_name' => $updatedCountry->getName(),
                'updated_code' => $updatedCountry->getCode(),
                'updated_description' => substr($updatedCountry->getDescription() ?? '', 0, 100),
                'updated_at' => $updatedCountry->getUpdatedAt()->format('Y-m-d H:i:s'),
                'total_countries' => count($allCountriesAfter),
                'modification_confirmed' => true
            ]);
        }

        //  RÉPONSE ENRICHIE avec état de la base
        $response = $this->serializeCountryAdmin($updatedCountry);
        $response['debug_info'] = [
            'modification_timestamp' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'total_countries' => count($allCountriesAfter),
            'modification_confirmed' => true,
            'updated_fields' => ['name', 'code', 'description', 'flag_url'],
            'fresh_from_db' => true
        ];

        return new JsonResponse($response);

    } catch (\Exception $e) {
        if ($this->logger) {
            $this->logger->error('❌ Erreur lors de la modification du pays', [
                'country_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_user' => $this->getUser()?->getEmail()
            ]);
        }

        return new JsonResponse([
            'error' => 'Erreur lors de la modification du pays',
            'details' => $e->getMessage()
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}

   
#[Route('/api/admin/countries/{id}', name: 'api_admin_country_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
#[IsGranted('ROLE_ADMIN')]
public function deleteCountry(int $id, Request $request): JsonResponse
{
    if ($id <= 0 || $id > 999999) {
        return new JsonResponse(['error' => 'ID invalide'], Response::HTTP_BAD_REQUEST);
    }

    try {
        //  Vérifier les pays AVANT suppression
        $allCountriesBefore = $this->countryRepository->findAll();
        if ($this->logger) {
            $this->logger->info('🔍 AVANT suppression - Pays en base:', [
                'total_countries' => count($allCountriesBefore),
                'country_ids' => array_map(fn($c) => $c->getId(), $allCountriesBefore),
                'country_to_delete' => $id
            ]);
        }

        $country = $this->countryRepository->find($id);

        if (!$country) {
            if ($this->logger) {
                $this->logger->warning('❌ Pays non trouvé pour suppression', [
                    'requested_id' => $id,
                    'existing_ids' => array_map(fn($c) => $c->getId(), $allCountriesBefore)
                ]);
            }
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier s'il y a du contenu associé
        $contentCount = $this->contentRepository->count(['country' => $country]);
        
        if ($contentCount > 0) {
            
            $contents = $this->contentRepository->findBy(['country' => $country]);
            foreach ($contents as $content) {
                $this->entityManager->remove($content);
            }
            
            if ($this->logger) {
                $this->logger->info('🗑️ Contenu associé supprimé:', [
                    'country_id' => $id,
                    'content_count' => $contentCount
                ]);
            }
        }

        $countryName = $country->getName();

        // Supprimer le pays
        $this->entityManager->remove($country);
        $this->entityManager->flush();

        // 🔍 DEBUG : Vérifier les pays APRÈS suppression
        $allCountriesAfter = $this->countryRepository->findAll();
        if ($this->logger) {
            $this->logger->info('✅ APRÈS suppression - Pays en base:', [
                'total_countries_before' => count($allCountriesBefore),
                'total_countries_after' => count($allCountriesAfter),
                'deleted_country_name' => $countryName,
                'remaining_country_ids' => array_map(fn($c) => $c->getId(), $allCountriesAfter)
            ]);
        }

        // 🚀 RÉPONSE ENRICHIE avec état de la base
        return new JsonResponse([
            'message' => 'Pays supprimé avec succès',
            'deleted_country' => $countryName,
            'deleted_content_count' => $contentCount,
            'deleted_country_id' => $id,
            
            'debug_info' => [
                'countries_before_delete' => count($allCountriesBefore),
                'countries_after_delete' => count($allCountriesAfter),
                'remaining_country_ids' => array_map(fn($c) => $c->getId(), $allCountriesAfter),
                'deletion_confirmed' => true,
                'timestamp' => (new \DateTimeImmutable())->format('Y-m-d H:i:s')
            ]
        ]);

    } catch (\Exception $e) {
        if ($this->logger) {
            $this->logger->error('❌ Erreur lors de la suppression du pays', [
                'country_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_user' => $this->getUser()?->getEmail()
            ]);
        }

        return new JsonResponse([
            'error' => 'Erreur lors de la suppression du pays',
            'details' => $e->getMessage()
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}

   
#[Route('/api/admin/countries/{id}/content', name: 'api_admin_country_content_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
#[IsGranted('ROLE_ADMIN')]
public function updateCountryContent(int $id, Request $request): JsonResponse
{
    if ($id <= 0 || $id > 999999) {
        return new JsonResponse(['error' => 'ID invalide'], Response::HTTP_BAD_REQUEST);
    }

    try {
        $country = $this->countryRepository->find($id);

        if (!$country) {
            return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
        }

        // 🔍 DEBUG : État AVANT mise à jour contenu
        $existingContents = $this->contentRepository->findBy(['country' => $country]);
        if ($this->logger) {
            $this->logger->info('🔍 AVANT mise à jour contenu:', [
                'country_id' => $id,
                'country_name' => $country->getName(),
                'existing_content_count' => count($existingContents),
                'existing_content_ids' => array_map(fn($c) => $c->getId(), $existingContents)
            ]);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data || !isset($data['sections'])) {
            return new JsonResponse(['error' => 'Données invalides'], Response::HTTP_BAD_REQUEST);
        }

        $sections = $data['sections'];

        if (!is_array($sections)) {
            return new JsonResponse(['error' => 'Les sections doivent être un tableau'], Response::HTTP_BAD_REQUEST);
        }

        // Supprimer l'ancien contenu
        foreach ($existingContents as $content) {
            $this->entityManager->remove($content);
        }

        // Créer le nouveau contenu
        $newContentIds = [];
        foreach ($sections as $index => $sectionData) {
            if (!isset($sectionData['title']) || !isset($sectionData['type'])) {
                continue; // Ignorer les sections invalides
            }

            $content = new Content();
            $content->setTitle($sectionData['title']);
            $content->setType($sectionData['type']);
            $content->setSection($sectionData['content'] ?? ''); // L'URL d'image ou le contenu texte
            $content->setCountry($country);
            $content->setCreatedAt(new \DateTimeImmutable());
            $content->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($content);
            $this->entityManager->flush(); // Flush pour obtenir l'ID
            $newContentIds[] = $content->getId();
        }

        // 🔍 DEBUG : État APRÈS mise à jour contenu
        $newContents = $this->contentRepository->findBy(['country' => $country]);
        if ($this->logger) {
            $this->logger->info('✅ APRÈS mise à jour contenu:', [
                'country_id' => $id,
                'country_name' => $country->getName(),
                'old_content_count' => count($existingContents),
                'new_content_count' => count($newContents),
                'new_content_ids' => $newContentIds,
                'sections_received' => count($sections),
                'content_update_confirmed' => true
            ]);
        }

        // 🚀 RÉPONSE ENRICHIE
        return new JsonResponse([
            'message' => 'Contenu mis à jour avec succès',
            'country' => $this->serializeCountryAdmin($country),
            'sections_count' => count($sections),
            'debug_info' => [
                'update_timestamp' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
                'old_content_count' => count($existingContents),
                'new_content_count' => count($newContents),
                'content_update_confirmed' => true,
                'fresh_from_db' => true
            ]
        ]);

    } catch (\Exception $e) {
        if ($this->logger) {
            $this->logger->error('❌ Erreur lors de la mise à jour du contenu', [
                'country_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_user' => $this->getUser()?->getEmail()
            ]);
        }

        return new JsonResponse([
            'error' => 'Erreur lors de la mise à jour du contenu',
            'details' => $e->getMessage()
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}

    #[Route('/api/admin/countries/upload-section-image', name: 'api_admin_section_image_upload', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function uploadSectionImage(Request $request): JsonResponse
    {
        try {
            $imageFile = $request->files->get('section_image');
            $countryId = $request->request->get('country_id');

            if (!$imageFile) {
                return new JsonResponse(['error' => 'Aucun fichier image fourni'], Response::HTTP_BAD_REQUEST);
            }

            if (!$countryId) {
                return new JsonResponse(['error' => 'ID du pays manquant'], Response::HTTP_BAD_REQUEST);
            }

            // Vérifier que le pays existe
            $country = $this->countryRepository->find($countryId);
            if (!$country) {
                return new JsonResponse(['error' => 'Pays introuvable'], Response::HTTP_NOT_FOUND);
            }

            // Upload de l'image dans le dossier 'sections'
            $imageUrl = $this->handleImageUpload($imageFile, 'sections');

            if (!$imageUrl) {
                return new JsonResponse(['error' => 'Erreur lors de l\'upload de l\'image'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            if ($this->logger) {
                $this->logger->info('✅ Image de section uploadée avec succès', [
                    'country_id' => $countryId,
                    'image_url' => $imageUrl,
                    'admin_user' => $this->getUser()?->getEmail()
                ]);
            }

            return new JsonResponse([
                'image_url' => $imageUrl,
                'message' => 'Image uploadée avec succès'
            ]);

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de l\'upload d\'image de section', [
                    'error' => $e->getMessage(),
                    'admin_user' => $this->getUser()?->getEmail()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de l\'upload de l\'image'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/admin/countries/stats', name: 'api_admin_countries_stats', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getCountriesStats(): JsonResponse
    {
        try {
            $totalCountries = $this->countryRepository->count([]);
            $totalContent = $this->contentRepository->count([]);
            
            // Statistiques par type de contenu
            $contentStats = [];
            $contentTypes = ['text', 'image', 'video'];
            
            foreach ($contentTypes as $type) {
                $contentStats[$type] = $this->contentRepository->count(['type' => $type]);
            }

            // Pays récents (derniers 30 jours)
            $thirtyDaysAgo = new \DateTimeImmutable('-30 days');
            $recentCountries = $this->countryRepository->createQueryBuilder('c')
                ->select('COUNT(c.id)')
                ->where('c.created_at >= :date')
                ->setParameter('date', $thirtyDaysAgo)
                ->getQuery()
                ->getSingleScalarResult();

            return new JsonResponse([
                'total_countries' => $totalCountries,
                'total_content' => $totalContent,
                'recent_countries' => $recentCountries,
                'content_by_type' => $contentStats
            ]);

        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('❌ Erreur lors de la récupération des statistiques', [
                    'error' => $e->getMessage(),
                    'admin_user' => $this->getUser()?->getEmail()
                ]);
            }

            return new JsonResponse([
                'error' => 'Erreur lors de la récupération des statistiques'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // ==========================================
    // 📁 MÉTHODE UTILITAIRE POUR L'UPLOAD
    // ==========================================

    /**
     * estion d'upload d'images avec sécurité renforcée
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
            
            // 🔒CRÉATION DU DOSSIER AVEC PERMISSIONS SÉCURISÉES
            if (!is_dir($uploadsDirectory)) {
                mkdir($uploadsDirectory, 0755, true);
            }

            // GÉNÉRATION D'UN NOM DE FICHIER SÉCURISÉ
            $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $this->slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

            //  VÉRIFICATION FINALE DE L'EXTENSION
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

            // DÉPLACEMENT DU FICHIER
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