import { PrismaClient, SubscriptionPlanType, BillingCycle, SubscriptionStatus } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

// Nigerian names data
const nigerianNames = {
  yoruba: {
    firstNames: [
      'Adebayo', 'Adunni', 'Afolabi', 'Aisha', 'Akin', 'Babatunde', 'Bukola', 'Chinwe', 'Damilola', 'Emeka',
      'Folake', 'Gbemi', 'Hadiza', 'Ibrahim', 'Jumoke', 'Kemi', 'Ladi', 'Mariam', 'Ngozi', 'Oluwaseun',
      'Priscilla', 'Quadri', 'Rasheedat', 'Sade', 'Temitope', 'Uche', 'Victoria', 'Wale', 'Yemi', 'Zainab',
      'Adeola', 'Bisi', 'Chidi', 'Dada', 'Efe', 'Funmi', 'Grace', 'Hassan', 'Ijeoma', 'Jide',
      'Kemi', 'Lola', 'Moses', 'Nneka', 'Opeyemi', 'Patience', 'Queen', 'Ruth', 'Seyi', 'Tope'
    ],
    lastNames: [
      'Adebayo', 'Adunni', 'Afolabi', 'Akinwale', 'Babatunde', 'Bukola', 'Chinwe', 'Damilola', 'Emeka', 'Folake',
      'Gbemi', 'Hadiza', 'Ibrahim', 'Jumoke', 'Kemi', 'Ladi', 'Mariam', 'Ngozi', 'Oluwaseun', 'Priscilla',
      'Quadri', 'Rasheedat', 'Sade', 'Temitope', 'Uche', 'Victoria', 'Wale', 'Yemi', 'Zainab', 'Adeola'
    ]
  },
  igbo: {
    firstNames: [
      'Adaora', 'Chidi', 'Chinwe', 'Chukwuemeka', 'Emeka', 'Ifeoma', 'Ijeoma', 'Kelechi', 'Ngozi', 'Obioma',
      'Onyinye', 'Priscilla', 'Uche', 'Ugochi', 'Ada', 'Chiamaka', 'Chinonso', 'Chisom', 'Ebuka', 'Ezinne',
      'Ifunanya', 'Ikenna', 'Kamsi', 'Nkem', 'Obinna', 'Ogechi', 'Onyeka', 'Precious', 'Ujunwa', 'Vivian',
      'Adaobi', 'Chiamaka', 'Chinelo', 'Chisom', 'Ebuka', 'Ezinne', 'Ifunanya', 'Ikenna', 'Kamsi', 'Nkem'
    ],
    lastNames: [
      'Nwosu', 'Okafor', 'Okonkwo', 'Eze', 'Nwankwo', 'Obi', 'Iwu', 'Nwosu', 'Okeke', 'Eze',
      'Nwankwo', 'Okafor', 'Okonkwo', 'Eze', 'Nwosu', 'Obi', 'Iwu', 'Nwankwo', 'Okeke', 'Eze',
      'Nwosu', 'Okafor', 'Okonkwo', 'Eze', 'Nwankwo', 'Obi', 'Iwu', 'Nwankwo', 'Okeke', 'Eze'
    ]
  },
  hausa: {
    firstNames: [
      'Aisha', 'Aminu', 'Fatima', 'Hassan', 'Ibrahim', 'Khadija', 'Mariam', 'Mohammed', 'Nafisa', 'Omar',
      'Rahma', 'Sani', 'Umar', 'Yusuf', 'Zainab', 'Abdullahi', 'Amina', 'Bashir', 'Halima', 'Idris',
      'Jamila', 'Kabir', 'Lami', 'Musa', 'Nana', 'Omar', 'Rashida', 'Sadiq', 'Tijjani', 'Ummi',
      'Ahmad', 'Binta', 'Dauda', 'Fati', 'Garba', 'Hauwa', 'Ibrahim', 'Jamilu', 'Khadija', 'Lami'
    ],
    lastNames: [
      'Abubakar', 'Ahmad', 'Ali', 'Bello', 'Dauda', 'Garba', 'Hassan', 'Ibrahim', 'Jibril', 'Khalil',
      'Lawan', 'Mohammed', 'Nuhu', 'Omar', 'Rabi', 'Sani', 'Tijjani', 'Umar', 'Yusuf', 'Zakari',
      'Abubakar', 'Ahmad', 'Ali', 'Bello', 'Dauda', 'Garba', 'Hassan', 'Ibrahim', 'Jibril', 'Khalil'
    ]
  }
};

// Helper functions
function getRandomName(ethnicity: 'yoruba' | 'igbo' | 'hausa') {
  const names = nigerianNames[ethnicity];
  const firstName = names.firstNames[Math.floor(Math.random() * names.firstNames.length)];
  const lastName = names.lastNames[Math.floor(Math.random() * names.lastNames.length)];
  return { firstName, lastName };
}

