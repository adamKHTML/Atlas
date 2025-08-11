# Utilise l'image officielle PHP 8.3avec Apache intégré
FROM php:8.3-apache

# Active le module "rewrite" d’Apache, utile pour les routes propres (ex: /produit/12)
RUN a2enmod rewrite

# Met à jour les paquets et installe :
# - libzip-dev : nécessaire pour activer l'extension PHP zip
# - git : requis par Composer pour récupérer des dépendances depuis des dépôts Git
# - wget : pour télécharger Composer
# Nettoie ensuite les fichiers inutiles pour alléger l’image
RUN apt-get update \
  && apt-get install -y libzip-dev git wget --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Installe les extensions PHP nécessaires :
# - pdo : interface PHP pour interagir avec des bases de données via PDO
# - mysqli et pdo_mysql : connexions à MySQL/MariaDB
# - zip : gestion des fichiers compressés ZIP
RUN docker-php-ext-install pdo mysqli pdo_mysql zip;

# Télécharge et installe Composer (v2.0.9), puis le rend exécutable
RUN wget https://getcomposer.org/download/2.0.9/composer.phar \
    && mv composer.phar /usr/bin/composer && chmod +x /usr/bin/composer

# Copie la configuration Apache personnalisée (VirtualHost, DocumentRoot, etc.)
COPY docker/apache.conf /etc/apache2/sites-enabled/000-default.conf

# Copie tous les fichiers de l'application dans le dossier /var/www (racine du site)
COPY . /var/www

# Définit le répertoire de travail à /var/www pour les prochaines instructions
WORKDIR /var/www

# Commande par défaut : démarre Apache en mode "foreground" pour que Docker garde le conteneur actif
CMD ["apache2-foreground"]