## Initial Setup Flow (Empty Database)

When the database is empty, onboarding can start with **either**:
- **Library platform**
- **School**

### Library Platform Onboarding

- **Endpoint**
  - **POST** `{{smart-edu-local}}/developer/librarydev/onboardnewlibrary`

- **Sample Payload**

```json
{
  "name": "Best Technologies LTD",
  "slug": "Best-Technologies-global-library",
  "description": "Official Best Technologies public content library for West Africa.",
  "email": "esttechnologies25@gmail.com",
  "password": "Maximus123"
}
```

### Library Platform Admin Onboarding

- **Endpoint**
  - **POST** `{{smart-edu-local}}/developer/librarydev/add-library-owner`

- **Sample Payload**

```json
{
  "libraryId": "cmke5r5hw0000vlapyiitwi57",
  "email": "demruthesther99@gmail.com",
  "password": "Maximus123",
  "firstName": "Esther",
  "lastName": "Bangboje",
  "phoneNumber": "+2349024031799"
}
```

### School Onboarding

- **Endpoint**
  - **POST** `{{smart-edu-local}}/auth/onboard-school`
- **Body**
  - `form-data` with:
    - `school_name`, `school_email`, `school_address`, `school_phone`
    - `school_type`, `school_ownership`
    - `cac_or_approval_letter` (file)
    - `utility_bill` (file)
    - `tax_cert` (file)
    - `academic_year`, `current_term`, `term_start_date`

More flows will be added here as they are defined.
