-- ============================================
-- Script pour VIDER toutes les tables
-- ⚠️ ATTENTION: Ce script supprime TOUTES les données!
-- ============================================

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = 'replica';

-- Vider les tables dans l'ordre (du plus dépendant au moins dépendant)
TRUNCATE TABLE family_doctor_history CASCADE;
TRUNCATE TABLE vaccinations CASCADE;
TRUNCATE TABLE medications CASCADE;
TRUNCATE TABLE allergies CASCADE;
TRUNCATE TABLE medical_conditions CASCADE;
TRUNCATE TABLE medical_records CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE doctors CASCADE;
TRUNCATE TABLE users CASCADE;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = 'origin';

-- Afficher un message de confirmation
SELECT 'Base de données vidée avec succès! Toutes les données ont été supprimées.' AS status;
