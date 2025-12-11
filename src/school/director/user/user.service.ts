import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { User } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';
import { StudentProfileDto, StudentAcademicInfoDto, StudentPersonalInfoDto, StudentGuardianInfoDto, StudentParentDto, StudentPerformanceDto, StudentClassDto } from './dto/student-profile.dto';
import { MobileStudentProfileDto, GeneralInfoDto, StudentInfoDto, StudentAddressDto, StudentClassDto as MobileStudentClassDto, CurrentSessionDto, AcademicInfoDto, SubjectEnrolledDto, PerformanceSummaryDto, RecentAchievementDto, SettingsDto, NotificationSettingsDto, AppPreferencesDto, PrivacySettingsDto, SupportInfoDto, HelpCenterDto, ContactOptionsDto, AppInfoDto } from './dto/mobile-student-profile.dto';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly academicSessionService: AcademicSessionService
    ) {}

    async getUserProfile(user: User) {
        this.logger.log(colors.cyan(`Fetching user profile for: ${user.email}`));

        try {
            // Get the full user details from the database
            const userProfile = await this.prisma.user.findUnique({
                where: { email: user.email },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone_number: true,
                    role: true,
                    status: true,
                    is_email_verified: true,
                    school_id: true,
                    display_picture: true,
                    gender: true,
                    createdAt: true,
                    updatedAt: true,
                    school: {
                        select: {
                            id: true,
                            school_name: true,
                            school_email: true,
                            school_phone: true,
                            school_address: true,
                            school_type: true,
                            school_ownership: true,
                            status: true
                        }
                    }
                }
            });

            if (!userProfile) {
                this.logger.error(colors.red(`User not found: ${user.id}`));
                throw new NotFoundException('User not found');
            }

            // Get current academic session for the school
            let currentSession: any = null;
            let currentTerm: any = null;
            let currentSessionId: any = null;
            if (userProfile.school_id) {
                try {
                    const currentSessionResponse = await this.academicSessionService.getCurrentSession(userProfile.school_id);
                    if (currentSessionResponse.success) {
                        currentSession = currentSessionResponse.data.academic_year;
                        currentTerm = currentSessionResponse.data.term;
                        currentSessionId = currentSessionResponse.data.id;
                    }
                } catch (error) {
                    this.logger.warn(colors.yellow(`Could not fetch current session for school ${userProfile.school_id}: ${error.message}`));
                }
            }

            // Format the response
            const formattedProfile = {
                current_academic_session_id: currentSessionId,
                current_academic_session: currentSession,
                current_term: currentTerm,
                id: userProfile.id,
                email: userProfile.email,
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                phone_number: userProfile.phone_number,
                role: userProfile.role,
                status: userProfile.status,
                is_email_verified: userProfile.is_email_verified,
                school_id: userProfile.school_id,
                display_picture: userProfile.display_picture,
                gender: userProfile.gender,
                created_at: formatDate(userProfile.createdAt),
                updated_at: formatDate(userProfile.updatedAt),
                school: userProfile.school ? {
                    id: userProfile.school.id,
                    name: userProfile.school.school_name,
                    email: userProfile.school.school_email,
                    phone: userProfile.school.school_phone,
                    address: userProfile.school.school_address,
                    type: userProfile.school.school_type,
                    ownership: userProfile.school.school_ownership,
                    status: userProfile.school.status
                } : null,
            };

            this.logger.log(colors.green(`User profile retrieved successfully for: ${user.email}`));
            
            return ResponseHelper.success(
                'User profile retrieved successfully',
                formattedProfile
            );

        } catch (error) {
            this.logger.error(colors.red(`Error fetching user profile: ${error.message}`));
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new Error('Failed to retrieve user profile');
        }
    }

    async getStudentProfile(user: User) {
        this.logger.log(colors.cyan(`Fetching student profile for: ${user.email}`));

        try {
            // Get the full user details with student information
            const userProfile = await this.prisma.user.findUnique({
                where: { email: user.email },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone_number: true,
                    role: true,
                    status: true,
                    is_email_verified: true,
                    school_id: true,
                    display_picture: true,
                    gender: true,
                    createdAt: true,
                    updatedAt: true,
                    school: {
                        select: {
                            id: true,
                            school_name: true,
                            school_email: true,
                            school_phone: true,
                            school_address: true,
                            school_type: true,
                            school_ownership: true,
                            status: true
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            student_id: true,
                            admission_number: true,
                            date_of_birth: true,
                            admission_date: true,
                            current_class_id: true,
                            guardian_name: true,
                            guardian_phone: true,
                            guardian_email: true,
                            address: true,
                            emergency_contact: true,
                            blood_group: true,
                            medical_conditions: true,
                            allergies: true,
                            previous_school: true,
                            academic_level: true,
                            parent_id: true,
                            city: true,
                            country: true,
                            postal_code: true,
                            state: true,
                            current_class: {
                                select: {
                                    id: true,
                                    name: true,
                                    classId: true,
                                    classTeacherId: true,
                                    classTeacher: {
                                        select: {
                                            id: true,
                                            first_name: true,
                                            last_name: true
                                        }
                                    }
                                }
                            },
                            parent: {
                                select: {
                                    id: true,
                                    user: {
                                        select: {
                                            id: true,
                                            first_name: true,
                                            last_name: true,
                                            email: true,
                                            phone_number: true
                                        }
                                    },
                                    occupation: true,
                                    employer: true,
                                    relationship: true,
                                    is_primary_contact: true
                                }
                            }
                        }
                    }
                }
            });

            if (!userProfile) {
                this.logger.error(colors.red(`User not found: ${user.id}`));
                throw new NotFoundException('User not found');
            }

            if (!userProfile.student) {
                this.logger.error(colors.red(`Student record not found for user: ${user.email}`));
                throw new NotFoundException('Student record not found');
            }

            // Get current academic session
            let currentSession: any = null;
            let currentTerm: any = null;
            if (userProfile.school_id) {
                try {
                    const currentSessionResponse = await this.academicSessionService.getCurrentSession(userProfile.school_id);
                    if (currentSessionResponse.success) {
                        currentSession = currentSessionResponse.data.academic_year;
                        currentTerm = currentSessionResponse.data.term;
                    }
                } catch (error) {
                    this.logger.warn(colors.yellow(`Could not fetch current session for school ${userProfile.school_id}: ${error.message}`));
                }
            }

            // Get student performance data
            const performanceData = await this.getStudentPerformanceData(userProfile.id, userProfile.student.current_class_id);

            // Build academic info
            const academicInfo: StudentAcademicInfoDto = {
                studentId: userProfile.student.student_id,
                admissionNumber: userProfile.student.admission_number || undefined,
                admissionDate: formatDate(userProfile.student.admission_date),
                dateOfBirth: userProfile.student.date_of_birth ? formatDate(userProfile.student.date_of_birth) : undefined,
                academicLevel: userProfile.student.academic_level || undefined,
                previousSchool: userProfile.student.previous_school || undefined,
                currentClass: {
                    id: userProfile.student.current_class?.id || '',
                    name: userProfile.student.current_class?.name || '',
                    classId: userProfile.student.current_class?.classId || 0,
                    classTeacherId: userProfile.student.current_class?.classTeacherId || '',
                    classTeacherName: userProfile.student.current_class?.classTeacher ? 
                        `${userProfile.student.current_class.classTeacher.first_name} ${userProfile.student.current_class.classTeacher.last_name}` : 
                        undefined
                },
                academicYear: currentSession || '',
                currentTerm: currentTerm || ''
            };

            // Build personal info
            const personalInfo: StudentPersonalInfoDto = {
                address: userProfile.student.address || undefined,
                city: userProfile.student.city || undefined,
                state: userProfile.student.state || undefined,
                postalCode: userProfile.student.postal_code || undefined,
                country: userProfile.student.country || undefined,
                bloodGroup: userProfile.student.blood_group || undefined,
                medicalConditions: userProfile.student.medical_conditions || undefined,
                allergies: userProfile.student.allergies || undefined,
                emergencyContact: userProfile.student.emergency_contact || undefined
            };

            // Build guardian info
            const guardianInfo: StudentGuardianInfoDto = {
                guardianName: userProfile.student.guardian_name || undefined,
                guardianPhone: userProfile.student.guardian_phone || undefined,
                guardianEmail: userProfile.student.guardian_email || undefined,
                relationship: userProfile.student.parent?.relationship || undefined
            };

            // Build parent info if exists
            let parentInfo: StudentParentDto | undefined;
            if (userProfile.student.parent) {
                parentInfo = {
                    id: userProfile.student.parent.id,
                    name: `${userProfile.student.parent.user.first_name} ${userProfile.student.parent.user.last_name}`,
                    email: userProfile.student.parent.user.email,
                    phone: userProfile.student.parent.user.phone_number || '',
                    relationship: userProfile.student.parent.relationship || undefined,
                    occupation: userProfile.student.parent.occupation || undefined,
                    employer: userProfile.student.parent.employer || undefined,
                    isPrimaryContact: userProfile.student.parent.is_primary_contact
                };
            }

            // Build the complete student profile
            const studentProfile: StudentProfileDto = {
                id: userProfile.id,
                email: userProfile.email,
                firstName: userProfile.first_name,
                lastName: userProfile.last_name,
                phoneNumber: userProfile.phone_number || undefined,
                gender: userProfile.gender || undefined,
                displayPicture: typeof userProfile.display_picture === 'string' ? userProfile.display_picture : undefined,
                status: userProfile.status,
                isEmailVerified: userProfile.is_email_verified || false,
                createdAt: formatDate(userProfile.createdAt),
                updatedAt: formatDate(userProfile.updatedAt),
                schoolId: userProfile.school_id,
                schoolName: userProfile.school?.school_name || '',
                schoolEmail: userProfile.school?.school_email || '',
                schoolPhone: userProfile.school?.school_phone || '',
                schoolAddress: userProfile.school?.school_address || '',
                academicInfo,
                personalInfo,
                guardianInfo,
                parentInfo,
                performance: performanceData
            };

            this.logger.log(colors.green(`Student profile retrieved successfully for: ${user.email}`));
            
            return ResponseHelper.success(
                'Student profile retrieved successfully',
                studentProfile
            );

        } catch (error) {
            this.logger.error(colors.red(`Error fetching student profile: ${error.message}`));
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new Error('Failed to retrieve student profile');
        }
    }

    private async getStudentPerformanceData(userId: string, classId: string | null): Promise<StudentPerformanceDto> {
        try {
            if (!classId) {
                return {
                    averageScore: 0,
                    totalAssessments: 0,
                    passedAssessments: 0,
                    classPosition: 0,
                    totalStudentsInClass: 0
                };
            }

            // Get assessment attempts for the student
            const assessmentAttempts = await this.prisma.assessmentAttempt.findMany({
                where: {
                    student_id: userId
                },
                include: {
                    assessment: {
                        select: {
                            total_points: true
                        }
                    }
                }
            });

            // Calculate performance metrics
            const totalAssessments = assessmentAttempts.length;
            const passedAssessments = assessmentAttempts.filter(attempt => attempt.passed).length;
            const averageScore = totalAssessments > 0 ? 
                assessmentAttempts.reduce((sum, attempt) => sum + (attempt.total_score || 0), 0) / totalAssessments : 0;

            // Get total students in class
            const totalStudentsInClass = await this.prisma.student.count({
                where: {
                    current_class_id: classId,
                    status: 'active'
                }
            });

            // Get class position from StudentPerformance table if available
            let classPosition = 0;
            try {
                const studentPerformance = await this.prisma.studentPerformance.findFirst({
                    where: {
                        student_id: userId,
                        class_id: classId
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                classPosition = studentPerformance?.position || 0;
            } catch (error) {
                this.logger.warn(colors.yellow(`Could not fetch class position: ${error.message}`));
            }

            return {
                averageScore: Math.round(averageScore * 100) / 100,
                totalAssessments,
                passedAssessments,
                classPosition,
                totalStudentsInClass
            };

        } catch (error) {
            this.logger.warn(colors.yellow(`Could not fetch performance data: ${error.message}`));
            return {
                averageScore: 0,
                totalAssessments: 0,
                passedAssessments: 0,
                classPosition: 0,
                totalStudentsInClass: 0
            };
        }
    }

    async getMobileStudentProfile(user: User) {
        this.logger.log(colors.cyan(`Fetching mobile student profile for: ${user.email}`));

        try {
            // Get the full user details with student information
            const userProfile = await this.prisma.user.findUnique({
                where: { email: user.email },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone_number: true,
                    role: true,
                    status: true,
                    is_email_verified: true,
                    school_id: true,
                    display_picture: true,
                    gender: true,
                    createdAt: true,
                    updatedAt: true,
                    school: {
                        select: {
                            id: true,
                            school_name: true,
                            school_email: true,
                            school_phone: true,
                            school_address: true,
                            school_type: true,
                            school_ownership: true,
                            status: true
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            student_id: true,
                            admission_number: true,
                            date_of_birth: true,
                            admission_date: true,
                            current_class_id: true,
                            academic_session_id: true,
                            guardian_name: true,
                            guardian_phone: true,
                            guardian_email: true,
                            address: true,
                            emergency_contact: true,
                            blood_group: true,
                            medical_conditions: true,
                            allergies: true,
                            previous_school: true,
                            academic_level: true,
                            parent_id: true,
                            city: true,
                            country: true,
                            postal_code: true,
                            state: true,
                            current_class: {
                                select: {
                                    id: true,
                                    name: true,
                                    classId: true,
                                    classTeacherId: true,
                                    classTeacher: {
                                        select: {
                                            id: true,
                                            first_name: true,
                                            last_name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!userProfile) {
                this.logger.error(colors.red(`User not found: ${user.id}`));
                throw new NotFoundException('User not found');
            }

            if (!userProfile.student) {
                this.logger.error(colors.red(`Student record not found for user: ${user.email}`));
                throw new NotFoundException('Student record not found');
            }

            // Get current academic session
            let currentSession: any = null;
            let currentTerm: any = null;
            let sessionId: any = null;
            if (userProfile.school_id) {
                try {
                    const currentSessionResponse = await this.academicSessionService.getCurrentSession(userProfile.school_id);
                    if (currentSessionResponse.success) {
                        currentSession = currentSessionResponse.data.academic_year;
                        currentTerm = currentSessionResponse.data.term;
                        sessionId = currentSessionResponse.data.id;
                    }
                } catch (error) {
                    this.logger.warn(colors.yellow(`Could not fetch current session for school ${userProfile.school_id}: ${error.message}`));
                }
            }

            // Get subjects with teachers for the student's class
            const subjectsEnrolled = await this.getStudentSubjects(userProfile.student.current_class_id, userProfile.school_id, userProfile.student.academic_session_id);

            // Get performance data
            const performanceData = await this.getStudentPerformanceData(userProfile.id, userProfile.student.current_class_id);

            // Get attendance percentage
            const attendancePercentage = await this.getStudentAttendancePercentage(userProfile.id, userProfile.student.current_class_id);

            // Get student achievements
            const recentAchievements = await this.getStudentAchievements(userProfile.id, userProfile.student.academic_session_id);

            // Build student info
            const studentInfo: StudentInfoDto = {
                id: userProfile.student.id,
                name: `${userProfile.first_name} ${userProfile.last_name}`,
                email: userProfile.email,
                phone: userProfile.phone_number || '',
                date_of_birth: userProfile.student.date_of_birth ? formatDate(userProfile.student.date_of_birth) : '',
                display_picture: typeof userProfile.display_picture === 'string' ? userProfile.display_picture : '',
                student_id: userProfile.student.student_id,
                emergency_contact_name: userProfile.student.guardian_name || '',
                emergency_contact_phone: userProfile.student.guardian_phone || '',
                address: {
                    street: userProfile.student.address || '',
                    city: userProfile.student.city || '',
                    state: userProfile.student.state || '',
                    country: userProfile.student.country || '',
                    postal_code: userProfile.student.postal_code || ''
                }
            };

            // Build student class info
            const studentClass: MobileStudentClassDto = {
                id: userProfile.student.current_class?.id || '',
                name: userProfile.student.current_class?.name || '',
                level: userProfile.student.current_class?.classId?.toString() || '',
                section: this.extractSectionFromClassName(userProfile.student.current_class?.name || '')
            };

            // Build current session info
            const currentSessionInfo: CurrentSessionDto = {
                id: sessionId || '',
                academic_year: currentSession || '',
                term: currentTerm || '',
                start_date: '', // Would need to get from session data
                end_date: '' // Would need to get from session data
            };

            // Build general info
            const generalInfo: GeneralInfoDto = {
                student: studentInfo,
                student_class: studentClass,
                current_session: currentSessionInfo
            };

            // Build academic info
            const academicInfo: AcademicInfoDto = {
                subjects_enrolled: subjectsEnrolled,
                performance_summary: {
                    average_score: performanceData.averageScore || 0,
                    total_assessments: performanceData.totalAssessments || 0,
                    passed_assessments: performanceData.passedAssessments || 0,
                    failed_assessments: (performanceData.totalAssessments || 0) - (performanceData.passedAssessments || 0),
                    current_rank: performanceData.classPosition || 0,
                    total_students: performanceData.totalStudentsInClass || 0,
                    grade_point_average: this.calculateGPA(performanceData.averageScore || 0),
                    attendance_percentage: attendancePercentage
                },
                recent_achievements: recentAchievements
            };

            // Get user settings or use defaults
            const userSettings = await this.getUserSettings(userProfile.id);
            const settings: SettingsDto = {
                notifications: {
                    push_notifications: userSettings?.push_notifications ?? true,
                    email_notifications: userSettings?.email_notifications ?? true,
                    assessment_reminders: userSettings?.assessment_reminders ?? true,
                    grade_notifications: userSettings?.grade_notifications ?? true,
                    announcement_notifications: userSettings?.announcement_notifications ?? false
                },
                app_preferences: {
                    dark_mode: userSettings?.dark_mode ?? false,
                    sound_effects: userSettings?.sound_effects ?? true,
                    haptic_feedback: userSettings?.haptic_feedback ?? true,
                    auto_save: userSettings?.auto_save ?? true,
                    offline_mode: userSettings?.offline_mode ?? false
                },
                privacy: {
                    profile_visibility: userSettings?.profile_visibility ?? 'classmates',
                    show_contact_info: userSettings?.show_contact_info ?? true,
                    show_academic_progress: userSettings?.show_academic_progress ?? true,
                    data_sharing: userSettings?.data_sharing ?? false
                }
            };

            // Get support info or use defaults
            const supportInfoData = await this.getSupportInfo(userProfile.school_id);
            const supportInfo: SupportInfoDto = {
                help_center: {
                    faq_count: supportInfoData?.faq_count ?? 25,
                    last_updated: supportInfoData?.last_faq_update ? formatDate(supportInfoData.last_faq_update) : '2024-10-01',
                    categories: supportInfoData?.faq_categories ? JSON.parse(supportInfoData.faq_categories as string) : ['General', 'Academic', 'Technical', 'Account']
                },
                contact_options: {
                    email_support: supportInfoData?.email_support ?? userProfile.school?.school_email ?? 'support@school.edu',
                    phone_support: supportInfoData?.phone_support ?? userProfile.school?.school_phone ?? '+1-800-SCHOOL',
                    live_chat_available: supportInfoData?.live_chat_available ?? true,
                    response_time: supportInfoData?.response_time ?? '24 hours'
                },
                app_info: {
                    version: supportInfoData?.app_version ?? '1.0.0',
                    build_number: supportInfoData?.build_number ?? '100',
                    last_updated: supportInfoData?.last_updated ? formatDate(supportInfoData.last_updated) : '2024-10-01',
                    minimum_ios_version: supportInfoData?.minimum_ios_version ?? '13.0',
                    minimum_android_version: supportInfoData?.minimum_android_version ?? '8.0'
                }
            };

            // Build the complete mobile student profile
            const mobileStudentProfile: MobileStudentProfileDto = {
                general_info: generalInfo,
                academic_info: academicInfo,
                settings: settings,
                support_info: supportInfo
            };
            this.logger.log(colors.blue(`Student display picture: ${JSON.stringify(userProfile.display_picture)}`));

            this.logger.log(colors.green(`Mobile student profile retrieved successfully for: ${user.email}`));
            
            return ResponseHelper.success(
                'Profile retrieved successfully',
                mobileStudentProfile
            );

        } catch (error) {
            this.logger.error(colors.red(`Error fetching mobile student profile: ${error.message}`));
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new Error('Failed to retrieve mobile student profile');
        }
    }

    private async getStudentSubjects(classId: string | null, schoolId: string, academicSessionId: string): Promise<SubjectEnrolledDto[]> {
        try {
            if (!classId) {
                return [];
            }

            // Get subjects for the class and academic session
            const subjects = await this.prisma.subject.findMany({
                where: {
                    classId: classId,
                    schoolId: schoolId,
                    academic_session_id: academicSessionId
                },
                include: {
                    teacherSubjects: {
                        include: {
                            teacher: {
                                select: {
                                    first_name: true,
                                    last_name: true
                                }
                            }
                        }
                    }
                }
            });

            return subjects.map(subject => {
                const teacher = subject.teacherSubjects[0]?.teacher;
                return {
                    id: subject.id,
                    name: subject.name,
                    code: subject.code || '',
                    teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'TBA',
                    status: 'active',
                    credits: 3 // Default credits - could be enhanced later
                };
            });

        } catch (error) {
            this.logger.warn(colors.yellow(`Could not fetch student subjects: ${error.message}`));
            return [];
        }
    }

    private async getStudentAttendancePercentage(userId: string, classId: string | null): Promise<number> {
        try {
            if (!classId) {
                return 0;
            }

            // Get current academic session
            const currentSession = await this.prisma.academicSession.findFirst({
                where: {
                    school_id: (await this.prisma.student.findFirst({
                        where: { user_id: userId },
                        select: { school_id: true }
                    }))?.school_id,
                    is_current: true
                }
            });

            if (!currentSession) {
                return 0;
            }

            // Get total attendance sessions for the class
            const totalSessions = await this.prisma.attendanceSession.count({
                where: {
                    class_id: classId,
                    academic_session_id: currentSession.id
                }
            });

            if (totalSessions === 0) {
                return 0;
            }

            // Get student's present records
            const presentRecords = await this.prisma.attendanceRecord.count({
                where: {
                    student_id: userId,
                    status: 'PRESENT',
                    attendanceSession: {
                        class_id: classId,
                        academic_session_id: currentSession.id
                    }
                }
            });

            return Math.round((presentRecords / totalSessions) * 100 * 10) / 10; // Round to 1 decimal place

        } catch (error) {
            this.logger.warn(colors.yellow(`Could not fetch attendance percentage: ${error.message}`));
            return 0;
        }
    }

    private extractSectionFromClassName(className: string): string {
        // Extract section from class name like "Grade 10A" -> "A"
        const match = className.match(/([A-Z])$/);
        return match ? match[1] : '';
    }

    private calculateGPA(averageScore: number): number {
        // Simple GPA calculation based on percentage
        if (averageScore >= 90) return 4.0;
        if (averageScore >= 80) return 3.7;
        if (averageScore >= 70) return 3.0;
        if (averageScore >= 60) return 2.0;
        if (averageScore >= 50) return 1.0;
        return 0.0;
    }

    private async getUserSettings(userId: string) {
        try {
            return await this.prisma.userSettings.findUnique({
                where: { user_id: userId }
            });
        } catch (error) {
            this.logger.warn(colors.yellow(`Could not fetch user settings: ${error.message}`));
            return null;
        }
    }

    private async getSupportInfo(schoolId: string) {
        try {
            return await this.prisma.supportInfo.findUnique({
                where: { school_id: schoolId }
            });
        } catch (error) {
            this.logger.warn(colors.yellow(`Could not fetch support info: ${error.message}`));
            return null;
        }
    }

    private async getStudentAchievements(userId: string, academicSessionId: string) {
        try {
            const achievements = await this.prisma.studentAchievement.findMany({
                where: {
                    student_id: userId,
                    achievement: {
                        academic_session_id: academicSessionId
                    }
                },
                include: {
                    achievement: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            type: true,
                            icon_url: true,
                            points: true
                        }
                    }
                },
                orderBy: {
                    earned_date: 'desc'
                },
                take: 10 // Limit to recent achievements
            });

            return achievements.map(sa => ({
                id: sa.id,
                title: sa.achievement.title,
                description: sa.achievement.description,
                date_earned: formatDate(sa.earned_date),
                type: sa.achievement.type.toLowerCase(),
                points_earned: sa.points_earned,
                icon_url: sa.achievement.icon_url
            }));
        } catch (error) {
            this.logger.warn(colors.yellow(`Could not fetch student achievements: ${error.message}`));
            return [];
        }
    }
}
