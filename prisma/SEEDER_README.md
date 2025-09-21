# Database Seeder

This seeder script populates the database with comprehensive mock data for Best Academy, a Nigerian secondary school.

## 🔐 Sample Login Credentials

**Password for all users:** `password123`

### School Director
- **Email:** `moses.wale1@bestacademy.edu.ng`
- **Role:** School Director
- **Name:** Adebayo Afolabi

### Teacher
- **Email:** `ogechi.iwu2@bestacademy.edu.ng`
- **Role:** Teacher
- **Name:** Chinwe Nwosu
- **Teacher ID:** TCH001

### Student
- **Email:** `aisha.ahmad1@bestacademy.edu.ng`
- **Role:** Student
- **Name:** Aisha Ahmad
- **Student ID:** STU0001
- **Admission Number:** BA20250001

## What it creates:

### 🏫 School
- **Best Academy** - A private primary and secondary school in Lagos, Nigeria

### 📅 Academic Sessions
- **Previous Session**: 2023/2024 (completed)
- **Current Session**: 2024/2025 (active)

### 👥 Users (104 total)
- **2 School Directors** - School administrators
- **12 Teachers** - Subject teachers with qualifications and specializations
- **90 Students** - Distributed across 12 classes

### 🏫 Classes (12 total)
- **JSS1A, JSS1B** - Junior Secondary School Year 1
- **JSS2A, JSS2B** - Junior Secondary School Year 2  
- **JSS3A, JSS3B** - Junior Secondary School Year 3
- **SS1A, SS1B** - Senior Secondary School Year 1
- **SS2A, SS2B** - Senior Secondary School Year 2
- **SS3A, SS3B** - Senior Secondary School Year 3

### 📚 Subjects (24 total)
**JSS Subjects:**
- Mathematics, English Language, Basic Science, Basic Technology
- Social Studies, Civic Education, Agricultural Science, Business Studies
- Computer Studies, Creative Arts, Home Economics, Physical Education

**SS Subjects:**
- Physics, Chemistry, Biology, Further Mathematics
- Literature in English, Government, Economics, Geography
- History, Christian Religious Studies, Islamic Religious Studies, French

### 👨‍🏫 Teacher-Subject Relationships
- Each teacher is assigned 2-4 subjects
- Proper distribution across all subjects

### ⏰ Timetable
- **10 Time Slots** per day (8:00 AM - 2:20 PM)
- **5 Days** per week (Monday-Friday)
- Complete timetable for all classes and subjects

### 📖 Topics
- **2-4 topics per subject** with relevant content
- Covers both JSS and SS curriculum requirements

### 💰 Finance & Wallet
- School finance records
- Wallet with initial balance

### 🔔 Notifications
- Welcome messages
- Parent-teacher meeting announcements

## Nigerian Names Used

The seeder uses authentic Nigerian names from three major ethnic groups:
- **Yoruba** names (Southwest Nigeria)
- **Igbo** names (Southeast Nigeria)  
- **Hausa** names (Northern Nigeria)

## How to Run

### Prerequisites
1. Ensure your database is empty (seeder checks for existing data)
2. Run database migrations first: `npm run prisma:migrate`
3. Generate Prisma client: `npm run prisma:generate`

### Run the Seeder
```bash
npm run prisma:seed
```

### Alternative Method
```bash
npx prisma db seed
```

## Data Structure

All data is properly related:
- Users belong to the school
- Students and teachers are linked to academic sessions
- Students are assigned to classes
- Teachers teach specific subjects
- Timetable entries connect classes, subjects, teachers, and time slots
- Topics are linked to subjects and created by teachers

## Default Credentials

All users have the same default password: `password123`

## Notes

- The seeder will skip execution if data already exists
- All dates are set to realistic academic calendar dates
- Phone numbers follow Nigerian mobile number formats
- Email addresses use the school domain: `@bestacademy.edu.ng`
- Student and teacher IDs follow systematic numbering patterns

## Schema Changes

This seeder also includes the updated schema changes:
- `CBTQuiz` model renamed to `Assessment`
- New `AssessmentSubmission` model added
- All relationships properly updated
