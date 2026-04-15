# Guide de démarrage local — MedApp

## Prérequis

- **Node.js** v18+
- **Docker Desktop** (pour PostgreSQL uniquement)
- **npm**

---

## Ordre de démarrage

```powershell
# 1. Depuis la racine — démarrer PostgreSQL
docker compose up postgres -d

# 2. Depuis backend/ — créer les tables + insérer les données de test
cd backend
npm run seed

# 3. Terminal 1 — démarrer le backend
cd backend
npm run start:dev

# 4. Terminal 2 — démarrer le frontend
cd frontend
npm run dev
```

---

## Réinitialiser la BD (duplicate key / repartir à zéro)

```powershell
cd backend
Get-Content scripts/reset-database.sql | docker exec -i medapp_db psql -U medapp -d medapp
npm run seed
```

---

## Arrêter PostgreSQL

```powershell
docker compose stop postgres
```

---

## Comptes de test

Mot de passe universel : **`qwerty`**

| Rôle    | Email                     |
|---------|---------------------------|
| Admin   | admin@medapp.com          |
| Docteur | jean.dupont@medapp.com    |
| Docteur | marie.martin@medapp.com   |
| Docteur | pierre.bernard@medapp.com |
| Docteur | sophie.dubois@medapp.com  |
| Docteur | luc.laurent@medapp.com    |
| Patient | alice.dubois@email.com    |
| Patient | marc.leroy@email.com      |
| Patient | claire.moreau@email.com   |
| Patient | thomas.simon@email.com    |
| Patient | julie.michel@email.com    |

---

## Config `.env` (backend)

Copier `.env.example` en `.env` si pas encore fait :

```powershell
cd backend
copy .env.example .env
```

Contenu par défaut (pointe sur le conteneur Docker) :

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=medapp
DATABASE_PASSWORD=medapp_secret
DATABASE_NAME=medapp
JWT_SECRET=medapp_jwt_secret_key_2024
JWT_EXPIRES_IN=7d
PORT=3001
```
