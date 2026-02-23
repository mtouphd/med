-- Clean all transactional data (appointments & medical records)
-- Run: psql -U your_user -d your_db -f scripts/clean_transactions-data.sql

-- Appointments
DELETE FROM appointments;

-- Medical records (children first, then parent)
DELETE FROM vaccinations;
DELETE FROM medications;
DELETE FROM medical_conditions;
DELETE FROM allergies;
DELETE FROM medical_records;
