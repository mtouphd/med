# Scripts de Base de Données

Ce dossier contient les scripts pour gérer les données de test de votre application médicale.

## 📁 Fichiers

- **`reset-database.sql`** - Vide toutes les tables (⚠️ SUPPRIME TOUTES LES DONNÉES!)
- **`seed-database.ts`** - Crée des données de test complètes

---

## 🗑️ Vider la Base de Données

### Option 1: Via psql (ligne de commande)

```bash
psql -U postgres -d medapp -f scripts/reset-database.sql
```

### Option 2: Via pgAdmin ou DBeaver

1. Ouvrez votre client PostgreSQL (pgAdmin, DBeaver, etc.)
2. Connectez-vous à la base de données `medapp`
3. Ouvrez le fichier `scripts/reset-database.sql`
4. Exécutez le script

### Option 3: Via Docker (si vous utilisez Docker)

```bash
docker exec -i postgres_container psql -U postgres -d medapp < scripts/reset-database.sql
```

---

## 🌱 Créer des Données de Test

### Exécuter le Seeder

```bash
npm run seed
```

### Ce que le seeder crée:

#### 👤 **1 Admin**
- Email: `admin@test.com`
- Password: `qwerty`
- Rôle: ADMIN

#### 👨‍⚕️ **5 Doctors**
| Email | Nom | Spécialité | Password |
|-------|-----|------------|----------|
| doctor1@test.com | Doctor1 Smith | Cardiologie | qwerty |
| doctor2@test.com | Doctor2 Smith | Pédiatrie | qwerty |
| doctor3@test.com | Doctor3 Smith | Dermatologie | qwerty |
| doctor4@test.com | Doctor4 Smith | Neurologie | qwerty |
| doctor5@test.com | Doctor5 Smith | Médecine Générale | qwerty |

#### 🧑‍🤝‍🧑 **10 Patients**
| Email | Nom | Password |
|-------|-----|----------|
| patient1@test.com | Alice Johnson | qwerty |
| patient2@test.com | Bob Williams | qwerty |
| patient3@test.com | Charlie Brown | qwerty |
| patient4@test.com | Diana Davis | qwerty |
| patient5@test.com | Ethan Miller | qwerty |
| patient6@test.com | Fiona Wilson | qwerty |
| patient7@test.com | George Moore | qwerty |
| patient8@test.com | Hannah Taylor | qwerty |
| patient9@test.com | Ivan Anderson | qwerty |
| patient10@test.com | Julia Thomas | qwerty |

#### 🏥 **Associations Médecin-Patient**
- **Doctor1 (Cardiologie)**: 3 patients (Patient1, Patient2, Patient3)
- **Doctor2 (Pédiatrie)**: 2 patients (Patient4, Patient5)
- **Doctor3 (Dermatologie)**: 2 patients (Patient6, Patient7)
- **Doctor4 (Neurologie)**: 2 patients (Patient8, Patient9)
- **Patient10**: Aucun médecin de famille assigné (pour tester ce cas)

---

## 🔄 Workflow Complet de Réinitialisation

Pour repartir à zéro avec des données fraîches :

### 1. Vider la base de données

```bash
# Via psql
psql -U postgres -d medapp -f scripts/reset-database.sql
```

### 2. Créer les données de test

```bash
npm run seed
```

### 3. Démarrer le backend

```bash
npm run start:dev
```

---

## ✅ Tester les Comptes

Après le seeding, vous pouvez vous connecter avec n'importe quel compte :

### Se connecter en tant qu'Admin
```
Email: admin@test.com
Password: qwerty
```

### Se connecter en tant que Doctor
```
Email: doctor1@test.com (ou doctor2, doctor3, etc.)
Password: qwerty
```

### Se connecter en tant que Patient
```
Email: patient1@test.com (ou patient2, patient3, etc.)
Password: qwerty
```

---

## 🐛 Troubleshooting

### Erreur: "Cannot find module"
```bash
# Installer les dépendances
npm install
```

### Erreur: "Connection refused"
```bash
# Vérifier que PostgreSQL est démarré
# Vérifier les paramètres de connexion dans .env
```

### Erreur: "Duplicate key value"
```bash
# Vider d'abord la base de données
psql -U postgres -d medapp -f scripts/reset-database.sql
# Puis relancer le seed
npm run seed
```

---

## ⚠️ Avertissements

- ⚠️ **NE JAMAIS** exécuter `reset-database.sql` en production!
- ⚠️ Le script de reset **SUPPRIME TOUTES LES DONNÉES** de manière irréversible
- ⚠️ Ces scripts sont **uniquement pour le développement**
- ⚠️ Les mots de passe "qwerty" sont pour le test uniquement

---

## 📝 Notes Techniques

### Hashage des Mots de Passe
Les mots de passe sont automatiquement hashés avec bcrypt (10 rounds) par le `UsersService`.

### Historique de Médecin de Famille
Chaque assignation de médecin de famille crée automatiquement une entrée dans `family_doctor_history` pour la traçabilité.

### Profils Médicaux
Chaque patient créé a automatiquement un `medical_record` associé (vide au départ).

---

## 🎯 Cas d'Usage pour les Tests

### Tester le Workflow d'Approbation
1. Connectez-vous en tant que **Patient1**
2. Créez un rendez-vous → Status: PENDING
3. Connectez-vous en tant que **Doctor1**
4. Approuvez le rendez-vous
5. Connectez-vous en tant qu'**Admin**
6. Approuvez le rendez-vous → Status: CONFIRMED

### Tester la Règle du Médecin de Famille (BR-A-002)
1. Connectez-vous en tant que **Patient1** (a un médecin de famille: Doctor1)
2. Essayez de prendre rendez-vous avec **Doctor2** (autre médecin)
3. Si Doctor1 est disponible au même créneau → ❌ Refusé
4. Si Doctor1 n'est pas disponible → ✅ Autorisé

### Tester l'Assignation de Médecin de Famille
1. Connectez-vous en tant qu'**Admin**
2. Assignez Doctor5 comme médecin de famille de Patient10
3. Vérifiez l'historique dans `family_doctor_history`

---

Bon développement! 🚀