function generateEmail(firstName: string, lastName: string, role: string, index: number) {
  const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${role}${index}`;
  // Add role and index to ensure uniqueness
  return `${baseEmail}@edu.ng`;
}

function generatePhoneNumber() {
  const prefixes = ['080', '081', '090', '091', '070', '071'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + number;
}

function generateStudentId(index: number) {
  return `STU${String(index).padStart(4, '0')}`;
}

function generateTeacherId(index: number) {
  return `TCH${String(index).padStart(3, '0')}`;
}

function generateParentId(index: number) {
  return `PAR${String(index).padStart(3, '0')}`;
}

function generateAdmissionNumber(year: number, index: number) {
  return `BA${year}${String(index).padStart(4, '0')}`;
}

// Extract class level from class name (e.g., "JSS2A" -> "JSS2", "SS1B" -> "SS1")
function getClassLevel(className: string): string {
  if (className.startsWith('JSS')) {
    return className.substring(0, 4); // JSS1, JSS2, JSS3
  } else if (className.startsWith('SS')) {
    return className.substring(0, 3); // SS1, SS2, SS3
  }
  return className;
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Ensure pgvector extension exists (required for `vector` column type)
  // This is safe to run multiple times and will no-op if already installed.
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log('✅ Ensured pgvector extension (vector) is available');
  } catch (err) {
    console.warn('⚠️ Could not create pgvector extension automatically. If seeding fails with "type \\"vector\\" does not exist", run:');
    console.warn('   CREATE EXTENSION IF NOT EXISTS vector;  -- in your Postgres database as a superuser');
  }

  // Check if data already exists
  const existingSchool = await prisma.school.findFirst();
  if (existingSchool) {
    console.log('❌ Database already has data. Skipping seeding.');
    return;
  }

  try {
    // 1. Create Subscription Plan Templates (4 default plans)
    console.log('💳 Creating subscription plan templates...');
    const planTemplates = [
      {
        name: 'Free',
        plan_type: SubscriptionPlanType.FREE,
        description: 'Free plan with basic features and limited AI interactions',
        cost: 0,
        currency: 'USD',
        billing_cycle: BillingCycle.MONTHLY,
        is_active: true,
        is_template: true,
        max_allowed_teachers: 30,
        max_allowed_students: 100,
        max_allowed_classes: null,
        max_allowed_subjects: null,
        allowed_document_types: ['pdf'],
        max_file_size_mb: 10,
        max_document_uploads_per_student_per_day: 3,
        max_document_uploads_per_teacher_per_day: 10,
        max_storage_mb: 500,
        max_files_per_month: 10,
        max_daily_tokens_per_user: 50000,
        max_weekly_tokens_per_user: null,
        max_monthly_tokens_per_user: null,
        max_total_tokens_per_school: null,
        max_messages_per_week: 100,
        max_conversations_per_user: null,
        max_chat_sessions_per_user: null,
        features: {
          ai_chat: true,
          basic_analytics: true,
          limited_support: true,
        },
        status: SubscriptionStatus.ACTIVE,
        auto_renew: false
      },
      {
        name: 'Basic',
        plan_type: SubscriptionPlanType.BASIC,
        description: 'Basic plan with enhanced features and moderate limits',
        cost: 29.99,
        currency: 'USD',
        billing_cycle: BillingCycle.MONTHLY,
        is_active: true,
        is_template: true,
        max_allowed_teachers: 50,
        max_allowed_students: 250,
        max_allowed_classes: 20,
        max_allowed_subjects: 20,
        allowed_document_types: ['pdf', 'doc', 'docx'],
        max_file_size_mb: 25,
        max_document_uploads_per_student_per_day: 5,
        max_document_uploads_per_teacher_per_day: 25,
        max_storage_mb: 2000,
        max_files_per_month: 50,
        max_daily_tokens_per_user: 100000,
        max_weekly_tokens_per_user: 500000,
        max_monthly_tokens_per_user: 2000000,
        max_total_tokens_per_school: null,
        max_messages_per_week: 500,
        max_conversations_per_user: 25,
        max_chat_sessions_per_user: 10,
        features: {
          ai_chat: true,
          basic_analytics: true,
          standard_support: true,
          ai_grading: false,
          advanced_analytics: false,
        },
        status: SubscriptionStatus.ACTIVE,
        auto_renew: false
      },
      {
        name: 'Premium',
        plan_type: SubscriptionPlanType.PREMIUM,
        description: 'Premium plan with advanced AI features and higher limits',
        cost: 99.99,
        currency: 'USD',
        billing_cycle: BillingCycle.MONTHLY,
        is_active: true,
        is_template: true,
        max_allowed_teachers: 100,
        max_allowed_students: 500,
        max_allowed_classes: 50,
        max_allowed_subjects: 50,
        allowed_document_types: ['pdf', 'doc', 'docx', 'txt', 'csv'],
        max_file_size_mb: 50,
        max_document_uploads_per_student_per_day: 10,
        max_document_uploads_per_teacher_per_day: 50,
        max_storage_mb: 5000,
        max_files_per_month: 100,
        max_daily_tokens_per_user: 200000,
        max_weekly_tokens_per_user: 1000000,
        max_monthly_tokens_per_user: 5000000,
        max_total_tokens_per_school: null,
        max_messages_per_week: 1000,
        max_conversations_per_user: 50,
        max_chat_sessions_per_user: 20,
        features: {
          ai_chat: true,
          advanced_analytics: true,
          priority_support: true,
          ai_grading: true,
          custom_branding: true,
          api_access: true,
          bulk_operations: true,
          export_reports: true,
        },
        status: SubscriptionStatus.ACTIVE,
        auto_renew: false
      },
      {
        name: 'Enterprise',
        plan_type: SubscriptionPlanType.ENTERPRISE,
        description: 'Enterprise plan with unlimited features and custom solutions',
        cost: 299.99,
        currency: 'USD',
        billing_cycle: BillingCycle.MONTHLY,
        is_active: true,
        is_template: true,
        max_allowed_teachers: 999999, // Unlimited (using large number)
        max_allowed_students: 999999, // Unlimited (using large number)
        max_allowed_classes: null, // Unlimited
        max_allowed_subjects: null, // Unlimited
        allowed_document_types: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'pptx'],
        max_file_size_mb: 100,
        max_document_uploads_per_student_per_day: 999999, // Unlimited (using large number)
        max_document_uploads_per_teacher_per_day: 999999, // Unlimited (using large number)
        max_storage_mb: 999999, // Unlimited (using large number)
        max_files_per_month: 999999, // Unlimited (using large number)
        max_daily_tokens_per_user: 500000,
        max_weekly_tokens_per_user: 2500000,
        max_monthly_tokens_per_user: 10000000,
        max_total_tokens_per_school: null, // Unlimited
        max_messages_per_week: 999999, // Unlimited (using large number)
        max_conversations_per_user: null, // Unlimited
        max_chat_sessions_per_user: null, // Unlimited
        features: {
          ai_chat: true,
          advanced_analytics: true,
          priority_support: true,
          ai_grading: true,
          custom_branding: true,
          api_access: true,
          bulk_operations: true,
          export_reports: true,
          custom_integrations: true,
          dedicated_account_manager: true,
          white_label: true,
          sso: true,
        },
        status: SubscriptionStatus.ACTIVE,
        auto_renew: false
      }
    ];

    const createdTemplates = await Promise.all(
      planTemplates.map(async (template) => {
        const existing = await prisma.platformSubscriptionPlan.findFirst({
          where: {
            plan_type: template.plan_type,
            school_id: null,
            is_template: true
          } as any
        });

        if (existing) {
          return prisma.platformSubscriptionPlan.update({
            where: { id: existing.id },
            data: {
              ...template,
              school_id: null
            } as any
          });
        } else {
          return prisma.platformSubscriptionPlan.create({
            data: {
              ...template,
              school_id: undefined
            } as any
          });
        }
      })
    );
    console.log(`✅ ${createdTemplates.length} subscription plan templates created`);

    // 2. Create School
    console.log('📚 Creating school...');
    
    // Get Free plan template to assign to school
    const freePlanTemplate = createdTemplates.find(p => p.plan_type === SubscriptionPlanType.FREE);
    
    // Create Free plan for the school
    const schoolFreePlan = await prisma.platformSubscriptionPlan.create({
      data: {
        school_id: undefined, // Will be updated after school creation
        name: 'Free',
        plan_type: SubscriptionPlanType.FREE,
        description: freePlanTemplate?.description || 'Free plan with basic features',
        cost: 0,
        currency: 'USD',
        billing_cycle: BillingCycle.MONTHLY,
        is_active: true,
        is_template: false,
        max_allowed_teachers: 30,
        max_allowed_students: 100,
        max_allowed_classes: null,
        max_allowed_subjects: null,
        allowed_document_types: ['pdf'],
        max_file_size_mb: 10,
        max_document_uploads_per_student_per_day: 3,
        max_document_uploads_per_teacher_per_day: 10,
        max_storage_mb: 500,
        max_files_per_month: 10,
        max_daily_tokens_per_user: 50000,
        max_weekly_tokens_per_user: null,
        max_monthly_tokens_per_user: null,
        max_total_tokens_per_school: null,
        max_messages_per_week: 100,
        max_conversations_per_user: null,
        max_chat_sessions_per_user: null,
        features: {
          ai_chat: true,
          basic_analytics: true,
          limited_support: true,
        },
        start_date: new Date(),
        end_date: null,
        status: SubscriptionStatus.ACTIVE,
        auto_renew: false
      } as any
    });

    const school = await prisma.school.create({
      data: {
        school_name: 'Best Academy',
        school_email: 'info@bestacademy.edu.ng',
        school_phone: '+234-1-234-5678',
        school_address: '123 Education Street, Lagos, Nigeria',
        school_type: 'primary_and_secondary',
        school_ownership: 'private',
        status: 'approved',
        platformId: null,
        cacId: null,
        utilityBillId: null,
        taxClearanceId: null,
      },
    });

    // Update school plan with school_id
    await prisma.platformSubscriptionPlan.update({
      where: { id: schoolFreePlan.id },
      data: { school_id: school.id }
    });

    console.log(`✅ School created: ${school.school_name} with Free subscription plan`);

    // 3. Create Academic Sessions
    console.log('📅 Creating academic sessions...');
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const academicSessions = await Promise.all([
      prisma.academicSession.create({
        data: {
          school_id: school.id,
          academic_year: `${previousYear}/${currentYear}`,
          start_year: previousYear,
          end_year: currentYear,
          term: 'third',
          start_date: new Date(previousYear, 8, 1), // September 1st
          end_date: new Date(currentYear, 7, 31), // August 31st
          status: 'completed',
          is_current: false,
        },
      }),
      prisma.academicSession.create({
        data: {
          school_id: school.id,
          academic_year: `${currentYear}/${currentYear + 1}`,
          start_year: currentYear,
          end_year: currentYear + 1,
          term: 'first',
          start_date: new Date(currentYear, 8, 1), // September 1st
          end_date: new Date(currentYear + 1, 7, 31), // August 31st
          status: 'active',
          is_current: true,
        },
      }),
    ]);

    const currentSession = academicSessions[1];
    console.log(`✅ Academic sessions created. Current: ${currentSession.academic_year}`);

    // 4. Create Classes (JSS1 to SS3)
    console.log('🏫 Creating classes...');
    const classNames = [
      'JSS1A', 'JSS1B', 'JSS2A', 'JSS2B', 'JSS3A', 'JSS3B',
      'SS1A', 'SS1B', 'SS2A', 'SS2B', 'SS3A', 'SS3B'
    ];

    const classes = await Promise.all(
      classNames.map((name, index) =>
        prisma.class.create({
          data: {
            name,
            schoolId: school.id,
            academic_session_id: currentSession.id,
            classId: index + 1,
          },
        })
      )
    );
    console.log(`✅ ${classes.length} classes created`);

    // 5. Create Subjects (FIXED: One subject per class level, not per individual class)
    console.log('📖 Creating subjects...');
    const subjectsData = [
      // JSS Subjects
      { name: 'Mathematics', code: 'MATH', color: '#FF6B6B' },
      { name: 'English Language', code: 'ENG', color: '#4ECDC4' },
      { name: 'Basic Science', code: 'BSC', color: '#45B7D1' },
      { name: 'Basic Technology', code: 'BTE', color: '#96CEB4' },
      { name: 'Social Studies', code: 'SST', color: '#FFEAA7' },
      { name: 'Civic Education', code: 'CIV', color: '#DDA0DD' },
      { name: 'Agricultural Science', code: 'AGR', color: '#98D8C8' },
      { name: 'Business Studies', code: 'BUS', color: '#F7DC6F' },
      { name: 'Computer Studies', code: 'COM', color: '#BB8FCE' },
      { name: 'Creative Arts', code: 'ART', color: '#85C1E9' },
      { name: 'Home Economics', code: 'HEC', color: '#F8C471' },
      { name: 'Physical Education', code: 'PHE', color: '#82E0AA' },
      
      // SS Subjects
      { name: 'Physics', code: 'PHY', color: '#E74C3C' },
      { name: 'Chemistry', code: 'CHE', color: '#3498DB' },
      { name: 'Biology', code: 'BIO', color: '#2ECC71' },
      { name: 'Further Mathematics', code: 'FMAT', color: '#F39C12' },
      { name: 'Literature in English', code: 'LIT', color: '#9B59B6' },
      { name: 'Government', code: 'GOV', color: '#1ABC9C' },
      { name: 'Economics', code: 'ECO', color: '#34495E' },
      { name: 'Geography', code: 'GEO', color: '#16A085' },
      { name: 'History', code: 'HIS', color: '#8E44AD' },
      { name: 'Christian Religious Studies', code: 'CRS', color: '#27AE60' },
      { name: 'Islamic Religious Studies', code: 'IRS', color: '#2980B9' },
      { name: 'French', code: 'FRE', color: '#E67E22' },
    ];

    // Group classes by level
    const classesByLevel: Record<string, any[]> = {};
    classes.forEach(classItem => {
      const level = getClassLevel(classItem.name);
      if (!classesByLevel[level]) {
        classesByLevel[level] = [];
      }
      classesByLevel[level].push(classItem);
    });

    const subjects: any[] = [];
    
    // Create JSS subjects (for JSS1, JSS2, JSS3 levels)
    const jssSubjects = subjectsData.slice(0, 12);
    const jssLevels = ['JSS1', 'JSS2', 'JSS3'];
    
    for (const level of jssLevels) {
      if (classesByLevel[level]) {
        for (const subjectData of jssSubjects) {
          // Create ONE subject per level (not per class)
          const subject = await prisma.subject.create({
            data: {
              name: subjectData.name,
              code: `${subjectData.code}-${level}`, // e.g., MATH-JSS1
              color: subjectData.color,
              schoolId: school.id,
              academic_session_id: currentSession.id,
              classId: null, // No specific class - shared across all classes of this level
              description: `Study of ${subjectData.name} for ${level} students`,
            },
          });
          subjects.push(subject);
        }
      }
    }
    
    // Create SS subjects (for SS1, SS2, SS3 levels)
    const ssSubjects = subjectsData.slice(12);
    const ssLevels = ['SS1', 'SS2', 'SS3'];
    
    for (const level of ssLevels) {
      if (classesByLevel[level]) {
        for (const subjectData of ssSubjects) {
          // Create ONE subject per level (not per class)
          const subject = await prisma.subject.create({
            data: {
              name: subjectData.name,
              code: `${subjectData.code}-${level}`, // e.g., PHY-SS1
              color: subjectData.color,
              schoolId: school.id,
              academic_session_id: currentSession.id,
              classId: null, // No specific class - shared across all classes of this level
              description: `Study of ${subjectData.name} for ${level} students`,
            },
          });
          subjects.push(subject);
        }
      }
    }
    console.log(`✅ ${subjects.length} subjects created (shared across class levels)`);

    // 6. Create Time Slots
    console.log('⏰ Creating time slots...');
    const timeSlots = [
      { startTime: '08:00', endTime: '08:40', label: 'Period 1' },
      { startTime: '08:40', endTime: '09:20', label: 'Period 2' },
      { startTime: '09:20', endTime: '10:00', label: 'Period 3' },
      { startTime: '10:00', endTime: '10:20', label: 'Break' },
      { startTime: '10:20', endTime: '11:00', label: 'Period 4' },
      { startTime: '11:00', endTime: '11:40', label: 'Period 5' },
      { startTime: '11:40', endTime: '12:20', label: 'Period 6' },
      { startTime: '12:20', endTime: '13:00', label: 'Lunch' },
      { startTime: '13:00', endTime: '13:40', label: 'Period 7' },
      { startTime: '13:40', endTime: '14:20', label: 'Period 8' },
    ];

    const createdTimeSlots = await Promise.all(
      timeSlots.map((slot, index) =>
        prisma.timeSlot.create({
          data: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            label: slot.label,
            order: index + 1,
            schoolId: school.id,
          },
        })
      )
    );
    console.log(`✅ ${createdTimeSlots.length} time slots created`);

    // 7. Create Users (Directors, Teachers, Students, Parents) with FIXED password hashing
    console.log('👥 Creating users...');
    
    // Create Directors (2)
    const directors: any[] = [];
    for (let i = 0; i < 2; i++) {
      const ethnicity = ['yoruba', 'igbo', 'hausa'][i % 3] as 'yoruba' | 'igbo' | 'hausa';
      const { firstName, lastName } = getRandomName(ethnicity);
      const email = generateEmail(firstName, lastName, 'director', i + 1);
      
      const hashedPassword = await argon.hash('password123');
      
      const user = await prisma.user.create({
        data: {
          school_id: school.id,
          email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          phone_number: generatePhoneNumber(),
          gender: ['male', 'female'][Math.floor(Math.random() * 2)] as 'male' | 'female',
          role: 'school_director',
          status: 'active',
          is_email_verified: true,
          is_otp_verified: true,
        },
      });
      directors.push(user);
    }

    // Create Teachers (12)
    const teachers: any[] = [];
    for (let i = 0; i < 12; i++) {
      const ethnicity = ['yoruba', 'igbo', 'hausa'][i % 3] as 'yoruba' | 'igbo' | 'hausa';
      const { firstName, lastName } = getRandomName(ethnicity);
      const email = generateEmail(firstName, lastName, 'teacher', i + 1);
      
      const hashedPassword = await argon.hash('password123');
      
      const user = await prisma.user.create({
        data: {
          school_id: school.id,
          email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          phone_number: generatePhoneNumber(),
          gender: ['male', 'female'][Math.floor(Math.random() * 2)] as 'male' | 'female',
          role: 'teacher',
          status: 'active',
          is_email_verified: true,
          is_otp_verified: true,
        },
      });

      const teacher = await prisma.teacher.create({
        data: {
          email,
          first_name: firstName,
          last_name: lastName,
          phone_number: user.phone_number,
          gender: user.gender,
          school_id: school.id,
          academic_session_id: currentSession.id,
          user_id: user.id,
          teacher_id: generateTeacherId(i + 1),
          employee_number: `EMP${String(i + 1).padStart(3, '0')}`,
          qualification: ['B.Ed', 'B.Sc', 'M.Ed', 'M.Sc'][Math.floor(Math.random() * 4)],
          specialization: subjectsData[i % subjectsData.length].name,
          years_of_experience: Math.floor(Math.random() * 15) + 1,
          department: ['Science', 'Arts', 'Commercial', 'Languages'][Math.floor(Math.random() * 4)],
          is_class_teacher: i < 6, // First 6 teachers are class teachers
          status: 'active',
        },
      });
      teachers.push({ user, teacher });
    }

    // Create Parents (45 - roughly 1 parent per 2 students)
    console.log('👨‍👩‍👧 Creating parents...');
    const parents: any[] = [];
    for (let i = 0; i < 45; i++) {
      const ethnicity = ['yoruba', 'igbo', 'hausa'][i % 3] as 'yoruba' | 'igbo' | 'hausa';
      const { firstName, lastName } = getRandomName(ethnicity);
      const email = generateEmail(firstName, lastName, 'parent', i + 1);
      
      const hashedPassword = await argon.hash('password123');
      
      const user = await prisma.user.create({
        data: {
          school_id: school.id,
          email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          phone_number: generatePhoneNumber(),
          gender: ['male', 'female'][Math.floor(Math.random() * 2)] as 'male' | 'female',
          role: 'parent',
          status: 'active',
          is_email_verified: true,
          is_otp_verified: true,
        },
      });

      const parent = await prisma.parent.create({
        data: {
          school_id: school.id,
          user_id: user.id,
          parent_id: generateParentId(i + 1),
          occupation: ['Engineer', 'Teacher', 'Doctor', 'Business Owner', 'Lawyer', 'Nurse', 'Accountant', 'Farmer'][Math.floor(Math.random() * 8)],
          employer: `${getRandomName(ethnicity).firstName} ${getRandomName(ethnicity).lastName} Ltd`,
          address: `${Math.floor(Math.random() * 999) + 1} Street, Lagos, Nigeria`,
          emergency_contact: generatePhoneNumber(),
          relationship: ['Father', 'Mother', 'Guardian'][Math.floor(Math.random() * 3)],
          is_primary_contact: i < 30, // First 30 are primary contacts
          status: 'active',
        },
      });
      parents.push({ user, parent });
    }
    console.log(`✅ ${parents.length} parents created`);

    // Create Students (90) and link to parents
    const students: any[] = [];
    for (let i = 0; i < 90; i++) {
      const ethnicity = ['yoruba', 'igbo', 'hausa'][i % 3] as 'yoruba' | 'igbo' | 'hausa';
      const { firstName, lastName } = getRandomName(ethnicity);
      const email = generateEmail(firstName, lastName, 'student', i + 1);
      
      const hashedPassword = await argon.hash('password123');
      
      const user = await prisma.user.create({
        data: {
          school_id: school.id,
          email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          phone_number: generatePhoneNumber(),
          gender: ['male', 'female'][Math.floor(Math.random() * 2)] as 'male' | 'female',
          role: 'student',
          status: 'active',
          is_email_verified: true,
          is_otp_verified: true,
        },
      });

      const classIndex = i % classes.length;
      // Assign parent (roughly 2 students per parent)
      const parentIndex = Math.floor(i / 2) % parents.length;
      const assignedParent = parents[parentIndex];

      const student = await prisma.student.create({
        data: {
          school_id: school.id,
          academic_session_id: currentSession.id,
          user_id: user.id,
          student_id: generateStudentId(i + 1),
          admission_number: generateAdmissionNumber(currentYear, i + 1),
          current_class_id: classes[classIndex].id,
          date_of_birth: new Date(2000 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          guardian_name: assignedParent.user.first_name + ' ' + assignedParent.user.last_name,
          guardian_phone: assignedParent.user.phone_number,
          guardian_email: assignedParent.user.email,
          address: `${Math.floor(Math.random() * 999) + 1} Street, Lagos, Nigeria`,
          emergency_contact: assignedParent.parent.emergency_contact,
          blood_group: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
          academic_level: classIndex < 6 ? 'JSS' : 'SS',
          parent_id: assignedParent.parent.id, // Link to parent
          status: 'active',
        },
      });
      students.push({ user, student });
    }

    console.log(`✅ Users created: 2 directors, ${teachers.length} teachers, ${students.length} students, ${parents.length} parents`);

    // 8. Assign Class Teachers
    console.log('👨‍🏫 Assigning class teachers...');
    for (let i = 0; i < classes.length; i++) {
      const classItem = classes[i];
      const teacher = teachers[i % teachers.length];
      
      await prisma.class.update({
        where: { id: classItem.id },
        data: {
          classTeacherId: teacher.teacher.id
        }
      });
      
      console.log(`   ✅ ${classItem.name} → ${teacher.user.first_name} ${teacher.user.last_name}`);
    }

    // 9. Create Teacher-Subject Relationships
    console.log('👨‍🏫 Creating teacher-subject relationships...');
    const teacherSubjects: any[] = [];
    
    // Group subjects by name to avoid duplicates
    const subjectsByName = subjects.reduce((acc, subject) => {
      if (!acc[subject.name]) {
        acc[subject.name] = [];
      }
      acc[subject.name].push(subject);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Get unique subject names
    const uniqueSubjectNames = Object.keys(subjectsByName);
    
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const subjectCount = Math.floor(Math.random() * 3) + 2; // 2-4 subjects per teacher
      
      // Select random subjects for this teacher
      const selectedSubjectNames = uniqueSubjectNames
        .sort(() => 0.5 - Math.random())
        .slice(0, subjectCount);
      
      for (const subjectName of selectedSubjectNames) {
        // Get all subjects with this name (for different levels)
        const subjectsWithName = subjectsByName[subjectName];
        
        // Assign teacher to all levels for this subject
        for (const subject of subjectsWithName) {
          const teacherSubject = await prisma.teacherSubject.create({
            data: {
              teacherId: teacher.teacher.id,
              subjectId: subject.id,
            },
          });
          teacherSubjects.push(teacherSubject);
        }
      }
    }
    console.log(`✅ ${teacherSubjects.length} teacher-subject relationships created`);

    // 10. Create Timetable Entries
    console.log('📋 Creating timetable entries...');
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
    const timetableEntries: any[] = [];

    // Helper function to get subjects for a class based on its level
    const getSubjectsForClass = (classItem: any) => {
      const level = getClassLevel(classItem.name);
      return subjects.filter(s => s.code?.endsWith(level));
    };

    for (const classItem of classes) {
      const classSubjects = getSubjectsForClass(classItem);
      
      for (const day of daysOfWeek) {
        for (let period = 0; period < 8; period++) { // Skip break and lunch periods
          if (period === 3 || period === 7) continue; // Skip break and lunch
          
          const timeSlot = createdTimeSlots[period];
          const subject = classSubjects[Math.floor(Math.random() * classSubjects.length)];
          const teacher = teachers[Math.floor(Math.random() * teachers.length)];
          
          const timetableEntry = await prisma.timetableEntry.create({
            data: {
              class_id: classItem.id,
              subject_id: subject.id,
              teacher_id: teacher.teacher.id,
              school_id: school.id,
              academic_session_id: currentSession.id,
              timeSlotId: timeSlot.id,
              day_of_week: day,
              room: `Room ${Math.floor(Math.random() * 20) + 1}`,
              notes: `${subject.name} class for ${classItem.name}`,
            },
          });
          timetableEntries.push(timetableEntry);
        }
      }
    }
    console.log(`✅ ${timetableEntries.length} timetable entries created`);

    // 11. Create Topics for Subjects
    console.log('📚 Creating topics for subjects...');
    const topicTemplates = {
      'Mathematics': [
        'Introduction to Algebra', 'Quadratic Equations', 'Trigonometry', 'Statistics and Probability', 'Geometry and Shapes'
      ],
      'English Language': [
        'Parts of Speech', 'Comprehension Skills', 'Essay Writing', 'Grammar Rules', 'Literature Analysis'
      ],
      'Basic Science': [
        'Living and Non-living Things', 'Human Body Systems', 'Plant Life', 'Energy and Work', 'Environmental Science'
      ],
      'Physics': [
        'Mechanics', 'Waves and Sound', 'Electricity and Magnetism', 'Light and Optics', 'Modern Physics'
      ],
      'Chemistry': [
        'Atomic Structure', 'Chemical Bonding', 'Acids and Bases', 'Organic Chemistry', 'Chemical Reactions'
      ],
      'Biology': [
        'Cell Biology', 'Genetics', 'Ecology', 'Human Anatomy', 'Plant Biology'
      ],
      'Government': [
        'Political Systems', 'Constitution and Law', 'Democracy', 'Federalism', 'International Relations'
      ],
      'Economics': [
        'Supply and Demand', 'Market Systems', 'National Income', 'International Trade', 'Economic Development'
      ],
      'Geography': [
        'Physical Geography', 'Human Geography', 'Climate and Weather', 'Population Studies', 'Environmental Geography'
      ],
      'History': [
        'Ancient Civilizations', 'Colonial Period', 'Independence Movements', 'World Wars', 'Modern History'
      ]
    };

    const topics: any[] = [];
    for (const subject of subjects) {
      const subjectTopics = topicTemplates[subject.name as keyof typeof topicTemplates] || [
        'Introduction to ' + subject.name, 'Advanced ' + subject.name, 'Practical ' + subject.name
      ];
      
      const topicCount = Math.floor(Math.random() * 3) + 2; // 2-4 topics per subject
      const selectedTopics = subjectTopics.slice(0, topicCount);
      
      for (let i = 0; i < selectedTopics.length; i++) {
        const topic = await prisma.topic.create({
          data: {
            title: selectedTopics[i],
            description: `Comprehensive study of ${selectedTopics[i]} in ${subject.name}`,
            order: i + 1,
            subject_id: subject.id,
            school_id: school.id,
            academic_session_id: currentSession.id,
            created_by: teachers[Math.floor(Math.random() * teachers.length)].user.id,
            instructions: `Students should read the chapter carefully and complete all exercises.`,
          },
        });
        topics.push(topic);
      }
    }
    console.log(`✅ ${topics.length} topics created`);

    // 12. Create Finance, Wallet, and Payment Records
    console.log('💰 Creating finance, wallet, and payment records...');
    
    // Create Finance record
    const finance = await prisma.finance.create({
      data: {
        school_id: school.id,
        total_revenue: 0, // Will be calculated from payments
        outstanding_fee: 0, // Will be calculated
        amount_withdrawn: 0,
      },
    });

    // Create Wallet
    const wallet = await prisma.wallet.create({
      data: {
        school_id: school.id,
        balance: 0, // Will be calculated from payments
        currency: 'NGN',
        wallet_type: 'SCHOOL_WALLET',
        financeId: finance.id,
      },
    });

    // Create Payment Records for Students
    const createdPayments: any[] = [];
    let totalRevenue = 0;
    let totalOutstanding = 0;

    // Generate payments for each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentClass = classes.find(c => c.id === student.student.current_class_id) || classes[i % classes.length];
      
      // Each student has 3 payment records
      const paymentDataArray = [
        { type: 'School Fees', amount: studentClass.name.includes('SS') ? 50000 : 30000, transaction: 'credit' as const },
        { type: 'Examination Fees', amount: studentClass.name.includes('SS') ? 15000 : 10000, transaction: 'credit' as const },
        { type: 'Library Fees', amount: 5000, transaction: 'credit' as const }
      ];

      for (const paymentData of paymentDataArray) {
        const payment = await prisma.payment.create({
          data: {
            finance_id: finance.id,
            academic_session_id: currentSession.id,
            student_id: student.user.id,
            class_id: studentClass.id,
            payment_for: paymentData.type,
            amount: paymentData.amount,
            payment_type: 'full',
            transaction_type: paymentData.transaction,
            payment_date: new Date(),
          },
        });
        
        createdPayments.push(payment);
        totalRevenue += paymentData.amount;
      }
    }

    // Update Finance record with calculated totals
    await prisma.finance.update({
      where: { id: finance.id },
      data: {
        total_revenue: totalRevenue,
        outstanding_fee: totalOutstanding,
        amount_withdrawn: Math.floor(totalRevenue * 0.2), // 20% withdrawn
      },
    });

    // Update Wallet balance
    const netBalance = totalRevenue - Math.floor(totalRevenue * 0.2);
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: netBalance,
      },
    });

    console.log(`✅ Finance, wallet, and ${createdPayments.length} payment records created`);
    console.log(`   💰 Total Revenue: ₦${totalRevenue.toLocaleString()}`);
    console.log(`   📊 Outstanding Fees: ₦${totalOutstanding.toLocaleString()}`);
    console.log(`   💳 Wallet Balance: ₦${netBalance.toLocaleString()}`);

    // 13. Create some sample notifications
    console.log('🔔 Creating notifications...');
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          school_id: school.id,
          academic_session_id: currentSession.id,
          title: 'Welcome to Best Academy',
          description: 'Welcome to the new academic session. We wish all students and staff a successful year ahead.',
          type: 'all',
          comingUpOn: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          school_id: school.id,
          academic_session_id: currentSession.id,
          title: 'Parent-Teacher Meeting',
          description: 'Parent-teacher meeting scheduled for next week. Please check the timetable for your assigned time.',
          type: 'all',
          comingUpOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    console.log(`✅ ${notifications.length} notifications created`);

    // 14. Create Assessments (CBT, EXAM, ASSIGNMENT) for both sessions
    console.log('📝 Creating assessments...');
    const previousSession = academicSessions[0];
    
    // Helper function to get all students from a class
    const getStudentsFromClass = (classId: string) => {
      return students.filter(s => s.student.current_class_id === classId);
    };

    // Helper function to get teacher for a subject
    const getTeacherForSubject = (subjectId: string) => {
      const teacherSubject = teacherSubjects.find(ts => ts.subjectId === subjectId);
      if (teacherSubject) {
        return teachers.find(t => t.teacher.id === teacherSubject.teacherId);
      }
      return teachers[Math.floor(Math.random() * teachers.length)];
    };

    const allAssessments: any[] = [];
    const allQuestions: any[] = [];
    const allOptions: any[] = [];
    const allCorrectAnswers: any[] = [];
    const allAttempts: any[] = [];
    const allResponses: any[] = [];
    const allSubmissions: any[] = [];
    const allAnalytics: any[] = [];

    // Assessment templates
    const assessmentTemplates = [
      { type: 'CBT', title: 'CBT Quiz', description: 'Computer Based Test Quiz' },
      { type: 'EXAM', title: 'End of Term Examination', description: 'Comprehensive examination' },
      { type: 'ASSIGNMENT', title: 'Take-Home Assignment', description: 'Assignment to be completed at home' },
      { type: 'CBT', title: 'Weekly CBT Test', description: 'Weekly assessment test' },
      { type: 'EXAM', title: 'Mid-Term Examination', description: 'Mid-term comprehensive exam' },
      { type: 'ASSIGNMENT', title: 'Project Assignment', description: 'Project-based assignment' },
    ];

    // Create assessments for previous session (completed - some with results released)
    console.log('   📚 Creating assessments for previous session (2024/2025)...');
    for (let i = 0; i < 3; i++) {
      const template = assessmentTemplates[i];
      // Pick a class and get subjects for that class level
      const classItem = classes[Math.floor(Math.random() * classes.length)];
      const classSubjects = getSubjectsForClass(classItem);
      if (classSubjects.length === 0) continue; // Skip if no subjects for this class
      const subject = classSubjects[Math.floor(Math.random() * classSubjects.length)];
      const teacher = getTeacherForSubject(subject.id);
      const topic = topics.find(t => t.subject_id === subject.id);
      
      const isResultReleased = i < 2; // First 2 have results released
      
      const assessment = await prisma.assessment.create({
        data: {
          title: `${template.title} - ${subject.name}`,
          description: `${template.description} for ${subject.name}`,
          duration: template.type === 'CBT' ? 60 : template.type === 'EXAM' ? 120 : null,
          time_limit: template.type === 'CBT' ? 60 : template.type === 'EXAM' ? 120 : null,
          academic_session_id: previousSession.id,
          school_id: school.id,
          subject_id: subject.id,
          topic_id: topic?.id || null,
          created_by: teacher.user.id,
          assessment_type: template.type as any,
          status: isResultReleased ? 'CLOSED' : 'PUBLISHED',
          is_published: true,
          published_at: new Date(previousSession.start_date.getTime() + 30 * 24 * 60 * 60 * 1000),
          is_result_released: isResultReleased,
          result_released_at: isResultReleased ? new Date(previousSession.end_date.getTime() - 7 * 24 * 60 * 60 * 1000) : null,
          start_date: new Date(previousSession.start_date.getTime() + 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(previousSession.end_date.getTime() - 7 * 24 * 60 * 60 * 1000),
          total_points: 100,
          passing_score: 50,
          grading_type: template.type === 'ASSIGNMENT' ? 'MANUAL' : 'AUTOMATIC',
          show_correct_answers: isResultReleased,
          show_feedback: true,
          allow_review: true,
          max_attempts: 1,
          tags: [subject.name, template.type],
        },
      });
      allAssessments.push(assessment);

      // Create questions (5-10 questions per assessment)
      const questionCount = Math.floor(Math.random() * 6) + 5;
      for (let q = 0; q < questionCount; q++) {
        const questionType = template.type === 'ASSIGNMENT' 
          ? (q % 2 === 0 ? 'LONG_ANSWER' : 'SHORT_ANSWER')
          : (q % 3 === 0 ? 'MULTIPLE_CHOICE_SINGLE' : q % 3 === 1 ? 'TRUE_FALSE' : 'SHORT_ANSWER');
        
        const question = await prisma.assessmentQuestion.create({
          data: {
            assessment_id: assessment.id,
            question_text: `Question ${q + 1}: What is the main concept in ${subject.name}?`,
            question_type: questionType as any,
            order: q + 1,
            points: 10,
            is_required: true,
            difficulty_level: q < 3 ? 'EASY' : q < 6 ? 'MEDIUM' : 'HARD',
            explanation: `This question tests understanding of ${subject.name} concepts.`,
          },
        });
        allQuestions.push(question);

        // Create options for multiple choice and true/false
        if (questionType === 'MULTIPLE_CHOICE_SINGLE' || questionType === 'TRUE_FALSE') {
          const optionsCount = questionType === 'TRUE_FALSE' ? 2 : 4;
          const correctOptionIndex = Math.floor(Math.random() * optionsCount);
          
          const questionOptions: any[] = [];
          for (let o = 0; o < optionsCount; o++) {
            const optionText = questionType === 'TRUE_FALSE' 
              ? (o === 0 ? 'True' : 'False')
              : `Option ${String.fromCharCode(65 + o)}`;
            
            const option = await prisma.assessmentOption.create({
              data: {
                question_id: question.id,
                option_text: optionText,
                order: o + 1,
                is_correct: o === correctOptionIndex,
              },
            });
            questionOptions.push(option);
            allOptions.push(option);
          }

          // Create correct answer
          const correctOption = questionOptions[correctOptionIndex];
          const correctAnswer = await prisma.assessmentCorrectAnswer.create({
            data: {
              question_id: question.id,
              option_ids: [correctOption.id],
            },
          });
          allCorrectAnswers.push(correctAnswer);
          } else {
            // For text questions, create correct answer with text
            const correctAnswer = await prisma.assessmentCorrectAnswer.create({
              data: {
                question_id: question.id,
                answer_text: `Sample correct answer for ${subject.name}`,
              },
            });
            allCorrectAnswers.push(correctAnswer);
          }
      }

      // Create student attempts/submissions - use most students (80-100%) so they can see results
      const allClassStudents = getStudentsFromClass(classItem.id);
      const studentCount = Math.max(5, Math.floor(allClassStudents.length * (0.8 + Math.random() * 0.2))); // 80-100% of students
      const classStudents = allClassStudents
        .sort(() => 0.5 - Math.random())
        .slice(0, studentCount);
      
      if (template.type === 'CBT' || template.type === 'EXAM') {
        // Create attempts for CBT/EXAM
        for (const student of classStudents) {
          const startedAt = new Date(assessment.start_date!.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
          const submittedAt = new Date(startedAt.getTime() + Math.random() * 3600000); // 0-1 hour
          const timeSpent = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000 / 60);
          
          // Calculate score (random but realistic)
          const totalScore = Math.floor(Math.random() * 40) + 50; // 50-90
          const percentage = (totalScore / assessment.total_points) * 100;
          
          const attempt = await prisma.assessmentAttempt.create({
            data: {
              assessment_id: assessment.id,
              student_id: student.user.id,
              school_id: school.id,
              academic_session_id: previousSession.id,
              attempt_number: 1,
              status: isResultReleased ? 'GRADED' : 'SUBMITTED',
              started_at: startedAt,
              submitted_at: submittedAt,
              time_spent: timeSpent,
              total_score: totalScore,
              max_score: assessment.total_points,
              percentage: percentage,
              passed: percentage >= assessment.passing_score,
              is_graded: isResultReleased,
              graded_at: isResultReleased ? new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000) : null,
              grade_letter: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : percentage >= 50 ? 'E' : 'F',
            },
          });
          allAttempts.push(attempt);

          // Create responses for each question
          for (const question of allQuestions.filter(q => q.assessment_id === assessment.id)) {
            const questionOptions = allOptions.filter(o => o.question_id === question.id);
            let selectedOptions: string[] = [];
            let isCorrect = false;
            let pointsEarned = 0;

            if (question.question_type === 'MULTIPLE_CHOICE_SINGLE' || question.question_type === 'TRUE_FALSE') {
              // Select correct option 70% of the time
              const correctOption = questionOptions.find(o => o.is_correct);
              if (correctOption && Math.random() < 0.7) {
                selectedOptions = [correctOption.id];
                isCorrect = true;
                pointsEarned = question.points;
              } else {
                const wrongOption = questionOptions.find(o => !o.is_correct);
                if (wrongOption) selectedOptions = [wrongOption.id];
              }
            } else {
              // For text questions, mark as correct 70% of the time
              isCorrect = Math.random() < 0.7;
              pointsEarned = isCorrect ? question.points : 0;
            }

            const response = await prisma.assessmentResponse.create({
              data: {
                attempt_id: attempt.id,
                question_id: question.id,
                student_id: student.user.id,
                selected_options: selectedOptions,
                text_answer: question.question_type.includes('ANSWER') ? `Student answer for question ${question.order}` : null,
                is_correct: isCorrect,
                points_earned: pointsEarned,
                max_points: question.points,
                time_spent: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
                is_graded: isResultReleased,
              },
            });
            allResponses.push(response);
          }
        }
      } else {
        // Create submissions for ASSIGNMENT
        for (const student of classStudents) {
          const submittedAt = new Date(assessment.start_date!.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
          const totalScore = Math.floor(Math.random() * 30) + 60; // 60-90
          const percentage = (totalScore / assessment.total_points) * 100;
          
          const submission = await prisma.assessmentSubmission.create({
            data: {
              assessment_id: assessment.id,
              student_id: student.user.id,
              school_id: school.id,
              academic_session_id: previousSession.id,
              submission_type: 'ASSIGNMENT',
              content: `Assignment submission for ${assessment.title}`,
              status: isResultReleased ? 'GRADED' : 'SUBMITTED',
              submitted_at: submittedAt,
              late_submission: submittedAt > assessment.end_date!,
              word_count: Math.floor(Math.random() * 500) + 200,
              total_score: isResultReleased ? totalScore : null,
              max_score: assessment.total_points,
              percentage: isResultReleased ? percentage : null,
              passed: isResultReleased ? percentage >= assessment.passing_score : false,
              is_graded: isResultReleased,
              graded_at: isResultReleased ? new Date(submittedAt.getTime() + 48 * 60 * 60 * 1000) : null,
              graded_by: isResultReleased ? teacher.user.id : null,
              feedback: isResultReleased ? `Good work! Keep it up.` : null,
              grade_letter: isResultReleased ? (percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : percentage >= 50 ? 'E' : 'F') : null,
            },
          });
          allSubmissions.push(submission);
        }
      }

      // Create analytics for assessments with attempts
      if (allAttempts.filter(a => a.assessment_id === assessment.id).length > 0) {
        const attempts = allAttempts.filter(a => a.assessment_id === assessment.id);
        const avgScore = attempts.reduce((sum, a) => sum + a.total_score, 0) / attempts.length;
        const avgTime = attempts.reduce((sum, a) => sum + (a.time_spent || 0), 0) / attempts.length;
        const passRate = (attempts.filter(a => a.passed).length / attempts.length) * 100;

        const analytics = await prisma.assessmentAnalytics.create({
          data: {
            assessment_id: assessment.id,
            total_attempts: attempts.length,
            total_students: new Set(attempts.map(a => a.student_id)).size,
            average_score: avgScore,
            average_time: Math.floor(avgTime),
            pass_rate: passRate,
            completion_rate: 100,
            abandonment_rate: 0,
            question_stats: {},
            daily_attempts: {},
            hourly_attempts: {},
          },
        });
        allAnalytics.push(analytics);
      }
    }

    // Create assessments for current session (mix of statuses)
    console.log('   📚 Creating assessments for current session (2025/2026)...');
    for (let i = 0; i < 9; i++) {
      const template = assessmentTemplates[i % assessmentTemplates.length];
      // Pick a class and get subjects for that class level
      const classItem = classes[Math.floor(Math.random() * classes.length)];
      const classSubjects = getSubjectsForClass(classItem);
      if (classSubjects.length === 0) continue; // Skip if no subjects for this class
      const subject = classSubjects[Math.floor(Math.random() * classSubjects.length)];
      const teacher = getTeacherForSubject(subject.id);
      const topic = topics.find(t => t.subject_id === subject.id);
      
      // Determine status based on index
      let status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' = 'DRAFT';
      let isPublished = false;
      let isResultReleased = false;
      let publishedAt: Date | null = null;
      let resultReleasedAt: Date | null = null;
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (i < 3) {
        // First 3: DRAFT
        status = 'DRAFT';
      } else if (i < 6) {
        // Next 3: PUBLISHED
        status = 'PUBLISHED';
        isPublished = true;
        publishedAt = new Date(currentSession.start_date.getTime() + (i - 3) * 7 * 24 * 60 * 60 * 1000);
        startDate = new Date(publishedAt.getTime() + 1 * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (i < 8) {
        // Next 2: ACTIVE
        status = 'ACTIVE';
        isPublished = true;
        publishedAt = new Date(currentSession.start_date.getTime() + (i - 6) * 7 * 24 * 60 * 60 * 1000);
        startDate = new Date(publishedAt.getTime() - 1 * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      } else {
        // Last 1: CLOSED with results released
        status = 'CLOSED';
        isPublished = true;
        isResultReleased = true;
        publishedAt = new Date(currentSession.start_date.getTime() + 14 * 24 * 60 * 60 * 1000);
        startDate = new Date(publishedAt.getTime() + 1 * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        resultReleasedAt = new Date(endDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      }

      const assessment = await prisma.assessment.create({
        data: {
          title: `${template.title} - ${subject.name}`,
          description: `${template.description} for ${subject.name}`,
          duration: template.type === 'CBT' ? 60 : template.type === 'EXAM' ? 120 : null,
          time_limit: template.type === 'CBT' ? 60 : template.type === 'EXAM' ? 120 : null,
          academic_session_id: currentSession.id,
          school_id: school.id,
          subject_id: subject.id,
          topic_id: topic?.id || null,
          created_by: teacher.user.id,
          assessment_type: template.type as any,
          status: status,
          is_published: isPublished,
          published_at: publishedAt,
          is_result_released: isResultReleased,
          result_released_at: resultReleasedAt,
          start_date: startDate,
          end_date: endDate,
          total_points: 100,
          passing_score: 50,
          grading_type: template.type === 'ASSIGNMENT' ? 'MANUAL' : 'AUTOMATIC',
          show_correct_answers: isResultReleased,
          show_feedback: true,
          allow_review: true,
          max_attempts: 1,
          tags: [subject.name, template.type],
        },
      });
      allAssessments.push(assessment);

      // Only create questions if published
      if (isPublished) {
        const questionCount = Math.floor(Math.random() * 6) + 5;
        for (let q = 0; q < questionCount; q++) {
          const questionType = template.type === 'ASSIGNMENT' 
            ? (q % 2 === 0 ? 'LONG_ANSWER' : 'SHORT_ANSWER')
            : (q % 3 === 0 ? 'MULTIPLE_CHOICE_SINGLE' : q % 3 === 1 ? 'TRUE_FALSE' : 'SHORT_ANSWER');
          
          const question = await prisma.assessmentQuestion.create({
            data: {
              assessment_id: assessment.id,
              question_text: `Question ${q + 1}: Explain the key concepts in ${subject.name}?`,
              question_type: questionType as any,
              order: q + 1,
              points: 10,
              is_required: true,
              difficulty_level: q < 3 ? 'EASY' : q < 6 ? 'MEDIUM' : 'HARD',
              explanation: `This question tests understanding of ${subject.name} concepts.`,
            },
          });
          allQuestions.push(question);

          // Create options for multiple choice and true/false
          if (questionType === 'MULTIPLE_CHOICE_SINGLE' || questionType === 'TRUE_FALSE') {
            const optionsCount = questionType === 'TRUE_FALSE' ? 2 : 4;
            const correctOptionIndex = Math.floor(Math.random() * optionsCount);
            
            const questionOptions: any[] = [];
            for (let o = 0; o < optionsCount; o++) {
              const optionText = questionType === 'TRUE_FALSE' 
                ? (o === 0 ? 'True' : 'False')
                : `Option ${String.fromCharCode(65 + o)}`;
              
              const option = await prisma.assessmentOption.create({
                data: {
                  question_id: question.id,
                  option_text: optionText,
                  order: o + 1,
                  is_correct: o === correctOptionIndex,
                },
              });
              questionOptions.push(option);
              allOptions.push(option);
            }

            // Create correct answer
            const correctOption = questionOptions[correctOptionIndex];
            const correctAnswer = await prisma.assessmentCorrectAnswer.create({
              data: {
                question_id: question.id,
                option_ids: [correctOption.id],
              },
            });
            allCorrectAnswers.push(correctAnswer);
          } else {
            // For text questions
            const correctAnswer = await prisma.assessmentCorrectAnswer.create({
              data: {
                question_id: question.id,
                answer_text: `Sample correct answer for ${subject.name}`,
              },
            });
            allCorrectAnswers.push(correctAnswer);
          }
        }

        // Create attempts/submissions only for ACTIVE or CLOSED assessments
        if (status === 'ACTIVE' || status === 'CLOSED') {
          // Use most students (80-100%) so they can see results
          const allClassStudents = getStudentsFromClass(classItem.id);
          const studentCount = Math.max(5, Math.floor(allClassStudents.length * (0.8 + Math.random() * 0.2))); // 80-100% of students
          const classStudents = allClassStudents
            .sort(() => 0.5 - Math.random())
            .slice(0, studentCount);
          
          if (template.type === 'CBT' || template.type === 'EXAM') {
            // Create attempts
            for (const student of classStudents) {
              const startedAt = startDate ? new Date(startDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000) : new Date();
              const submittedAt = new Date(startedAt.getTime() + Math.random() * 3600000);
              const timeSpent = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000 / 60);
              
              const totalScore = Math.floor(Math.random() * 40) + 50;
              const percentage = (totalScore / assessment.total_points) * 100;
              
              const attempt = await prisma.assessmentAttempt.create({
                data: {
                  assessment_id: assessment.id,
                  student_id: student.user.id,
                  school_id: school.id,
                  academic_session_id: currentSession.id,
                  attempt_number: 1,
                  status: status === 'CLOSED' ? 'GRADED' : 'SUBMITTED',
                  started_at: startedAt,
                  submitted_at: submittedAt,
                  time_spent: timeSpent,
                  total_score: totalScore,
                  max_score: assessment.total_points,
                  percentage: percentage,
                  passed: percentage >= assessment.passing_score,
                  is_graded: status === 'CLOSED',
                  graded_at: status === 'CLOSED' ? new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000) : null,
                  grade_letter: status === 'CLOSED' ? (percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : percentage >= 50 ? 'E' : 'F') : null,
                },
              });
              allAttempts.push(attempt);

              // Create responses
              const assessmentQuestions = allQuestions.filter(q => q.assessment_id === assessment.id);
              for (const question of assessmentQuestions) {
                const questionOptions = allOptions.filter(o => o.question_id === question.id);
                let selectedOptions: string[] = [];
                let isCorrect = false;
                let pointsEarned = 0;

                if (question.question_type === 'MULTIPLE_CHOICE_SINGLE' || question.question_type === 'TRUE_FALSE') {
                  const correctOption = questionOptions.find(o => o.is_correct);
                  if (correctOption && Math.random() < 0.7) {
                    selectedOptions = [correctOption.id];
                    isCorrect = true;
                    pointsEarned = question.points;
                  } else {
                    const wrongOption = questionOptions.find(o => !o.is_correct);
                    if (wrongOption) selectedOptions = [wrongOption.id];
                  }
                } else {
                  isCorrect = Math.random() < 0.7;
                  pointsEarned = isCorrect ? question.points : 0;
                }

                const response = await prisma.assessmentResponse.create({
                  data: {
                    attempt_id: attempt.id,
                    question_id: question.id,
                    student_id: student.user.id,
                    selected_options: selectedOptions,
                    text_answer: question.question_type.includes('ANSWER') ? `Student answer for question ${question.order}` : null,
                    is_correct: isCorrect,
                    points_earned: pointsEarned,
                    max_points: question.points,
                    time_spent: Math.floor(Math.random() * 300) + 60,
                    is_graded: status === 'CLOSED',
                  },
                });
                allResponses.push(response);
              }
            }
          } else {
            // Create submissions for ASSIGNMENT
            for (const student of classStudents) {
              const submittedAt = startDate ? new Date(startDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : new Date();
              const totalScore = status === 'CLOSED' ? Math.floor(Math.random() * 30) + 60 : null;
              const percentage = totalScore ? (totalScore / assessment.total_points) * 100 : null;
              
              const submission = await prisma.assessmentSubmission.create({
                data: {
                  assessment_id: assessment.id,
                  student_id: student.user.id,
                  school_id: school.id,
                  academic_session_id: currentSession.id,
                  submission_type: 'ASSIGNMENT',
                  content: `Assignment submission for ${assessment.title}`,
                  status: status === 'CLOSED' ? 'GRADED' : 'SUBMITTED',
                  submitted_at: submittedAt,
                  late_submission: endDate ? submittedAt > endDate : false,
                  word_count: Math.floor(Math.random() * 500) + 200,
                  total_score: totalScore,
                  max_score: assessment.total_points,
                  percentage: percentage,
                  passed: percentage ? percentage >= assessment.passing_score : false,
                  is_graded: status === 'CLOSED',
                  graded_at: status === 'CLOSED' ? new Date(submittedAt.getTime() + 48 * 60 * 60 * 1000) : null,
                  graded_by: status === 'CLOSED' ? teacher.user.id : null,
                  feedback: status === 'CLOSED' ? `Good work! Keep it up.` : null,
                  grade_letter: status === 'CLOSED' && percentage ? (percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : percentage >= 50 ? 'E' : 'F') : null,
                },
              });
              allSubmissions.push(submission);
            }
          }

          // Create analytics for assessments with attempts
          const attempts = allAttempts.filter(a => a.assessment_id === assessment.id);
          if (attempts.length > 0) {
            const avgScore = attempts.reduce((sum, a) => sum + a.total_score, 0) / attempts.length;
            const avgTime = attempts.reduce((sum, a) => sum + (a.time_spent || 0), 0) / attempts.length;
            const passRate = (attempts.filter(a => a.passed).length / attempts.length) * 100;

            await prisma.assessmentAnalytics.create({
              data: {
                assessment_id: assessment.id,
                total_attempts: attempts.length,
                total_students: new Set(attempts.map(a => a.student_id)).size,
                average_score: avgScore,
                average_time: Math.floor(avgTime),
                pass_rate: passRate,
                completion_rate: 100,
                abandonment_rate: 0,
                question_stats: {},
                daily_attempts: {},
                hourly_attempts: {},
              },
            });
          }
        }
      }
    }

    console.log(`✅ Assessments created: ${allAssessments.length} (${allAssessments.filter(a => a.academic_session_id === previousSession.id).length} for previous session, ${allAssessments.filter(a => a.academic_session_id === currentSession.id).length} for current session)`);
    console.log(`   - Questions: ${allQuestions.length}`);
    console.log(`   - Options: ${allOptions.length}`);
    console.log(`   - Correct Answers: ${allCorrectAnswers.length}`);
    console.log(`   - Attempts: ${allAttempts.length}`);
    console.log(`   - Responses: ${allResponses.length}`);
    console.log(`   - Submissions: ${allSubmissions.length}`);
    console.log(`   - Analytics: ${allAnalytics.length}`);

    console.log('🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- School: ${school.school_name}`);
    console.log(`- Subscription Plan: Free (default)`);
    console.log(`- Subscription Plan Templates: ${createdTemplates.length} (Free, Basic, Premium, Enterprise)`);
    console.log(`- Academic Sessions: ${academicSessions.length}`);
    console.log(`- Classes: ${classes.length}`);
    console.log(`- Subjects: ${subjects.length} (shared across class levels)`);
    console.log(`- Users: ${2 + teachers.length + students.length + parents.length} (2 directors, ${teachers.length} teachers, ${students.length} students, ${parents.length} parents)`);
    console.log(`- Class Teachers: ${classes.length} assigned`);
    console.log(`- Teacher-Subject Relationships: ${teacherSubjects.length}`);
    console.log(`- Timetable Entries: ${timetableEntries.length}`);
    console.log(`- Topics: ${topics.length}`);
    console.log(`- Time Slots: ${createdTimeSlots.length}`);
    console.log(`- Payment Records: ${createdPayments.length}`);
    console.log(`- Finance Records: 1`);
    console.log(`- Wallet Records: 1`);
    console.log(`- Assessments: ${allAssessments.length} (CBT, EXAM, ASSIGNMENT)`);
    console.log(`  - Previous Session: ${allAssessments.filter(a => a.academic_session_id === previousSession.id).length} (some with results released)`);
    console.log(`  - Current Session: ${allAssessments.filter(a => a.academic_session_id === currentSession.id).length} (mix of DRAFT, PUBLISHED, ACTIVE, CLOSED)`);
    console.log(`- Assessment Questions: ${allQuestions.length}`);
    console.log(`- Assessment Attempts: ${allAttempts.length}`);
    console.log(`- Assessment Submissions: ${allSubmissions.length}`);

    console.log('\n🔐 Sample Login Credentials:');
    console.log('Password for all users: password123');
    console.log(`Director: ${directors[0].email}`);
    console.log(`Teacher: ${teachers[0].user.email}`);
    console.log(`Student: ${students[0].user.email}`);
    console.log(`Parent: ${parents[0].user.email}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
