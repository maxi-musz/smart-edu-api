import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `${baseEmail}${index}@bestacademy.edu.ng`;
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

function generateAdmissionNumber(year: number, index: number) {
  return `BA${year}${String(index).padStart(4, '0')}`;
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Check if data already exists
  const existingSchool = await prisma.school.findFirst();
  if (existingSchool) {
    console.log('❌ Database already has data. Skipping seeding.');
    return;
  }

  try {
    // 1. Create School
    console.log('📚 Creating school...');
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
    console.log(`✅ School created: ${school.school_name}`);

    // 2. Create Academic Sessions
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

    // 3. Create Classes (JSS1 to SS3)
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

    // 4. Create Subjects
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

    // Create subjects and assign them to appropriate classes
    const subjects: any[] = [];
    
    // JSS Subjects (for JSS1-JSS3 classes)
    const jssSubjects = subjectsData.slice(0, 12); // First 12 are JSS subjects
    const jssClasses = classes.slice(0, 6); // JSS1A, JSS1B, JSS2A, JSS2B, JSS3A, JSS3B
    
    for (const subjectData of jssSubjects) {
      for (const classItem of jssClasses) {
        const subject = await prisma.subject.create({
          data: {
            name: subjectData.name,
            code: `${subjectData.code}-${classItem.name}`, // Make code unique per class
            color: subjectData.color,
            schoolId: school.id,
            academic_session_id: currentSession.id,
            classId: classItem.id,
            description: `Study of ${subjectData.name} for ${classItem.name} students`,
          },
        });
        subjects.push(subject);
      }
    }
    
    // SS Subjects (for SS1-SS3 classes)
    const ssSubjects = subjectsData.slice(12); // Last 12 are SS subjects
    const ssClasses = classes.slice(6); // SS1A, SS1B, SS2A, SS2B, SS3A, SS3B
    
    for (const subjectData of ssSubjects) {
      for (const classItem of ssClasses) {
        const subject = await prisma.subject.create({
          data: {
            name: subjectData.name,
            code: `${subjectData.code}-${classItem.name}`, // Make code unique per class
            color: subjectData.color,
            schoolId: school.id,
            academic_session_id: currentSession.id,
            classId: classItem.id,
            description: `Study of ${subjectData.name} for ${classItem.name} students`,
          },
        });
        subjects.push(subject);
      }
    }
    console.log(`✅ ${subjects.length} subjects created`);

    // 5. Create Time Slots
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

    // 6. Create Users (Directors, Teachers, Students) with FIXED password hashing
    console.log('👥 Creating users...');
    
    // Create Directors (2)
    const directors: any[] = [];
    for (let i = 0; i < 2; i++) {
      const ethnicity = ['yoruba', 'igbo', 'hausa'][i % 3] as 'yoruba' | 'igbo' | 'hausa';
      const { firstName, lastName } = getRandomName(ethnicity);
      const email = generateEmail(firstName, lastName, 'director', i + 1);
      
      // Hash password for each user individually
      const hashedPassword = await bcrypt.hash('password123', 10);
      
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
      
      // Hash password for each user individually
      const hashedPassword = await bcrypt.hash('password123', 10);
      
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

    // Create Students (90)
    const students: any[] = [];
    for (let i = 0; i < 90; i++) {
      const ethnicity = ['yoruba', 'igbo', 'hausa'][i % 3] as 'yoruba' | 'igbo' | 'hausa';
      const { firstName, lastName } = getRandomName(ethnicity);
      const email = generateEmail(firstName, lastName, 'student', i + 1);
      
      // Hash password for each user individually
      const hashedPassword = await bcrypt.hash('password123', 10);
      
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
      const student = await prisma.student.create({
        data: {
          school_id: school.id,
          academic_session_id: currentSession.id,
          user_id: user.id,
          student_id: generateStudentId(i + 1),
          admission_number: generateAdmissionNumber(currentYear, i + 1),
          current_class_id: classes[classIndex].id,
          date_of_birth: new Date(2000 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          guardian_name: `${getRandomName(ethnicity).firstName} ${getRandomName(ethnicity).lastName}`,
          guardian_phone: generatePhoneNumber(),
          guardian_email: generateEmail(getRandomName(ethnicity).firstName, getRandomName(ethnicity).lastName, 'guardian', i + 1),
          address: `${Math.floor(Math.random() * 999) + 1} Street, Lagos, Nigeria`,
          emergency_contact: generatePhoneNumber(),
          blood_group: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
          academic_level: classIndex < 6 ? 'JSS' : 'SS',
          status: 'active',
        },
      });
      students.push({ user, student });
    }

    console.log(`✅ Users created: 2 directors, ${teachers.length} teachers, ${students.length} students`);

    // 7. Assign Class Teachers
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

    // 8. Create Teacher-Subject Relationships
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
        // Get all subjects with this name (for different classes)
        const subjectsWithName = subjectsByName[subjectName];
        
        // Assign teacher to all classes for this subject
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

    // 9. Create Timetable Entries
    console.log('📋 Creating timetable entries...');
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
    const timetableEntries: any[] = [];

    for (const classItem of classes) {
      for (const day of daysOfWeek) {
        for (let period = 0; period < 8; period++) { // Skip break and lunch periods
          if (period === 3 || period === 7) continue; // Skip break and lunch
          
          const timeSlot = createdTimeSlots[period];
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
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

    // 10. Create Topics for Subjects
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

    // 11. Create Finance, Wallet, and Payment Records
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
    const paymentTypes = ['full', 'partial'] as const;
    const transactionTypes = ['credit', 'debit'] as const;
    const paymentForOptions = [
      'School Fees', 'Examination Fees', 'Library Fees', 'Sports Fees', 
      'Transportation Fees', 'Meal Plan', 'Uniform Fees', 'Technology Fees',
      'Laboratory Fees', 'Computer Fees', 'Art Supplies', 'Music Fees'
    ];

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

    // 12. Create some sample notifications
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

    console.log('🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- School: ${school.school_name}`);
    console.log(`- Academic Sessions: ${academicSessions.length}`);
    console.log(`- Classes: ${classes.length}`);
    console.log(`- Subjects: ${subjects.length}`);
    console.log(`- Users: ${2 + teachers.length + students.length} (2 directors, ${teachers.length} teachers, ${students.length} students)`);
    console.log(`- Class Teachers: ${classes.length} assigned`);
    console.log(`- Teacher-Subject Relationships: ${teacherSubjects.length}`);
    console.log(`- Timetable Entries: ${timetableEntries.length}`);
    console.log(`- Topics: ${topics.length}`);
    console.log(`- Time Slots: ${createdTimeSlots.length}`);
    console.log(`- Payment Records: ${createdPayments.length}`);
    console.log(`- Finance Records: 1`);
    console.log(`- Wallet Records: 1`);

    console.log('\n🔐 Sample Login Credentials:');
    console.log('Password for all users: password123');
    console.log(`Director: ${directors[0].email}`);
    console.log(`Teacher: ${teachers[0].user.email}`);
    console.log(`Student: ${students[0].user.email}`);

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
