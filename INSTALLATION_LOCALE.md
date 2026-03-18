# Guide d'Installation Locale - MedApp

Ce guide vous permettra de configurer et exécuter MedApp localement avec la base de données PostgreSQL dans Docker.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé:

| Outil | Version minimale | Vérification |
|-------|------------------|--------------|
| Node.js | 18.x ou supérieur | `node --version` |
| npm | 9.x ou supérieur | `npm --version` |
| Docker Desktop | Dernière version | `docker --version` |
| Docker Compose | Inclus avec Docker Desktop | `docker-compose --version` |

---

## Architecture du Projet

```
med/
├── backend/          # API NestJS (port 3001)
├── frontend/         # Application Next.js (port 3000)
├── docker-compose.yml
└── ...
```

**Stack Technologique:**
- **Backend:** NestJS + TypeORM
- **Frontend:** Next.js 14 + Tailwind CSS
- **Base de données:** PostgreSQL 15

---

## Étape 1: Démarrer la Base de Données PostgreSQL

### 1.1 Démarrer le conteneur PostgreSQL

Ouvrez un terminal à la racine du projet et exécutez:

```bash
docker-compose up -d postgres
```

Cette commande:
- Télécharge l'image `postgres:15-alpine` si nécessaire
- Crée un conteneur nommé `medapp_db`
- Expose le port `5432`
- Crée un volume persistant pour les données

### 1.2 Vérifier que PostgreSQL fonctionne

```bash
docker ps
```

Vous devriez voir quelque chose comme:
```
CONTAINER ID   IMAGE                PORTS                    NAMES
abc123...      postgres:15-alpine   0.0.0.0:5432->5432/tcp   medapp_db
```

### 1.3 Vérifier la connexion (optionnel)

```bash
docker exec -it medapp_db psql -U medapp -d medapp -c "\l"
```

---

## Étape 2: Configurer le Backend

### 2.1 Naviguer vers le dossier backend

```bash
cd backend
```

### 2.2 Créer le fichier d'environnement

Copiez le fichier d'exemple:

```bash
copy .env.example .env
```

Ou créez manuellement un fichier `.env` avec ce contenu:

```env
# Configuration Base de Données
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=medapp
DATABASE_PASSWORD=medapp_secret
DATABASE_NAME=medapp

# Configuration JWT
JWT_SECRET=medapp_jwt_secret_key_2024
JWT_EXPIRES_IN=7d

# Port du serveur
PORT=3001
```

### 2.3 Installer les dépendances

```bash
npm install
```

### 2.4 Démarrer le serveur backend

**Mode développement (avec hot-reload):**
```bash
npm run start:dev
```

**Mode standard:**
```bash
npm run start
```

Le backend sera accessible sur: **http://localhost:3001**

### 2.5 Vérifier que le backend fonctionne

Ouvrez un navigateur ou utilisez curl:

```bash
curl http://localhost:3001
```

> **Note:** Au premier démarrage, TypeORM créera automatiquement les tables dans la base de données grâce à l'option `synchronize: true`.

---

## Étape 3: Configurer le Frontend

### 3.1 Ouvrir un nouveau terminal

Gardez le backend en cours d'exécution et ouvrez un nouveau terminal.

### 3.2 Naviguer vers le dossier frontend

```bash
cd frontend
```

### 3.3 Configurer les variables d'environnement (optionnel)

Créez un fichier `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

> Si ce fichier n'existe pas, l'application utilisera la configuration par défaut.

### 3.4 Installer les dépendances

```bash
npm install
```

### 3.5 Démarrer le serveur frontend

```bash
npm run dev
```

Le frontend sera accessible sur: **http://localhost:3000**

---

## Étape 4: Peupler la Base de Données (Optionnel)

### 4.1 Exécuter le script de seed

Depuis le dossier `backend`:

```bash
npm run seed
```

Ce script crée des données de test:
- Utilisateurs (patients, médecins, admins)
- Rendez-vous
- Dossiers médicaux

---

## Résumé des Commandes

### Démarrage Rapide (3 terminaux)

**Terminal 1 - Base de données:**
```bash
docker-compose up -d postgres
```

**Terminal 2 - Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### URLs d'Accès

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

---

## Commandes Utiles

### Docker

```bash
# Voir les conteneurs en cours
docker ps

# Voir les logs PostgreSQL
docker logs medapp_db

# Arrêter PostgreSQL
docker-compose stop postgres

# Supprimer le conteneur et les données
docker-compose down -v

# Redémarrer PostgreSQL
docker-compose restart postgres

# Accéder au shell PostgreSQL
docker exec -it medapp_db psql -U medapp -d medapp
```

### Backend

```bash
# Démarrer en mode debug
npm run start:debug

# Linter
npm run lint

# Formater le code
npm run format

# Build pour production
npm run build

# Démarrer en production
npm run start:prod
```

### Frontend

```bash
# Build pour production
npm run build

# Démarrer en mode production
npm start

# Linter
npm run lint
```

### Base de Données

```bash
# Dans le dossier backend

# Peupler avec des données de test
npm run seed

# Générer une migration
npm run migration:generate

# Exécuter les migrations
npm run migration:run
```

---

## Dépannage

### Problème: Le port 5432 est déjà utilisé

**Solution:**
```bash
# Trouver le processus utilisant le port
netstat -ano | findstr :5432

# Ou modifier le port dans docker-compose.yml
ports:
  - "5433:5432"  # Utiliser le port 5433 à la place
```

Puis mettre à jour `DATABASE_PORT=5433` dans `.env`

### Problème: Erreur de connexion à la base de données

**Vérifications:**
1. PostgreSQL est-il en cours d'exécution?
   ```bash
   docker ps
   ```
2. Le fichier `.env` est-il correctement configuré?
3. Les credentials correspondent-ils?

### Problème: npm install échoue

**Solutions:**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm cache clean --force
npm install
```

### Problème: Le frontend ne trouve pas l'API

**Vérifications:**
1. Le backend est-il démarré sur le port 3001?
2. Le fichier `.env.local` contient-il la bonne URL?

---

## Structure des Rôles Utilisateurs

| Rôle | Description |
|------|-------------|
| **Patient** | Peut prendre des rendez-vous, voir son dossier médical |
| **Doctor** | Gère les rendez-vous, accède aux dossiers patients |
| **Admin** | Gestion complète du système |

---

## Prochaines Étapes

Une fois l'installation terminée:

1. Accédez à http://localhost:3000
2. Créez un compte ou utilisez les données de test (après `npm run seed`)
3. Explorez les fonctionnalités de l'application

---

## Ressources Additionnelles

- `SPEC.md` - Spécifications complètes du projet
- `DATABASE_MODEL.md` - Modèle de données détaillé
- `BUSINESS_RULES.md` - Règles métier
- `DEPLOYMENT.md` - Guide de déploiement en production
