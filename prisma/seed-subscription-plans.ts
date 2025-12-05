import { PrismaClient, SubscriptionPlanType, BillingCycle, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding subscription plans...');

  // Get all schools
  const allSchools = await prisma.school.findMany({
    select: {
      id: true,
      school_name: true,
      subscriptionPlan: {
        select: {
          id: true
        }
      }
    }
  });

  // Filter schools that don't have a subscription plan yet
  const schoolsWithoutPlans = allSchools.filter(school => !school.subscriptionPlan);

  console.log(`Found ${schoolsWithoutPlans.length} schools without subscription plans`);

  // Create Free plan for all schools without plans
  const freePlans = await Promise.all(
    schoolsWithoutPlans.map(school =>
      prisma.platformSubscriptionPlan.create({
        data: {
          school_id: school.id,
          name: 'Free',
          plan_type: 'FREE',
          description: 'Free plan with basic features and limited AI interactions',
          cost: 0,
          currency: 'USD',
          billing_cycle: 'MONTHLY',
          is_active: true,
          
          // Basic Limits
          max_allowed_teachers: 30,
          max_allowed_students: 100,
          max_allowed_classes: null,
          max_allowed_subjects: null,
          
          // AI Interactions & Document Management
          allowed_document_types: ['pdf'],
          max_file_size_mb: 10,
          max_document_uploads_per_student_per_day: 3,
          max_document_uploads_per_teacher_per_day: 10,
          max_storage_mb: 500,
          max_files_per_month: 10,
          
          // Token Usage Limits
          max_daily_tokens_per_user: 50000,
          max_weekly_tokens_per_user: null,
          max_monthly_tokens_per_user: null,
          max_total_tokens_per_school: null,
          
          // Chat & Messaging Limits
          max_messages_per_week: 100,
          max_conversations_per_user: null,
          max_chat_sessions_per_user: null,
          
          // Additional Features
          features: {
            ai_grading: false,
            advanced_analytics: false,
            priority_support: false,
            custom_branding: false,
            api_access: false,
            bulk_operations: false
          },
          
          // Subscription Management
          start_date: new Date(),
          end_date: null,
          status: 'ACTIVE',
          auto_renew: false
        }
      })
    )
  );

  console.log(`✅ Created ${freePlans.length} Free subscription plans`);

  // Create plan templates (with school_id: null and is_template: true)
  // These templates can be used to create plans for schools or viewed as available upgrade options
  console.log('📋 Creating plan templates...');

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
      max_allowed_teachers: null, // Unlimited
      max_allowed_students: null, // Unlimited
      max_allowed_classes: null, // Unlimited
      max_allowed_subjects: null, // Unlimited
      allowed_document_types: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'pptx'],
      max_file_size_mb: 100,
      max_document_uploads_per_student_per_day: null, // Unlimited
      max_document_uploads_per_teacher_per_day: null, // Unlimited
      max_storage_mb: null, // Unlimited
      max_files_per_month: null, // Unlimited
      max_daily_tokens_per_user: 500000,
      max_weekly_tokens_per_user: 2500000,
      max_monthly_tokens_per_user: 10000000,
      max_total_tokens_per_school: null, // Unlimited
      max_messages_per_week: null, // Unlimited
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

  // Upsert plan templates (create if not exists, update if exists)
  // Since we can't use compound unique constraint, we'll find first and update or create
  const createdTemplates = await Promise.all(
    planTemplates.map(async (template) => {
      const existing = await prisma.platformSubscriptionPlan.findFirst({
        where: {
          plan_type: template.plan_type,
          school_id: null, // Template plans have null school_id
          is_template: true
        } as any
      });

      if (existing) {
        return prisma.platformSubscriptionPlan.update({
          where: { id: existing.id },
          data: {
            ...template,
            school_id: null // Ensure it stays null
          } as any
        });
      } else {
        return prisma.platformSubscriptionPlan.create({
          data: {
            ...template,
            school_id: null // Template plans have no school_id
          } as any
        });
      }
    })
  );

  console.log(`✅ Created/Updated ${createdTemplates.length} plan templates`);

  console.log('\n✅ Subscription plans seeding completed!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Free plans created: ${freePlans.length}`);
  console.log(`   - Plan templates created/updated: ${createdTemplates.length}`);
  console.log(`   - Schools processed: ${schoolsWithoutPlans.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding subscription plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

