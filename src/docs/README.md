# API Documentation Structure

This directory contains all the Swagger/OpenAPI documentation for the Smart Edu Hub API, organized by feature and role.

## Directory Structure

```
src/docs/
├── auth/                    # Authentication documentation
│   ├── auth.docs.ts        # Login, registration, OTP, password reset
│   └── index.ts
├── director/               # Director management documentation
│   ├── teachers/          # Teacher management
│   │   ├── teachers.docs.ts
│   │   └── index.ts
│   ├── students/          # Student management
│   │   ├── students.docs.ts
│   │   └── index.ts
│   ├── classes/           # Class management
│   │   ├── classes.docs.ts
│   │   └── index.ts
│   ├── subjects/          # Subject management
│   │   ├── subjects.docs.ts
│   │   └── index.ts
│   ├── schedules/         # Schedule and timetable management
│   │   ├── schedules.docs.ts
│   │   └── index.ts
│   ├── finance/           # Financial operations
│   │   ├── finance.docs.ts
│   │   └── index.ts
│   ├── dashboard/         # Dashboard and analytics
│   │   ├── dashboard.docs.ts
│   │   └── index.ts
│   └── index.ts           # Exports all director modules
├── bulk-onboard/          # Bulk user onboarding
│   ├── bulk-onboard.docs.ts
│   └── index.ts
├── admin/                 # Admin management (future)
├── index.ts              # Main exports
└── README.md             # This file
```

## Organization Principles

- **Role-based**: Documentation is organized by user roles (auth, director, admin)
- **Feature-based**: Within each role, documentation is split by features (teachers, students, etc.)
- **Hierarchical**: Clear parent-child relationships (director → teachers, students, etc.)
- **Modular**: Each folder has its own index.ts for clean imports

## Adding New Documentation

1. Create a new folder in the appropriate location
2. Add your documentation file (e.g., `new-feature.docs.ts`)
3. Create an `index.ts` file to export the documentation
4. Update the parent `index.ts` to include the new module
5. Update this README if needed

## Usage

All documentation is automatically exported through the main `index.ts` file and can be imported in your controllers and services. 