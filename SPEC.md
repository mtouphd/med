# Medical Appointment Management Application

## Project Overview

- **Project Name**: MedApp
- **Type**: Full-stack Web Application (Medical Appointment Management)
- **Core Functionality**: A platform for managing medical appointments with three distinct user roles
- **Target Users**: Patients, Doctors, and Clinic Administrators

## Tech Stack

- **Backend**: NestJS with TypeORM, PostgreSQL, JWT Authentication
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Database**: PostgreSQL on Docker
- **Container**: Docker Compose

## User Profiles

### 1. Patient
- Register/Login
- View available doctors and their specialties
- Book appointments with doctors
- View own appointments (upcoming/past)
- Cancel appointments
- View medical records (future enhancement)

### 2. Doctor
- Register/Login (by admin)
- Manage availability schedule
- View assigned appointments
- Accept/decline appointment requests
- Add notes to appointments
- View patient information

### 3. Admin Clinique
- Full system access
- Manage doctors (CRUD)
- Manage patients (view/remove)
- View all appointments
- Dashboard with statistics
- Manage clinic settings

## Data Model

### Entities

```
User (base)
├── id: UUID
├── email: string (unique)
├── password: string (hashed)
├── firstName: string
├── lastName: string
├── phone: string
├── role: enum (PATIENT, DOCTOR, ADMIN)
├── createdAt: timestamp
├── updatedAt: timestamp

Patient (extends User)
├── dateOfBirth: date
├── address: string
├── emergencyContact: string
├── medicalHistory: text (optional)

Doctor (extends User)
├── specialty: string
├── licenseNumber: string
├── bio: text
├── consultationDuration: integer (minutes, default 30)
├── isAvailable: boolean
├── schedule: json (weekly schedule)

Appointment
├── id: UUID
├── patientId: UUID (FK)
├── doctorId: UUID (FK)
├── dateTime: timestamp
├── duration: integer (minutes)
├── status: enum (PENDING, CONFIRMED, COMPLETED, CANCELLED)
├── reason: string
├── notes: text (doctor notes)
├── createdAt: timestamp
├── updatedAt: timestamp

Availability
├── id: UUID
├── doctorId: UUID (FK)
├── dayOfWeek: integer (0-6)
├── startTime: time
├── endTime: time
├── isActive: boolean
```

## API Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- GET /auth/profile

### Patients
- GET /patients
- GET /patients/:id
- PUT /patients/:id
- DELETE /patients/:id

### Doctors
- GET /doctors
- GET /doctors/:id
- POST /doctors
- PUT /doctors/:id
- DELETE /doctors/:id
- GET /doctors/:id/availability
- POST /doctors/:id/availability
- PUT /doctors/:id/schedule

### Appointments
- GET /appointments
- GET /appointments/:id
- POST /appointments
- PUT /appointments/:id
- DELETE /appointments/:id
- GET /appointments/patient/:patientId
- GET /appointments/doctor/:doctorId

### Admin
- GET /admin/dashboard
- GET /admin/stats

## Project Structure

```
med/
├── backend/           # NestJS application
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── doctors/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── common/
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml
└── README.md
```

## UI/UX Design

### Color Palette
- Primary: #0ea5e9 (sky-500)
- Secondary: #64748b (slate-500)
- Accent: #10b981 (emerald-500)
- Background: #f8fafc (slate-50)
- Error: #ef4444 (red-500)
- Success: #22c55e (green-500)

### Layout
- Responsive design (mobile-first)
- Sidebar navigation for authenticated users
- Clean, medical-themed UI
- Form validation with error messages

### Pages

1. **Landing Page**: Public homepage with login/register
2. **Dashboard**: Role-based dashboard
3. **Appointments**: List, create, manage appointments
4. **Doctors**: Browse/search doctors
5. **Profile**: User profile management
6. **Admin Panel**: Full admin controls

## Acceptance Criteria

1. ✅ Users can register and login with JWT
2. ✅ Patients can book appointments with available doctors
3. ✅ Doctors can manage their schedule and appointments
4. ✅ Admins can manage all entities
5. ✅ Docker Compose runs PostgreSQL
6. ✅ Backend and frontend are properly separated
7. ✅ TypeORM entities are correctly defined
8. ✅ REST API follows NestJS best practices
