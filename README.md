# 📝 Atlas - CI/CD Documentation

## 🚀 Déploiement et Intégration Continue

### Installation manuelle (pour tests)

```bash
# 1. Build des images
docker build . -t argentikk/atlasymfony-deployment
docker build . -t argentikk/atlasreact-deployment

# 2. Push vers DockerHub
docker push argentikk/atlasymfony-deployment
docker push argentikk/atlasreact-deployment

# 3. Déploiement 
docker-compose up -d

# 4. Configuration post-déploiement
docker exec atlas_symfony_backend_container composer install
docker exec atlas_symfony_backend_container php bin/console doctrine:migrations:migrate
docker exec atlas_symfony_backend_container php bin/console lexik:jwt:generate-keypair
```

### Automatisation Jenkins
Prérequis

Jenkins installé avec plugins Docker et Git
Credentials DockerHub : DOCKERHUB_USERNAME et DOCKERHUB_PASSWORD

Pipeline Backend (Jenkinsfile )  

```bash
pipeline {
    agent any
    stages {
        stage("Checkout") {
            steps {
                git branch: "main", url: "https://github.com/adamKHTML/Atlas"
            }
        }
        
        stage("Continuous Integration") {
            steps {
                sh "composer self-update"
                sh "composer install --no-interaction"
                sh "composer validate --no-check-publish"
            }
        }
        
        stage("Continuous Delivery") {
            steps {
                sh "docker build -t ${DOCKERHUB_USERNAME}/atlasymfony-deployment ."
                sh "echo ${DOCKERHUB_PASSWORD} | docker login -u ${DOCKERHUB_USERNAME} --password-stdin"
                sh "docker push ${DOCKERHUB_USERNAME}/atlasymfony-deployment"
            }
        }
        
        stage("Continuous Deployment") {
            steps {
                sh '''
                    docker-compose down || true
                    docker pull ${DOCKERHUB_USERNAME}/atlasymfony-deployment:latest
                    docker pull ${DOCKERHUB_USERNAME}/atlasreact-deployment:latest
                    docker-compose up -d
                    sleep 30
                    
                    docker exec atlas_symfony_backend_container composer install --optimize-autoloader
                    docker exec atlas_symfony_backend_container php bin/console lexik:jwt:generate-keypair --skip-if-exists
                    docker exec atlas_symfony_backend_container php bin/console doctrine:migrations:migrate --no-interaction
                    docker exec atlas_symfony_backend_container php bin/console cache:clear
                '''
            }
        }
    }
}

```
Pipeline Frontend (Jenkinsfile) 

```bash
pipeline {
    agent any
    
    stages {
        stage("Checkout") {
            steps {
                git branch: "main", url: "https://github.com/adamKHTML/Atlas"
            }
        }
        
        stage("Continuous Integration") {
            steps {
                dir('front') {
                    sh "npm install"
                    sh "npm install lucide-react country-list dompurify @tailwindcss/vite tailwindcss terser vitest"
                    sh "npm run build"
                    sh "npm run test"
                }
            }
        }
        
        stage("Continuous Delivery") {
            steps {
                dir('front') {
                    sh "docker build -t ${DOCKERHUB_USERNAME}/atlasreact-deployment ."
                    sh "echo ${DOCKERHUB_PASSWORD} | docker login -u ${DOCKERHUB_USERNAME} --password-stdin"
                    sh "docker push ${DOCKERHUB_USERNAME}/atlasreact-deployment"
                }
            }
        }
        
        stage("Deploy Frontend") {
            steps {
                sh '''
                    docker restart atlas_react_frontend_container || true
                    sleep 15
                    docker exec atlas_react_frontend_container npm install --production
                    docker exec atlas_react_frontend_container npm install lucide-react tailwindcss
                '''
            }
        }
    }
}
```

## Processus CI/CD Automatisé

| Étape | Action | Description |
|-------|--------|-------------|
| 1️⃣ | **GitHub Push** | Code Git committé sur main |
| ⬇️ | **Jenkins Trigger** | Auto Detect du nouveau code |
| 2️⃣ | **Build & Test** | npm/composer + tests automatiques |
| ⬇️ | **Docker Push** | Image envoyée vers DockerHub |
| 3️⃣ | **Auto Deploy** | Déploiement automatique sur VPS Server |


## Stack technologique

Frontend : React + Vite + Tailwind + Vitest
Backend : Symfony + JWT + Doctrine + MySQL
DevOps : Docker + Jenkins + DockerHub
Serveur : VPS Linux "LWS" + Docker Compose

## 🌐 URLs de production

Frontend : http://180.149.199.211:3002
Backend API : http://180.149.199.211:8092/
Base de données : MySQL (port 3306 interne)


## 📋 Plan de Tests - Projet Atlas

| Type de Test | Niveau | Outils | Composants Testés | Objectifs |
|--------------|--------|--------|-------------------|-----------|
| **Tests Unitaires Backend** | Composant | PHPUnit + TestCase | • UserController (authentification)<br>• UserRepository (accès données)<br>• Logique métier<br>• Aspects sécuritaires | Valider chaque composant serveur individuellement |
| **Tests Unitaires Frontend** | Composant | Vitest + React Testing Library | • Composants React<br>• authSlice (Redux)<br>• Dashboard (interface)<br>• Gestion des rôles utilisateur | Assurer le bon fonctionnement de l'interface |
| **Tests d'Intégration** | Système | PHPUnit + Vitest | • Communication API/Frontend<br>• Cohérence globale<br>• Interaction entre couches | Valider la communication entre composants |

### 🔧 Environnement de Tests

| Environnement | Configuration | Utilisation |
|---------------|---------------|-------------|
| **Backend Test** | • PHPUnit avec mocks<br>• Base de données test<br>• Isolation des dépendances | Tests unitaires et intégration backend |
| **Frontend Test** | • Vitest + JSDOM<br>• Stores Redux de test<br>• Environnement contrôlé | Tests composants React |
| **Intégration** | • API de test<br>• Données simulées<br>• Environnement complet | Tests bout en bout |

### ✅ Couverture des Tests

| Fonctionnalité | Backend | Frontend | Intégration | Statut |
|----------------|---------|----------|-------------|--------|
| Authentification JWT | ✅ | ✅ | ✅ | Validé |
| Gestion des rôles | ✅ | ✅ | ✅ | Validé |
| CRUD Pays | ✅ | ✅ | ⏳ | En cours |
| Upload fichiers | ✅ | ⏳ | ⏳ | En cours |
| API REST | ✅ | ✅ | ✅ | Validé |
