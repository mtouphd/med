# Règles Métier - Système de Gestion Médicale

**Version:** 1.0
**Date:** 2026-02-14
**Statut:** Document de Référence

---

## Table des Matières

1. [Gestion des Utilisateurs](#1-gestion-des-utilisateurs)
2. [Gestion des Patients](#2-gestion-des-patients)
3. [Gestion des Médecins](#3-gestion-des-médecins)
4. [Médecin de Famille](#4-médecin-de-famille)
5. [Gestion des Rendez-vous](#5-gestion-des-rendez-vous)
6. [Workflow d'Approbation](#6-workflow-dapprobation)
7. [Dossier Médical](#7-dossier-médical)
8. [Contrôle d'Accès & Sécurité](#8-contrôle-daccès--sécurité)
9. [Validation des Données](#9-validation-des-données)
10. [Règles de Notification](#10-règles-de-notification)
11. [Règles d'Audit](#11-règles-daudit)

---

## 1. Gestion des Utilisateurs

### BR-U-001: Création de Compte
**Règle:** Seul un administrateur peut créer un compte utilisateur.

**Conditions:**
- ✅ Email unique dans le système
- ✅ Email au format valide
- ✅ Mot de passe minimum 8 caractères
- ✅ Rôle obligatoire (PATIENT, DOCTOR, ADMIN)
- ✅ Nom et prénom obligatoires
- ✅ Téléphone au format valide

**Actions:**
1. Valider l'unicité de l'email
2. Hasher le mot de passe (bcrypt, 10 rounds)
3. Créer l'utilisateur avec `isActive = true`
4. Si role = PATIENT → créer automatiquement l'entité Patient
5. Si role = DOCTOR → créer automatiquement l'entité Doctor (avec infos professionnelles)

**Exceptions:**
- ❌ Email déjà existant → HTTP 409 Conflict
- ❌ Format email invalide → HTTP 400 Bad Request
- ❌ Mot de passe faible → HTTP 400 Bad Request

---

### BR-U-002: Authentification
**Règle:** L'authentification se fait par email/mot de passe avec JWT.

**Conditions:**
- ✅ Compte actif (`isActive = true`)
- ✅ Email et mot de passe corrects
- ✅ Token JWT valide pour 7 jours (configurable)

**Actions:**
1. Vérifier email existe
2. Vérifier compte actif
3. Comparer mot de passe hashé
4. Générer JWT contenant: `userId`, `email`, `role`, `patientId/doctorId`
5. Retourner token + infos utilisateur (sans password)

**Exceptions:**
- ❌ Email inexistant → HTTP 401 Unauthorized
- ❌ Mot de passe incorrect → HTTP 401 Unauthorized
- ❌ Compte désactivé → HTTP 403 Forbidden "Account disabled"
- ❌ Token expiré → HTTP 401 Unauthorized

---

### BR-U-003: Modification de Compte
**Règle:** Un utilisateur peut modifier ses propres informations. Admin peut modifier tout compte.

**Permissions:**
- ✅ User peut modifier: `firstName`, `lastName`, `phone`
- ✅ Admin peut modifier: tous les champs sauf `password` (via endpoint dédié)
- ❌ User ne peut pas modifier: `email`, `role`, `isActive`

**Actions:**
1. Vérifier permissions (user = soi-même OU admin)
2. Valider les nouvelles données
3. Mettre à jour `updatedAt`

**Exceptions:**
- ❌ User tente de modifier autre compte → HTTP 403 Forbidden
- ❌ Tentative de modification email/role sans être admin → HTTP 403

---

### BR-U-004: Changement de Mot de Passe
**Règle:** User peut changer son mot de passe. Admin peut réinitialiser n'importe quel mot de passe.

**Conditions User:**
- ✅ Ancien mot de passe correct
- ✅ Nouveau mot de passe différent de l'ancien
- ✅ Nouveau mot de passe minimum 8 caractères

**Conditions Admin (Reset):**
- ✅ Génération d'un mot de passe temporaire
- ✅ Email de notification au user

**Actions:**
1. [User] Vérifier ancien mot de passe
2. Hasher nouveau mot de passe
3. Sauvegarder
4. [Optionnel] Invalider tous les tokens JWT existants

**Exceptions:**
- ❌ Ancien mot de passe incorrect → HTTP 401
- ❌ Nouveau mot de passe identique → HTTP 400

---

### BR-U-005: Désactivation de Compte
**Règle:** Seul admin peut désactiver un compte. La suppression physique est interdite.

**Conditions:**
- ✅ Admin uniquement
- ✅ Soft delete: `isActive = false`
- ✅ Données conservées pour audit

**Actions:**
1. Mettre `isActive = false`
2. [Si Doctor] Gérer réassignation patients de famille (voir BR-MF-006)
3. [Si Patient] Annuler rendez-vous futurs
4. Invalider tokens JWT

**Exceptions:**
- ❌ Non-admin tente de désactiver → HTTP 403
- ❌ Tentative de suppression physique → HTTP 403 "Physical deletion not allowed"

---

## 2. Gestion des Patients

### BR-P-001: Inscription Patient
**Règle:** Seul admin peut inscrire un patient dans la clinique.

**Conditions:**
- ✅ User avec role PATIENT doit exister (voir BR-U-001)
- ✅ Un Patient par User
- ✅ Dossier médical créé automatiquement

**Actions:**
1. Vérifier User existe et role = PATIENT
2. Vérifier Patient n'existe pas déjà pour ce User
3. Créer Patient avec `userId`
4. Créer MedicalRecord automatiquement
5. [Optionnel] Assigner médecin de famille (voir BR-MF-001)

**Exceptions:**
- ❌ User non-patient → HTTP 400 "User must have PATIENT role"
- ❌ Patient déjà existant → HTTP 409 "Patient already exists"

---

### BR-P-002: Modification Profil Patient
**Règle:** Admin peut modifier. Patient peut modifier ses propres infos non-médicales.

**Permissions:**
- ✅ Patient peut modifier: `address`, `emergencyContact`
- ✅ Admin peut modifier: tous les champs
- ❌ Patient ne peut pas modifier: `familyDoctorId` (voir BR-MF-001)

**Actions:**
1. Vérifier permissions
2. Valider données
3. Sauvegarder

**Exceptions:**
- ❌ Patient tente de modifier `familyDoctorId` → HTTP 403
- ❌ Date de naissance invalide (dans le futur) → HTTP 400

---

### BR-P-003: Suppression Patient
**Règle:** Seul admin peut supprimer un patient. Soft delete uniquement.

**Conditions:**
- ✅ Admin uniquement
- ✅ Vérifier pas de rendez-vous futurs confirmés
- ✅ Désactiver le User associé

**Actions:**
1. Vérifier rendez-vous futurs
2. Annuler rendez-vous PENDING
3. Désactiver User (`isActive = false`)
4. [Optionnel] Archiver dossier médical

**Exceptions:**
- ❌ Rendez-vous futurs confirmés → HTTP 409 "Patient has confirmed appointments"
- ❌ Non-admin → HTTP 403

---

### BR-P-004: Consultation Profil Patient
**Règle:** Patient voit son profil. Médecin de famille voit profil de ses patients. Admin voit tout.

**Permissions:**
- ✅ Patient: ses propres données
- ✅ Doctor: ses patients de famille uniquement
- ✅ Admin: tous les patients

**Actions:**
1. Vérifier permissions (voir section 8)
2. Retourner données selon permissions
3. Exclure infos sensibles selon rôle

**Exceptions:**
- ❌ Doctor tente d'accéder patient non-famille → HTTP 403
- ❌ Patient tente d'accéder autre patient → HTTP 403

---

## 3. Gestion des Médecins

### BR-D-001: Création Profil Médecin
**Règle:** Admin crée un User DOCTOR puis complète le profil médecin.

**Conditions:**
- ✅ User avec role DOCTOR existe
- ✅ Numéro de licence unique
- ✅ Spécialité obligatoire
- ✅ Durée consultation par défaut: 30 min

**Actions:**
1. Créer User role DOCTOR
2. Créer Doctor avec infos professionnelles
3. Définir schedule de disponibilité
4. `isAvailable = true` par défaut

**Exceptions:**
- ❌ Numéro de licence déjà existant → HTTP 409
- ❌ Durée consultation < 15 min ou > 240 min → HTTP 400

---

### BR-D-002: Modification Profil Médecin
**Règle:** Admin peut modifier tout. Médecin peut modifier: bio, schedule, consultationDuration.

**Permissions:**
- ✅ Doctor peut modifier: `bio`, `schedule`, `consultationDuration`
- ✅ Admin peut modifier: tous les champs
- ❌ Doctor ne peut pas modifier: `specialty`, `licenseNumber`, `maxFamilyPatients`

**Actions:**
1. Vérifier permissions
2. Valider données
3. [Si schedule modifié] Vérifier pas de conflit avec rendez-vous existants

**Exceptions:**
- ❌ Doctor tente modifier specialty → HTTP 403
- ❌ Schedule invalide (horaires incohérents) → HTTP 400

---

### BR-D-003: Disponibilité Médecin
**Règle:** Médecin peut activer/désactiver sa disponibilité. Admin peut forcer.

**Conditions:**
- ✅ `isAvailable` contrôle si le médecin accepte nouveaux rendez-vous
- ✅ Médecin indisponible ne reçoit pas nouvelles demandes
- ✅ Rendez-vous confirmés existants non affectés

**Actions:**
1. Mettre à jour `isAvailable`
2. [Si false] Notifier patients avec rendez-vous futurs

**Exceptions:**
- Aucune exception

---

### BR-D-004: Limite Patients de Famille
**Règle:** Admin peut définir limite de patients de famille par médecin.

**Conditions:**
- ✅ `maxFamilyPatients` nullable (null = illimité)
- ✅ Si limite atteinte, pas de nouvelle assignation possible
- ✅ Patients existants conservés même si limite dépassée après modification

**Actions:**
1. Admin définit limite
2. Système vérifie lors de BR-MF-001

**Exceptions:**
- ❌ Tentative assignation si limite atteinte → HTTP 409 "Doctor capacity reached"

---

## 4. Médecin de Famille

### BR-MF-001: Assignation Médecin de Famille
**Règle:** Seul admin peut assigner un médecin de famille à un patient.

**Conditions:**
- ✅ Patient existe
- ✅ Doctor existe et `isAvailable = true`
- ✅ Limite médecin non atteinte (BR-D-004)
- ✅ Un seul médecin de famille par patient

**Actions:**
1. Vérifier conditions
2. Enregistrer `previousDoctorId` si changement
3. Mettre à jour `patient.familyDoctorId`
4. Enregistrer `familyDoctorAssignedAt = now()`
5. Créer entrée dans FamilyDoctorHistory
   - Type: ASSIGNED (si premier) ou CHANGED (si changement)
   - Enregistrer `changedBy` (admin)
   - Enregistrer `reason`

**Exceptions:**
- ❌ Doctor indisponible → HTTP 400 "Doctor not available"
- ❌ Limite atteinte → HTTP 409 "Doctor capacity reached"
- ❌ Non-admin → HTTP 403

**Exemple:**
```typescript
await assignFamilyDoctor(
  patientId: 'patient-123',
  doctorId: 'doctor-456',
  assignedBy: 'admin-789',
  reason: 'Premier médecin de famille'
);
```

---

### BR-MF-002: Changement Médecin de Famille
**Règle:** Admin peut changer le médecin de famille. Utilise la même logique que BR-MF-001.

**Conditions:**
- ✅ Patient a déjà un médecin de famille
- ✅ Nouveau médecin différent de l'actuel
- ✅ Raison obligatoire pour le changement

**Actions:**
1. Enregistrer ancien médecin
2. Assigner nouveau médecin (voir BR-MF-001)
3. FamilyDoctorHistory.changeType = CHANGED

**Exceptions:**
- ❌ Nouveau médecin = actuel → HTTP 400 "Same doctor"
- ❌ Raison manquante → HTTP 400 "Reason required"

---

### BR-MF-003: Retrait Médecin de Famille
**Règle:** Admin peut retirer le médecin de famille d'un patient.

**Conditions:**
- ✅ Patient a un médecin de famille
- ✅ Raison recommandée

**Actions:**
1. Mettre `patient.familyDoctorId = null`
2. Mettre `patient.familyDoctorAssignedAt = null`
3. Créer entrée FamilyDoctorHistory
   - Type: REMOVED
   - previousDoctorId = ancien médecin
   - newDoctorId = null

**Exceptions:**
- ❌ Patient n'a pas de médecin → HTTP 400 "No family doctor"

---

### BR-MF-004: Historique Médecin de Famille
**Règle:** Toute modification de médecin de famille est tracée.

**Conditions:**
- ✅ Chaque changement crée une entrée
- ✅ Inclut: qui, quand, pourquoi
- ✅ Données immuables (pas de modification possible)

**Actions:**
- Insertion automatique lors de BR-MF-001, 002, 003

**Permissions Lecture:**
- ✅ Admin: tout l'historique
- ✅ Patient: son propre historique
- ❌ Doctor: ne voit pas l'historique (sauf si admin le rend visible)

---

### BR-MF-005: Demande Changement par Patient (Phase 2 - Future)
**Règle:** Patient peut demander changement, admin approuve.

**Conditions:**
- ✅ Patient a un médecin de famille
- ✅ Raison obligatoire
- ✅ Admin doit approuver

**Workflow:**
1. Patient crée FamilyDoctorChangeRequest
2. Admin reçoit notification
3. Admin approuve ou rejette
4. Si approuvé → exécuter BR-MF-002

**Exceptions:**
- ❌ Demande en cours déjà → HTTP 409 "Request pending"

---

### BR-MF-006: Gestion Départ Médecin
**Règle:** Quand un médecin quitte, réassigner ou retirer ses patients de famille.

**Conditions:**
- ✅ Admin désactive le médecin
- ✅ Liste tous ses patients de famille
- ✅ Stratégie de réassignation: AUTO ou MANUAL

**Stratégies:**

**AUTO:**
- Répartir équitablement sur médecins disponibles de même spécialité
- Ordre: médecin avec moins de patients en premier

**MANUAL:**
- Admin assigne manuellement chaque patient
- Patients temporairement sans médecin de famille

**Actions:**
1. Désactiver médecin (`isAvailable = false`)
2. Lister ses patients de famille
3. Notifier admin
4. [AUTO] Répartir automatiquement
5. [MANUAL] Attendre assignation admin
6. Créer entrées FamilyDoctorHistory pour chaque changement

**Exceptions:**
- ❌ Aucun médecin disponible en AUTO → HTTP 409 "No available doctors"

---

## 5. Gestion des Rendez-vous

### BR-A-001: Création Rendez-vous
**Règle:** Patient peut demander rendez-vous. Admin peut créer directement.

**Conditions:**
- ✅ Patient existe
- ✅ Doctor existe et `isAvailable = true`
- ✅ Date/heure dans le futur (minimum 2h à l'avance, sauf admin)
- ✅ Date/heure maximum 3 mois à l'avance
- ✅ Durée: 15-120 minutes, multiples de 15
- ✅ Pas de conflit horaire pour le médecin
- ✅ Vérifier règle médecin de famille (BR-A-002)

**Actions:**
1. Valider date/heure/durée
2. Vérifier disponibilité médecin (BR-A-003)
3. Vérifier règle médecin de famille (BR-A-002)
4. Créer rendez-vous avec `status = PENDING`
5. Enregistrer `requestedBy`
6. Notifier médecin et admin

**Exceptions:**
- ❌ Date dans le passé → HTTP 400 "Date must be in future"
- ❌ Délai < 2h → HTTP 400 "Minimum 2 hours advance" (sauf admin)
- ❌ Durée invalide → HTTP 400 "Duration must be 15-120 min, multiple of 15"
- ❌ Conflit horaire → HTTP 409 "Doctor not available at this time"
- ❌ Règle médecin de famille violée → HTTP 400 avec message explicatif

---

### BR-A-002: Règle Médecin de Famille (Priorité)
**Règle:** Patient doit d'abord consulter son médecin de famille si disponible.

**Conditions:**
- ✅ Si patient N'A PAS de médecin de famille → peut consulter n'importe quel médecin
- ✅ Si patient A un médecin de famille ET rendez-vous avec CE médecin → OK
- ✅ Si patient A un médecin de famille ET rendez-vous avec AUTRE médecin:
  - Vérifier disponibilité médecin de famille au créneau demandé
  - Si médecin de famille DISPONIBLE → REFUS avec message
  - Si médecin de famille INDISPONIBLE → OK

**Logique:**
```typescript
function canBookWithDoctor(patient, requestedDoctor, dateTime) {
  // Pas de médecin de famille → OK
  if (!patient.familyDoctorId) return { allowed: true };

  // Rendez-vous avec son médecin de famille → OK
  if (patient.familyDoctorId === requestedDoctor.id) return { allowed: true };

  // Rendez-vous avec autre médecin → vérifier dispo médecin de famille
  const familyDoctorAvailable = isDoctorAvailable(
    patient.familyDoctorId,
    dateTime,
    requestedDoctor.consultationDuration
  );

  if (familyDoctorAvailable) {
    return {
      allowed: false,
      reason: "Votre médecin de famille est disponible à ce créneau. Veuillez d'abord prendre rendez-vous avec lui."
    };
  }

  return { allowed: true };
}
```

**Exceptions:**
- Message explicatif si refusé

---

### BR-A-003: Vérification Disponibilité Médecin
**Règle:** Un médecin ne peut avoir qu'un rendez-vous par créneau.

**Vérifications:**
1. **Médecin actif:** `doctor.isAvailable = true`
2. **Jour de travail:** `doctor.schedule[dayOfWeek].enabled = true`
3. **Horaire de travail:** créneau dans `schedule[dayOfWeek].start/end`
4. **Pas de conflit:** aucun rendez-vous CONFIRMED ou PENDING sur ce créneau

**Logique:**
```typescript
async function isDoctorAvailable(doctorId, dateTime, duration) {
  // 1. Médecin existe et disponible
  const doctor = await findDoctor(doctorId);
  if (!doctor || !doctor.isAvailable) return false;

  // 2. Vérifier schedule
  const dayOfWeek = getDayOfWeek(dateTime); // 'monday', 'tuesday', etc.
  const schedule = doctor.schedule[dayOfWeek];
  if (!schedule || !schedule.enabled) return false;

  const time = getTime(dateTime); // '14:30'
  if (time < schedule.start || time > schedule.end) return false;

  // 3. Vérifier conflits
  const endTime = addMinutes(dateTime, duration);
  const conflict = await appointmentRepo.findOne({
    where: {
      doctorId,
      status: In(['CONFIRMED', 'PENDING']),
      // Rendez-vous chevauche le créneau demandé
      dateTime: LessThan(endTime),
      // ET se termine après le début du créneau
      // (dateTime + duration) > dateTime demandé
    }
  });

  return !conflict;
}
```

**Exceptions:**
- Retourne simplement `false` si indisponible

---

### BR-A-004: Modification Rendez-vous
**Règle:** Modification = Annulation + Nouvelle Demande (pour conserver audit trail).

**Permissions:**
- ✅ Patient peut modifier ses rendez-vous PENDING
- ✅ Admin peut modifier n'importe quel rendez-vous
- ❌ Doctor ne peut pas modifier (seulement approuver/rejeter)

**Actions:**
1. Annuler rendez-vous actuel (BR-A-006)
2. Créer nouveau rendez-vous (BR-A-001)
3. [Optionnel] Lier les deux dans une table de tracking

**Exceptions:**
- ❌ Rendez-vous CONFIRMED → Nécessite annulation explicite d'abord
- ❌ Rendez-vous dans moins de 2h → HTTP 400 "Too late to modify"

---

### BR-A-005: Consultation Rendez-vous
**Règle:** Patient voit ses rendez-vous. Doctor voit rendez-vous le concernant. Admin voit tout.

**Permissions:**
- ✅ Patient: ses rendez-vous (tous status)
- ✅ Doctor: rendez-vous où `doctorId = doctor.id` (tous status)
- ✅ Admin: tous les rendez-vous

**Filtres:**
- Par status: PENDING, CONFIRMED, COMPLETED, CANCELLED, REJECTED
- Par date: futurs, passés, période
- Par médecin/patient

**Exceptions:**
- ❌ Patient tente voir rendez-vous d'autre patient → HTTP 403

---

### BR-A-006: Annulation Rendez-vous
**Règle:** Patient peut annuler jusqu'à 24h avant. Médecin/Admin toujours.

**Conditions:**
- ✅ Patient: minimum 24h avant (configurable)
- ✅ Doctor/Admin: à tout moment
- ✅ Raison recommandée

**Actions:**
1. Vérifier permissions et délai
2. Mettre `status = CANCELLED`
3. Enregistrer qui a annulé et quand
4. Notifier les parties concernées

**Exceptions:**
- ❌ Patient annule < 24h → HTTP 400 "Cancellation too late"
- ❌ Rendez-vous déjà COMPLETED → HTTP 400 "Cannot cancel completed"

---

## 6. Workflow d'Approbation

### BR-W-001: Double Approbation Obligatoire
**Règle:** Un rendez-vous nécessite approbation du médecin ET de l'admin.

**États:**
- `PENDING`: Créé, en attente d'approbations
- `CONFIRMED`: Les DEUX ont approuvé
- `REJECTED`: AU MOINS UN a rejeté

**Logique:**
```typescript
function updateAppointmentStatus(appointment) {
  if (appointment.doctorApproved && appointment.adminApproved) {
    appointment.status = 'CONFIRMED';
  } else if (appointment.doctorRejectionReason || appointment.adminRejectionReason) {
    appointment.status = 'REJECTED';
  } else {
    appointment.status = 'PENDING';
  }
}
```

---

### BR-W-002: Approbation Médecin
**Règle:** Médecin peut approuver/rejeter ses rendez-vous.

**Conditions:**
- ✅ Médecin = `appointment.doctorId`
- ✅ Status = PENDING
- ✅ Date rendez-vous dans le futur

**Actions Approbation:**
1. Vérifier permissions
2. Mettre `doctorApproved = true`
3. Enregistrer `doctorApprovedAt = now()`
4. Enregistrer `doctorApprovedBy = doctorId`
5. Appliquer BR-W-001 (vérifier si CONFIRMED)
6. Notifier patient et admin

**Actions Rejet:**
1. Vérifier permissions
2. Mettre `doctorApproved = false`
3. Enregistrer `doctorRejectionReason` (obligatoire)
4. Mettre `status = REJECTED`
5. Notifier patient et admin

**Exceptions:**
- ❌ Médecin tente approuver rendez-vous d'autre médecin → HTTP 403
- ❌ Rendez-vous déjà CONFIRMED → HTTP 400 "Already confirmed"
- ❌ Rejet sans raison → HTTP 400 "Reason required"

---

### BR-W-003: Approbation Admin
**Règle:** Admin peut approuver/rejeter n'importe quel rendez-vous.

**Conditions:**
- ✅ Role ADMIN
- ✅ Status = PENDING
- ✅ Date rendez-vous dans le futur

**Actions:**
- Identiques à BR-W-002, mais avec `adminApproved`, `adminApprovedBy`, `adminRejectionReason`

---

### BR-W-004: Ordre d'Approbation
**Règle:** Les approbations sont parallèles (pas d'ordre imposé).

**Logique:**
- ✅ Médecin peut approuver avant admin
- ✅ Admin peut approuver avant médecin
- ✅ Status = CONFIRMED seulement quand LES DEUX ont approuvé
- ✅ Un seul rejet suffit pour REJECTED

---

### BR-W-005: Timeout Automatique (Phase 2 - Future)
**Règle:** Rejet automatique si pas d'approbation sous 7 jours.

**Conditions:**
- ✅ Rendez-vous PENDING depuis > 7 jours
- ✅ Notification à J+3 si pas d'action

**Actions (Cron quotidien):**
1. Lister rendez-vous PENDING > 7 jours
2. Mettre `status = REJECTED`
3. Mettre `adminRejectionReason = "Auto-rejected: No action within 7 days"`
4. Notifier patient

---

### BR-W-006: Révocation d'Approbation
**Règle:** Médecin/Admin peut révoquer son approbation si rendez-vous pas encore CONFIRMED.

**Conditions:**
- ✅ A approuvé précédemment
- ✅ L'autre partie n'a pas encore approuvé (sinon status = CONFIRMED)
- ✅ Date rendez-vous > 48h

**Actions:**
1. Mettre `doctorApproved/adminApproved = false`
2. Annuler `doctorApprovedAt/adminApprovedAt`
3. Raison optionnelle

**Exceptions:**
- ❌ Rendez-vous CONFIRMED → Nécessite annulation complète (BR-A-006)
- ❌ Rendez-vous < 48h → HTTP 400 "Too late to revoke"

---

## 7. Dossier Médical

### BR-DM-001: Création Dossier Médical
**Règle:** Dossier créé automatiquement lors de création du Patient.

**Conditions:**
- ✅ Un dossier par patient
- ✅ Relation OneToOne

**Actions:**
1. Lors de BR-P-001
2. Créer MedicalRecord avec `patientId`
3. Champs par défaut à null/vide

---

### BR-DM-002: Accès Dossier Médical Complet
**Règle:** Médecin de famille et admin uniquement.

**Permissions:**
- ✅ Admin: accès complet à tous les dossiers
- ✅ Doctor: accès complet à ses patients de famille uniquement
- ❌ Doctor: PAS d'accès aux dossiers des patients non-famille
- ✅ Patient: peut voir son propre dossier (lecture seule)

**Données accessibles:**
- MedicalRecord (infos générales)
- MedicalConditions (conditions/maladies)
- Allergies
- Medications
- Vaccinations
- LabResults

**Exceptions:**
- ❌ Doctor accède dossier patient non-famille → HTTP 403
- ❌ Patient tente modifier dossier → HTTP 403 (sauf données personnelles)

---

### BR-DM-003: Modification Dossier Médical
**Règle:** Seul médecin de famille et admin peuvent modifier le dossier médical.

**Permissions Modification:**
- ✅ Admin: tout
- ✅ Doctor (médecin de famille): tout sauf infos générales du patient
- ❌ Patient: lecture seule

**Actions:**
1. Vérifier permissions (IsFamilyDoctorGuard)
2. Valider données
3. Enregistrer modifications
4. [Optionnel] Version history

---

### BR-DM-004: Ajout Condition Médicale
**Règle:** Médecin de famille peut ajouter/modifier conditions.

**Conditions:**
- ✅ Nom obligatoire
- ✅ Status: ACTIVE, RESOLVED, CHRONIC, MANAGED
- ✅ Severity: MILD, MODERATE, SEVERE, CRITICAL
- ✅ Date diagnostic obligatoire
- ✅ Doctor diagnostiquant enregistré

**Actions:**
1. Vérifier permissions (médecin de famille ou admin)
2. Créer MedicalCondition
3. Lier à MedicalRecord
4. [Si CHRONIC] Ajouter alerte

**Validation:**
- ❌ Date diagnostic dans le futur → HTTP 400
- ❌ Status RESOLVED sans resolvedDate → HTTP 400

---

### BR-DM-005: Gestion Allergies
**Règle:** Toute allergie doit être enregistrée et vérifiée avant prescription.

**Conditions:**
- ✅ Type: MEDICATION, FOOD, ENVIRONMENTAL, OTHER
- ✅ Severity: MILD, MODERATE, SEVERE, ANAPHYLACTIC
- ✅ Allergène obligatoire

**Actions:**
1. Enregistrer allergie
2. [Si MEDICATION] Créer alerte système
3. Vérification automatique lors de prescription (BR-DM-007)

**Alertes:**
- ⚠️ SEVERE ou ANAPHYLACTIC → Alerte rouge dans le dossier
- ⚠️ Affichage prominent dans l'interface médecin

---

### BR-DM-006: Ajout Médicament
**Règle:** Médecin de famille peut prescrire et enregistrer médicaments.

**Conditions:**
- ✅ Nom, dosage, fréquence obligatoires
- ✅ Date début obligatoire
- ✅ Médecin prescripteur enregistré
- ✅ Vérification allergies (BR-DM-007)

**Actions:**
1. Vérifier permissions
2. **VÉRIFIER ALLERGIES** (BR-DM-007)
3. Créer Medication avec `status = ACTIVE`
4. Enregistrer prescribedBy

**Status:**
- ACTIVE: En cours
- STOPPED: Arrêté volontairement
- COMPLETED: Traitement terminé

---

### BR-DM-007: Vérification Allergies Médicamenteuses
**Règle:** INTERDIRE prescription si allergie connue.

**Logique:**
```typescript
async function canPrescribe(patientId, medicationName) {
  // Récupérer allergies médicamenteuses
  const allergies = await allergyRepo.find({
    where: {
      medicalRecord: { patientId },
      type: AllergyType.MEDICATION
    }
  });

  // Vérifier si nom médicament contient allergène
  for (const allergy of allergies) {
    if (medicationName.toLowerCase().includes(allergy.allergen.toLowerCase())) {
      throw new Error(
        `⚠️ ALLERGIE DÉTECTÉE: Patient allergique à ${allergy.allergen}. ` +
        `Severity: ${allergy.severity}. Prescription interdite.`
      );
    }
  }

  return true;
}
```

**Actions:**
- ✅ Vérification AVANT sauvegarde médicament
- ✅ Blocage si allergie détectée
- ✅ Message explicatif avec détails allergie

**Exceptions:**
- ❌ Allergie détectée → HTTP 409 avec message d'alerte

---

### BR-DM-008: Enregistrement Vaccination
**Règle:** Médecin ou infirmier peut enregistrer une vaccination.

**Conditions:**
- ✅ Nom vaccin obligatoire
- ✅ Date administration obligatoire
- ✅ Personne administrant enregistrée
- ✅ [Optionnel] Lot number pour traçabilité

**Actions:**
1. Enregistrer vaccination
2. Calculer date rappel si applicable
3. [Si rappel] Créer notification future

---

### BR-DM-009: Suppression Données Médicales
**Règle:** Suppression physique interdite. Archive uniquement.

**Conditions:**
- ✅ Pas de DELETE sur MedicalCondition, Allergy, Medication, Vaccination
- ✅ Modification de status seulement (RESOLVED, STOPPED, etc.)
- ✅ Admin peut forcer archivage (soft delete)

**Actions:**
- Mettre status = ARCHIVED au lieu de supprimer

**Exceptions:**
- ❌ Tentative DELETE → HTTP 403 "Physical deletion not allowed"

---

## 8. Contrôle d'Accès & Sécurité

### BR-S-001: Matrice de Permissions

| Ressource | Action | Patient | Doctor | Admin |
|-----------|--------|---------|--------|-------|
| **User** | Créer | ❌ | ❌ | ✅ |
| | Lire (soi) | ✅ | ✅ | ✅ |
| | Lire (autres) | ❌ | ❌ | ✅ |
| | Modifier (soi) | ✅ (partiel) | ✅ (partiel) | ✅ |
| | Modifier (autres) | ❌ | ❌ | ✅ |
| | Supprimer | ❌ | ❌ | ✅ |
| **Patient** | Créer | ❌ | ❌ | ✅ |
| | Lire (soi) | ✅ | N/A | ✅ |
| | Lire (famille) | ❌ | ✅ | ✅ |
| | Lire (autres) | ❌ | ❌ | ✅ |
| | Modifier (soi) | ✅ (partiel) | N/A | ✅ |
| | Modifier (famille) | ❌ | ✅ (partiel) | ✅ |
| | Supprimer | ❌ | ❌ | ✅ |
| **Doctor** | Créer | ❌ | ❌ | ✅ |
| | Lire (soi) | N/A | ✅ | ✅ |
| | Lire (autres) | ✅ (limité) | ✅ (limité) | ✅ |
| | Modifier (soi) | N/A | ✅ (partiel) | ✅ |
| | Modifier (autres) | ❌ | ❌ | ✅ |
| **Appointment** | Créer | ✅ (soi) | ❌ | ✅ |
| | Lire (soi) | ✅ | ✅ (siens) | ✅ |
| | Approuver | ❌ | ✅ (siens) | ✅ |
| | Annuler (soi) | ✅ (≥24h) | ❌ | ✅ |
| | Annuler (autres) | ❌ | ❌ | ✅ |
| **MedicalRecord** | Lire (soi) | ✅ | N/A | ✅ |
| | Lire (famille) | ❌ | ✅ | ✅ |
| | Modifier (soi) | ❌ | N/A | ✅ |
| | Modifier (famille) | ❌ | ✅ | ✅ |
| **FamilyDoctor** | Assigner | ❌ | ❌ | ✅ |
| | Changer | ❌ | ❌ | ✅ |
| | Retirer | ❌ | ❌ | ✅ |

---

### BR-S-002: Authentification JWT
**Règle:** Toutes les routes (sauf login/register) nécessitent JWT valide.

**Token contient:**
```json
{
  "userId": "uuid",
  "email": "user@email.com",
  "role": "PATIENT|DOCTOR|ADMIN",
  "patientId": "uuid", // si PATIENT
  "doctorId": "uuid",  // si DOCTOR
  "iat": timestamp,
  "exp": timestamp
}
```

**Validations:**
- ✅ Token non expiré
- ✅ Signature valide
- ✅ User encore actif dans DB

---

### BR-S-003: Protection RGPD
**Règle:** Données médicales sensibles protégées.

**Principes:**
- ✅ Accès minimum nécessaire (least privilege)
- ✅ Logs d'accès aux dossiers médicaux
- ✅ Consentement patient pour partage données
- ✅ Droit à l'oubli (anonymisation, pas suppression totale)
- ✅ Chiffrement données sensibles en base (optionnel)

**Actions:**
- Audit trail de qui accède quel dossier quand

---

### BR-S-004: Logs d'Audit
**Règle:** Tracer toutes actions sensibles.

**Actions tracées:**
- ✅ Création/modification/suppression User
- ✅ Assignation/changement médecin de famille
- ✅ Accès dossier médical
- ✅ Modification dossier médical
- ✅ Approbation/rejet rendez-vous
- ✅ Prescription médicaments

**Format log:**
```json
{
  "timestamp": "2026-02-14T10:00:00Z",
  "userId": "uuid",
  "action": "READ_MEDICAL_RECORD",
  "resource": "medical_record",
  "resourceId": "uuid",
  "details": { "patientId": "uuid" },
  "ipAddress": "192.168.1.1"
}
```

---

## 9. Validation des Données

### BR-V-001: Email
- Format: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Unique dans le système
- Longueur max: 255 caractères

### BR-V-002: Mot de Passe
- Minimum: 8 caractères
- Recommandé: 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
- Hashé avec bcrypt (10 rounds minimum)

### BR-V-003: Téléphone
- Format: `+XXX XXX XXX XXX` ou équivalent
- Longueur: 10-20 caractères
- Regex: `/^\+?[0-9\s\-()]+$/`

### BR-V-004: Date de Naissance
- Format: ISO 8601 (YYYY-MM-DD)
- Âge minimum: 0 ans (nouveau-né)
- Âge maximum: 150 ans
- Pas dans le futur

### BR-V-005: Groupe Sanguin
- Valeurs: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`
- Enum strict

### BR-V-006: Poids/Taille
- Poids: 0.5 - 500 kg
- Taille: 20 - 250 cm
- Valeurs décimales autorisées

### BR-V-007: Dates Rendez-vous
- Format: ISO 8601 timestamp
- Minimum: now() + 2 heures (sauf admin)
- Maximum: now() + 3 mois
- Pendant horaires médecin

### BR-V-008: Durée Consultation
- Minimum: 15 minutes
- Maximum: 240 minutes (4h)
- Multiples de 15 minutes
- Valeurs: 15, 30, 45, 60, 75, 90, 105, 120, ..., 240

---

## 10. Règles de Notification

### BR-N-001: Notification Rendez-vous Approuvé
**Destinataire:** Patient

**Déclencheur:** Rendez-vous passe en CONFIRMED

**Contenu:**
```
Votre rendez-vous a été confirmé:
- Médecin: Dr. [Nom]
- Date: [Date] à [Heure]
- Durée: [XX] minutes
- Lieu: [Adresse clinique]
```

---

### BR-N-002: Notification Rendez-vous Rejeté
**Destinataire:** Patient

**Déclencheur:** Rendez-vous passe en REJECTED

**Contenu:**
```
Votre demande de rendez-vous a été refusée.
Raison: [Raison médecin/admin]
Veuillez contacter la clinique ou choisir un autre créneau.
```

---

### BR-N-003: Notification Nouvelle Demande
**Destinataire:** Médecin + Admin

**Déclencheur:** Nouveau rendez-vous créé (PENDING)

**Contenu:**
```
Nouvelle demande de rendez-vous:
- Patient: [Nom Patient]
- Date: [Date] à [Heure]
- Raison: [Raison]
- Action requise: Approuver ou rejeter
```

---

### BR-N-004: Notification Rappel Rendez-vous
**Destinataire:** Patient

**Déclencheur:** J-1 du rendez-vous

**Contenu:**
```
Rappel: Rendez-vous demain
- Médecin: Dr. [Nom]
- Heure: [Heure]
- Lieu: [Adresse]
Merci de prévenir en cas d'empêchement.
```

---

### BR-N-005: Notification Changement Médecin de Famille
**Destinataire:** Patient

**Déclencheur:** Modification `familyDoctorId`

**Contenu:**
```
Votre médecin de famille a changé:
- Nouveau médecin: Dr. [Nom]
- Spécialité: [Spécialité]
- Contact: [Téléphone]
```

---

## 11. Règles d'Audit

### BR-AU-001: Traçabilité Complète
**Règle:** Toute modification importante doit être tracée.

**Tables avec audit:**
- User (créer, modifier, désactiver)
- Patient (créer, modifier)
- Doctor (créer, modifier, désactiver)
- FamilyDoctorHistory (toute modification médecin de famille)
- Appointment (créer, approuver, rejeter, annuler)
- MedicalRecord et sous-entités (créer, modifier)

**Champs audit:**
```typescript
{
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: userId,
  updatedBy: userId
}
```

---

### BR-AU-002: Logs d'Accès Dossier Médical
**Règle:** Chaque consultation de dossier médical doit être loggée.

**Informations:**
- Qui (userId, role)
- Quoi (patientId, dossier consulté)
- Quand (timestamp)
- Où (IP address)
- Pourquoi (contexte: rendez-vous, consultation directe, etc.)

**Retention:** 2 ans minimum

---

### BR-AU-003: Historique Modifications
**Règle:** Conserver historique des modifications sur données sensibles.

**Approches:**
1. Table `*_history` (ex: `medical_conditions_history`)
2. Champ JSONB `change_log`
3. Event Sourcing (avancé)

**Données tracées:**
- Ancienne valeur
- Nouvelle valeur
- Qui a modifié
- Quand
- Raison (si fournie)

---

## 🎯 Résumé des Règles Critiques

### Top 10 Règles Non-Négociables

1. **BR-U-001** - Seul admin crée des comptes
2. **BR-P-001** - Seul admin inscrit des patients
3. **BR-MF-001** - Seul admin assigne médecin de famille
4. **BR-A-002** - Priorité au médecin de famille pour rendez-vous
5. **BR-W-001** - Double approbation obligatoire (médecin + admin)
6. **BR-DM-002** - Accès dossier médical limité (médecin de famille + admin)
7. **BR-DM-007** - Vérification allergies AVANT prescription
8. **BR-S-002** - JWT obligatoire sur toutes routes protégées
9. **BR-AU-002** - Logs d'accès aux dossiers médicaux
10. **BR-V-008** - Validation durée rendez-vous (15-240 min, multiples de 15)

---

## 📋 Checklist Implémentation

Pour chaque fonctionnalité, vérifier:

- [ ] Règles métier respectées
- [ ] Validations en place
- [ ] Permissions vérifiées (Guards)
- [ ] Exceptions gérées avec messages clairs
- [ ] Audit/logs enregistrés
- [ ] Tests unitaires couvrant les règles
- [ ] Documentation API mise à jour
- [ ] Notifications envoyées si applicable

---

**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ✅ Complet et prêt pour implémentation
**Prochaine révision:** Après Phase 1 du développement
