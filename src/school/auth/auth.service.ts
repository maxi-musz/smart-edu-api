import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { SchoolOwnership, SchoolType } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { OnboardDataDto, OnboardSchoolDto, RequestLoginOtpDTO, RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, VerifyEmailOTPDto, VerifyresetOtp } from 'src/school/director/students/dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { sendOnboardingMailToSchoolOwner, sendOnboardingMailToBTechAdmin, sendPasswordResetOtp, sendLoginOtpByMail } from 'src/common/mailer/send-mail';
import { sendEmailVerificationOTP } from 'src/common/mailer/send-email-verification-otp';
import { sendTeacherOnboardEmail, sendStudentOnboardEmail, sendDirectorOnboardEmail } from 'src/common/mailer/send-congratulatory-emails';
import { Prisma } from '@prisma/client';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { OnboardClassesDto, OnboardTeachersDto, OnboardStudentsDto, OnboardDirectorsDto } from 'src/school/director/students/dto/auth.dto';
import { generateOTP } from 'src/shared/helper-functions/otp-generator';
import { BulkOnboardDto, BulkOnboardResponseDto } from 'src/shared/dto/bulk-onboard.dto';
import { ExcelProcessorService } from 'src/shared/services/excel-processor.service';

interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    original_filename: string;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly excelProcessorService: ExcelProcessorService
    ) {}
    
    // Onboard new school
    async onboardSchool(dto: OnboardSchoolDto, files: Express.Multer.File[]) {
        
        console.log(colors.blue('Onboarding a new school...'));
        console.log("email: ", dto.school_email)
        
        const existingSchool = await this.prisma.school.findFirst({
            where: {
                school_email: dto.school_email
            }
        })
    
        if(existingSchool) {
            console.log("School already exists... ")
            throw ResponseHelper.error(
                "School already exists... "
            )
        }

        let uploadedFiles: CloudinaryUploadResult[] = [];
        try {
            const defaultPassword = `${dto.school_name.slice(0, 3).toLowerCase().replace(/\s+/g, '')}/sm/${dto.school_phone.slice(-4)}`;
    
            uploadedFiles = await this.cloudinaryService.uploadToCloudinary(files);

            // hash the password 
            const hashedPassword = await argon.hash(defaultPassword);
            console.log(colors.green("Hashed password: "), hashedPassword);

            // create a new school in the database
            const school = await this.prisma.school.create({
                data: {
                    school_name: dto.school_name.toLowerCase(),
                    school_email: dto.school_email.toLowerCase(),
                    school_phone: dto.school_phone,
                    school_address: dto.school_address.toLowerCase(),
                    school_type: dto.school_type.toLowerCase() as SchoolType,
                    school_ownership: dto.school_ownership.toLowerCase() as SchoolOwnership,
                    // Create and connect documents
                    cac: uploadedFiles[0] ? {
                        create: {
                            secure_url: uploadedFiles[0].secure_url,
                            public_id: uploadedFiles[0].public_id
                        }
                    } : undefined,
                    utility_bill: uploadedFiles[1] ? {
                        create: {
                            secure_url: uploadedFiles[1].secure_url,
                            public_id: uploadedFiles[1].public_id
                        }
                    } : undefined,
                    tax_clearance: uploadedFiles[2] ? {
                        create: {
                            secure_url: uploadedFiles[2].secure_url,
                            public_id: uploadedFiles[2].public_id
                        }
                    } : undefined,
                    status: 'pending'
                }
            });

            // create new user also with email and hashed password
            // Check if user already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.school_email.toLowerCase() }
            });

            if (existingUser) {
                throw new Error('A user with this email already exists. Please use a different email address.');
            }

            await this.prisma.user.create({
                data: {
                    email: dto.school_email.toLowerCase(),
                    password: hashedPassword,
                    role: "school_director", 
                    school_id: school.id,
                    first_name: "School",
                    last_name: "Director",
                    phone_number: dto.school_phone
                }
            });

            // Try to send emails, but don't fail the whole operation if they fail
            try {
                // send mail to school owner
                await sendOnboardingMailToSchoolOwner({
                    school_name: dto.school_name,
                    school_email: dto.school_email,
                    school_phone: dto.school_phone,
                    school_address: dto.school_address,
                    school_type: dto.school_type,
                    school_ownership: dto.school_ownership,
                    documents: {
                        cac: uploadedFiles[0]?.secure_url || null,
                        utility_bill: uploadedFiles[1]?.secure_url || null,
                        tax_clearance: uploadedFiles[2]?.secure_url || null,
                    },
                });

                // send mail to admin
                await sendOnboardingMailToBTechAdmin({
                    school_name: dto.school_name,
                    school_email: dto.school_email,
                    school_phone: dto.school_phone,
                    school_address: dto.school_address,
                    school_type: dto.school_type,
                    school_ownership: dto.school_ownership,
                    documents: {
                        cac: uploadedFiles[0]?.secure_url || null,
                        utility_bill: uploadedFiles[1]?.secure_url || null,
                        tax_clearance: uploadedFiles[2]?.secure_url || null,
                    },
                    defaultPassword: defaultPassword,
                });
            } catch (emailError) {
                // Log the email error but don't fail the operation
                console.log(colors.yellow("Warning: Failed to send emails: "), emailError);
                // You might want to store this error in a log or database for later retry
            }

            const formatted_response = {
                id: school.id,
                school_name: school.school_name,
                school_email: school.school_email,
                school_address: school.school_address,
                documents: {
                    cac: uploadedFiles[0]?.secure_url || null,
                    utility_bill: uploadedFiles[1]?.secure_url || null,
                    tax_clearance: uploadedFiles[2]?.secure_url || null,
                },
                created_at: formatDate(school.createdAt),
                updated_at: formatDate(school.updatedAt),
            };

            // return the newly created school
            console.log(colors.magenta("New school created successfully!"));
            return ResponseHelper.created('School onboarded successfully', formatted_response);
            
        } catch (error) {
            console.log(colors.red("Error creating new school: "), error);
            
            // Only clean up files if the error occurred during school/user creation
            // Not during email sending
            if (uploadedFiles.length > 0 && !error.message?.includes('No recipients defined')) {
                console.log(colors.yellow("Cleaning up uploaded files due to error..."));
                await this.cloudinaryService.cleanupUploadedFiles(uploadedFiles);
            }
            
            return ResponseHelper.error(
                "Error creating new school",
                error
            );
        }
    }

    // Direcotr login with OTP
    async directorRequestLoginOtp(dto: RequestLoginOtpDTO) {

        console.log(colors.cyan("Director requesting login otp..."))

        try {
            
            // Check if user exists
            const user = await this.prisma.school.findUnique({
                where: { school_email: dto.email },
            });
    
            if (!user) {
                console.log(colors.red("❌ Admin User not found"));
                throw new NotFoundException("Admin User not found");
            }
    
            const otp = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry
    
            // Update OTP for the user
            await this.prisma.user.update({
                where: { email: dto.email },
                data: {
                    otp,
                    otp_expires_at: otpExpiresAt,
                },
            });

            await sendLoginOtpByMail({ email: dto.email, otp })
            console.log(colors.magenta(`Login otp: ${otp} sucessfully sent to: ${dto.email}`))

            return new ApiResponse(
                true,
                "Otp successfully sent"
            )

        } catch (error) {
            console.log(colors.red("Error sigining in"))
            throw new InternalServerErrorException(
                `Failed to process OTP request: ${error instanceof Error ? error.message : String(error)}`
            ); 
        }
    }

    // Verify director login OTP
    async verifyEmailOTPAndSignIn(dto: VerifyEmailOTPDto) {

        console.log(colors.cyan(`Verifying email: ${dto.email} with OTP: ${dto.otp}`));
    
        try {
            // Find user with matching email and OTP
            const user = await this.prisma.user.findFirst({
                where: { email: dto.email, otp: dto.otp },
            });
    
            // Check if user exists and OTP is valid
            if (!user || !user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
                console.log(colors.red("Invalid or expired OTP provided"));
                throw new BadRequestException("Invalid or expired OTP provided");
            }
    
            // Update `is_email_verified` and clear OTP
            const updatedUser = await this.prisma.user.update({
                where: { email: dto.email },
                data: {
                    is_email_verified: true,
                    otp: "",
                    otp_expires_at: null,
                },
            });
    
            console.log(colors.magenta("Email address successfully verified"));

            const { access_token, refresh_token } = await this.signToken(updatedUser.id, updatedUser.email)

            const formatted_response = {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    first_name: updatedUser.first_name,
                    last_name: updatedUser.last_name,
                    phone_number: updatedUser.phone_number,
                    is_email_verified: updatedUser.is_email_verified,
                    role: updatedUser.role,
                    school_id: updatedUser.school_id,
                    created_at: formatDate(updatedUser.createdAt),
                    updated_at: formatDate(updatedUser.updatedAt),
                }
                
            }

            // Sign in the user and return tokens
            return ResponseHelper.success(
                "Login successful",
                {
                    access_token,
                    refresh_token,
                    ...formatted_response
                }
            );
        } catch (error) {
            
            console.error("Error verifying email:", error);
    
            if (error instanceof HttpException) {
                throw error; // Re-throw known exceptions
            }
    
            throw new InternalServerErrorException("Email verification failed");
        }
    }

    async signToken(
        userId: string,
        email: string
    ): Promise<{access_token: string, refresh_token: string}> {
        // console.log(colors.cyan('Signing token for:'), { userId, email });
        
        const payload = {
            sub: userId,
            email
        };

        const secret = this.config.get('JWT_SECRET');
        const accessTokenExpiresIn = this.config.get('JWT_EXPIRES_IN') || '15m'; // Shorter expiry for access token
        const refreshTokenExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d'; // Longer expiry for refresh token
        
        // console.log(colors.yellow('Token config:'), { secret, accessTokenExpiresIn, refreshTokenExpiresIn });

        try {
            // Generate access token
            const accessToken = await this.jwt.signAsync(payload, {
                expiresIn: accessTokenExpiresIn,
                secret: secret
            });

            // Generate refresh token
            const refreshToken = await this.jwt.signAsync(payload, {
                expiresIn: refreshTokenExpiresIn,
                secret: secret
            });

            // console.log(colors.green('Tokens generated successfully'));
            
            return {
                access_token: accessToken,
                refresh_token: refreshToken
            }
        } catch (error) {
            console.log(colors.red('Error generating tokens:'), error);
            throw error;
        }
    }

    async signIn(payload: SignInDto) {
        console.log(colors.blue("Signing in user..."));

        try {
            // find the user by email
            const existing_user = await this.prisma.user.findUnique({
                where: {
                    email: payload.email,
                }
            });

            // if user does not exist, return error
            if (!existing_user) {
                console.log(colors.red("User not found"));
                throw new NotFoundException({
                    success: false,
                    message: "User not found",
                    error: null,
                    statusCode: 404
                });
            }

            // if user exists, compare the password with the hashed password
            const passwordMatches = await argon.verify(existing_user.password, payload.password);

            // if password matches, return success response with user data
            if(!passwordMatches) {
                console.log(colors.red("Password does not match"));
                throw new BadRequestException({
                    success: false,
                    message: "Passwords do not match",
                    error: null,
                    statusCode: 400
                });
            }

            const formatted_user = {
                id: existing_user.id,
                email: existing_user.email,
                first_name: existing_user.first_name,
                last_name: existing_user.last_name,
                phone_number: existing_user.phone_number,
                is_email_verified: existing_user.is_email_verified,
                role: existing_user.role,
                school_id: existing_user.school_id,
                created_at: formatDate(existing_user.createdAt),
                updated_at: formatDate(existing_user.updatedAt)
            }

            // Define roles that require OTP verification
            const rolesRequiringOtp = ['admin', 'school_director', 'teacher'];
            
            // Check if user role requires OTP verification
            if (rolesRequiringOtp.includes(existing_user.role.toLowerCase())) {
                console.log(colors.yellow(`Role ${existing_user.role} requires OTP verification`));
                
                // Send OTP for roles that require verification
                await this.directorRequestLoginOtp({ email: existing_user.email });
                
                return ResponseHelper.success(
                    "OTP verification required for this role. Please check your email for the OTP.",
                    formatted_user
                );
            }
            
            // For roles that don't require OTP, check if email is verified
            if(!existing_user.is_email_verified) {
                console.log(colors.yellow("Email not verified, sending otp to verify email address"));
                
                await this.directorRequestLoginOtp({ email: existing_user.email });
                
                return ResponseHelper.success(
                    "Email not verified, please verify your email address with the otp sent to your email address",
                    formatted_user
                );
            }

            // if password matches and all checks pass, return success response with tokens
            console.log(colors.green("User signed in successfully!"));
            const { access_token, refresh_token } = await this.signToken(existing_user.id, existing_user.email);
            
            return ResponseHelper.success(
                "User signed in successfully",
                {
                    access_token,
                    refresh_token,
                    user: formatted_user
                }
            );
            
        } catch (error) {
            console.log(colors.red("Error signing in: "), error);
            
            // If it's already a HttpException, just rethrow it
            if (error instanceof HttpException) {
                throw error;
            }
            
            // For other errors, wrap them in a proper response
            throw new InternalServerErrorException({
                success: false,
                message: "Error signing in",
                error: error.message,
                statusCode: 500
            });
        }
    }



    //
    async requestPasswordResetOTP(payload: RequestPasswordResetDTO) {
        console.log(colors.blue("Requesting password reset otp..."))

        try {
            const existing_user = await this.prisma.user.findFirst({
                where: {
                    email: payload.email
                }
            })

            // if user not found
            if(!existing_user) {
                console.log(colors.red("User not found..."))
                throw new NotFoundException("User not found");
            }

            // generate 6-character alphanumeric OTP
            const otp = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            // Update OTP for the user
            await this.prisma.user.update({
                where: {
                    id: existing_user.id
                },
                data: {
                    otp: otp,
                    otp_expires_at: otpExpiresAt,
                } as Prisma.UserUpdateInput
            });

            // TODO: Send OTP via email
            await sendPasswordResetOtp({
                email: payload.email,
                otp
            })

            console.log(colors.magenta(`OTP ${otp} successfully sent to ${payload.email}`));
            
            return ResponseHelper.success(
                "OTP sent successfully",
                { email: payload.email }
            );
            
        } catch (error) {
            console.log(colors.red("Error requesting password reset: "), error);
            throw error;
        }
    }

    // Verify director login OTP
    async verifyResetPasswordOTP(dto: VerifyresetOtp) {
        console.log(colors.cyan(`Verifying email: ${dto.email} with OTP: ${dto.otp}`));

        try {
            // Find user with matching email and OTP
            const user = await this.prisma.user.findFirst({
                where: { email: dto.email, otp: dto.otp },
            });

            // Check if user exists and OTP is valid
            if (!user || !user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
                console.log(colors.red("Invalid or expired OTP provided"));
                
                // Clear the OTP if user exists but OTP is invalid/expired
                if (user) {
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            otp: "",
                            otp_expires_at: null,
                            is_otp_verified: false
                        },
                    });
                }
                
                throw new BadRequestException("Invalid or expired OTP provided");
            }

            // Update user with verified OTP and clear OTP fields
            const updatedUser = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    is_otp_verified: true,
                    otp: "",
                    otp_expires_at: null,
                },
            });

            // Verify the update was successful
            if (updatedUser.otp !== "" || updatedUser.otp_expires_at !== null) {
                console.log(colors.red("Failed to clear OTP fields"));
                // throw new InternalServerErrorException("Failed to clear OTP fields");
            }

            console.log(colors.magenta("OTP successfully verified"));

            return new ApiResponse(true, "OTP verified successfully, Proceed and change your password");
        } catch (error) {
            console.error("Error verifying OTP:", error);

            if (error instanceof HttpException) {
                throw error; // Re-throw known exceptions
            }

            throw new InternalServerErrorException("OTP verification failed");
        }
    }

    async resetPassword(dto: ResetPasswordDTO) {
        console.log(colors.cyan("Resetting password..."))

        try {

            // compare new_password and compare_password
            if(dto.new_password !== dto.confirm_password) {
                console.log(colors.red("New password and confirm Password do not match"))
                throw new BadRequestException({
                    success: false,
                    message: "New password and confirm Password do not match",
                    error: null,
                    statusCode: 400
                });
            }

            const existingUser = await this.prisma.user.findFirst({
                where: { 
                    email: dto.email,
                    is_otp_verified: true
                }
            });

            if (!existingUser || !existingUser.is_otp_verified) {
                throw new BadRequestException("User not found or OTP not verified");
            }

            // Hash the new password
            const hashedPassword = await argon.hash(dto.new_password);

            // Update the password
            await this.prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    is_otp_verified: false // Reset OTP verification status
                }
            });

            return new ApiResponse(true, "Password reset successfully");
        } catch (error) {
            console.error("Error resetting password:", error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Failed to reset password");
        }
    }

    /////////////////////////////////////////////////////////// director onboarding 
    async onboardClasses(dto: OnboardClassesDto, user: any) {
        console.log(colors.cyan("Onboarding classes..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email}
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the classes already exist in the school
            const existingClasses = await this.prisma.class.findMany({
                where: {
                    name: {
                        in: dto.class_names
                    },
                    schoolId: existingSchool.id
                }
            });

            if (existingClasses.length > 0) {
                console.log(colors.red("Some classes already exist in this school"));
                throw new BadRequestException({
                    success: false,
                    message: "Some classes already exist in this school",
                    error: existingClasses.map(c => c.name),
                    statusCode: 400
                });
            }

            // Create the classes
            await this.prisma.class.createMany({
                data: dto.class_names.map(className => ({
                    name: className.toLowerCase().replace(/\s+/g, ''),
                    schoolId: existingSchool.id
                }))
            });

            // Fetch the created classes
            const createdClasses = await this.prisma.class.findMany({
                where: {
                    schoolId: existingSchool.id,
                    name: {
                        in: dto.class_names.map(name => name.toLowerCase().replace(/\s+/g, ''))
                    }
                }
            });

            console.log(colors.green("Classes created successfully!"));

            const formatted_response = createdClasses.map(cls => ({
                id: cls.id,
                name: cls.name,
                school_id: cls.schoolId,
                class_teacher_id: cls.classTeacherId || null,
                created_at: formatDate(cls.createdAt),
                updated_at: formatDate(cls.updatedAt)
            }));

            return ResponseHelper.success(
                "Classes created successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error creating class: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error creating class",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardTeachers(dto: OnboardTeachersDto, user: any) {
        console.log(colors.cyan("Onboarding teachers..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the emails already exist
            const existingEmails = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                    }
                }
            });

            if (existingEmails.length > 0) {
                console.log(colors.red("Some emails already exist in the system"));
                throw new BadRequestException({
                    success: false,
                    message: "Some emails already exist in the system",
                    error: existingEmails.map(u => u.email),
                    statusCode: 400
                });
            }

            // Generate strong passwords for each teacher
            const teachersWithPasswords = await Promise.all(
                dto.teachers.map(async (teacher) => {
                    const defaultPassword = `${teacher.first_name.slice(0, 3).toLowerCase()}${teacher.phone_number.slice(-4)}`;
                    const hashedPassword = await argon.hash(defaultPassword);
                    
                    return {
                        ...teacher,
                        password: hashedPassword,
                        defaultPassword // Store the unhashed password temporarily for email
                    };
                })
            );

            // Create the teachers
            const createdTeachers = await this.prisma.user.createMany({
                data: teachersWithPasswords.map(teacher => ({
                    email: teacher.email.toLowerCase(),
                    password: teacher.password,
                    role: "teacher",
                    school_id: existingSchool.id,
                    first_name: teacher.first_name.toLowerCase(),
                    last_name: teacher.last_name.toLowerCase(),
                    phone_number: teacher.phone_number
                }))
            });

            // Fetch the created teachers
            const teachers = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                    }
                }
            });

            console.log(colors.green("Teachers created successfully!"));

            // Send congratulatory emails to all teachers
            const emailPromises = teachers.map(async (teacher) => {
                try {
                    await sendTeacherOnboardEmail({
                        firstName: teacher.first_name,
                        lastName: teacher.last_name,
                        email: teacher.email,
                        phone: teacher.phone_number,
                        schoolName: existingSchool.school_name
                    });
                } catch (emailError) {
                    console.log(colors.yellow(`⚠️ Failed to send email to ${teacher.email}: ${emailError.message}`));
                }
            });

            // Wait for all emails to be sent (but don't fail if some emails fail)
            await Promise.allSettled(emailPromises);

            const formatted_response = teachers.map(teacher => ({
                id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                email: teacher.email,
                phone_number: teacher.phone_number,
                role: teacher.role,
                school_id: teacher.school_id,
                created_at: formatDate(teacher.createdAt),
                updated_at: formatDate(teacher.updatedAt)
            }));

            return ResponseHelper.success(
                "Teachers onboarded successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error onboarding teachers: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error onboarding teachers",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardStudents(dto: OnboardStudentsDto, user: any) {
        console.log(colors.cyan("Onboarding students..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the emails already exist
            const existingEmails = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.students.map(student => student.email.toLowerCase())
                    }
                }
            });

            if (existingEmails.length > 0) {
                console.log(colors.red("Some emails already exist in the system"));
                throw new BadRequestException({
                    success: false,
                    message: "Some emails already exist in the system",
                    error: existingEmails.map(u => u.email),
                    statusCode: 400
                });
            }

            // Get all classes for the school
            const schoolClasses = await this.prisma.class.findMany({
                where: { schoolId: existingSchool.id }
            });

            // Validate that all default classes exist
            const requestedClasses = dto.students.map(student => 
                student.default_class.toLowerCase().replace(/\s+/g, '')
            );
            
            const invalidClasses = requestedClasses.filter(
                className => !schoolClasses.some(c => c.name === className)
            );

            if (invalidClasses.length > 0) {
                console.log(colors.red("Some selected classes do not exist in the school"));
                throw new BadRequestException({
                    success: false,
                    message: "Some classes do not exist in the school",
                    error: invalidClasses,
                    statusCode: 400
                });
            }

            // Generate default password for each student (first 3 letters of first name + last 4 digits of phone)
            const studentsWithPasswords = await Promise.all(
                dto.students.map(async (student) => {
                    const defaultPassword = `${student.first_name.slice(0, 3).toLowerCase()}${student.phone_number.slice(-4)}`;
                    const hashedPassword = await argon.hash(defaultPassword);
                    
                    return {
                        ...student,
                        password: hashedPassword,
                        defaultPassword // Store the unhashed password temporarily for email
                    };
                })
            );

            // Create the students
            const createdStudents = await this.prisma.user.createMany({
                data: studentsWithPasswords.map(student => ({
                    email: student.email.toLowerCase(),
                    password: student.password,
                    role: "student",
                    school_id: existingSchool.id,
                    first_name: student.first_name.toLowerCase(),
                    last_name: student.last_name.toLowerCase(),
                    phone_number: student.phone_number
                }))
            });

            // Fetch the created students
            const students = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.students.map(student => student.email.toLowerCase())
                    }
                }
            });

            // Enroll students in their default classes
            await Promise.all(
                students.map(async (student) => {
                    const studentData = dto.students.find(s => 
                        s.email.toLowerCase() === student.email.toLowerCase()
                    );
                    if (studentData) {
                        const classId = schoolClasses.find(c => 
                            c.name === studentData.default_class.toLowerCase().replace(/\s+/g, '')
                        )?.id;
                        if (classId) {
                            await this.prisma.user.update({
                                where: { id: student.id },
                                data: {
                                    classesEnrolled: {
                                        connect: { id: classId }
                                    }
                                }
                            });
                        }
                    }
                })
            );

            console.log(colors.green("Students created and enrolled successfully!"));

            // Send congratulatory emails to all students
            const emailPromises = students.map(async (student) => {
                try {
                    const studentData = dto.students.find(s => 
                        s.email.toLowerCase() === student.email.toLowerCase()
                    );
                    const className = studentData?.default_class || 'Unassigned';
                    
                    await sendStudentOnboardEmail({
                        firstName: student.first_name,
                        lastName: student.last_name,
                        email: student.email,
                        phone: student.phone_number,
                        schoolName: existingSchool.school_name,
                        className: className
                    });
                } catch (emailError) {
                    console.log(colors.yellow(`⚠️ Failed to send email to ${student.email}: ${emailError.message}`));
                }
            });

            // Wait for all emails to be sent (but don't fail if some emails fail)
            await Promise.allSettled(emailPromises);

            const formatted_response = students.map(student => ({
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email,
                phone_number: student.phone_number,
                role: student.role,
                school_id: student.school_id,
                created_at: formatDate(student.createdAt),
                updated_at: formatDate(student.updatedAt)
            }));

            return ResponseHelper.success(
                "Students onboarded successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error onboarding students: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error onboarding students",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardDirectors(dto: OnboardDirectorsDto, user: any) {
        console.log(colors.cyan("Onboarding directors..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the emails already exist
            const existingEmails = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.directors.map(director => director.email.toLowerCase())
                    }
                }
            });

            if (existingEmails.length > 0) {
                console.log(colors.red("Some emails already exist in the system"));
                throw new BadRequestException({
                    success: false,
                    message: "Some emails already exist in the system",
                    error: existingEmails.map(u => u.email),
                    statusCode: 400
                });
            }

            // Generate default password for each director (first 3 letters of first name + last 4 digits of phone)
            const directorsWithPasswords = await Promise.all(
                dto.directors.map(async (director) => {
                    const defaultPassword = `${director.first_name.slice(0, 3).toLowerCase()}${director.phone_number.slice(-4)}`;
                    const hashedPassword = await argon.hash(defaultPassword);
                    
                    return {
                        ...director,
                        password: hashedPassword,
                        defaultPassword // Storing the unhashed password temporarily for email
                    };
                })
            );

            // Create the directors
            const createdDirectors = await this.prisma.user.createMany({
                data: directorsWithPasswords.map(director => ({
                    email: director.email.toLowerCase(),
                    password: director.password,
                    role: "school_director",
                    school_id: existingSchool.id,
                    first_name: director.first_name.toLowerCase(),
                    last_name: director.last_name.toLowerCase(),
                    phone_number: director.phone_number
                }))
            });

            // Fetch the created directors
            const directors = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.directors.map(director => director.email.toLowerCase())
                    }
                }
            });

            console.log(colors.green("Directors created successfully!"));

            // Send congratulatory emails to all directors
            const emailPromises = directors.map(async (director) => {
                try {
                    await sendDirectorOnboardEmail({
                        firstName: director.first_name,
                        lastName: director.last_name,
                        email: director.email,
                        phone: director.phone_number,
                        schoolName: existingSchool.school_name
                    });
                } catch (emailError) {
                    console.log(colors.yellow(`⚠️ Failed to send email to ${director.email}: ${emailError.message}`));
                }
            });

            // Wait for all emails to be sent (but don't fail if some emails fail)
            await Promise.allSettled(emailPromises);

            const formatted_response = directors.map(director => ({
                id: director.id,
                first_name: director.first_name,
                last_name: director.last_name,
                email: director.email,
                phone_number: director.phone_number,
                role: director.role,
                school_id: director.school_id,
                created_at: formatDate(director.createdAt),
                updated_at: formatDate(director.updatedAt)
            }));

            return ResponseHelper.success(
                "Directors onboarded successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error onboarding directors: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error onboarding directors",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardData(dto: OnboardDataDto, user: any) {
        console.log(colors.cyan("Starting comprehensive onboarding process..."));

        console.log("user: ", user)

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Step 1: Database Transaction (Fast & Reliable)
            const { response, createdUsers } = await this.prisma.$transaction(async (prisma) => {
                const response: any = {};
                const createdUsers: any = { teachers: [], students: [], directors: [] };

                // 1. Handle Classes
                if (dto.class_names && dto.class_names.length > 0) {
                    console.log(colors.cyan("Processing classes..."));
                    
                    // Check if any of the classes already exist
                    const existingClasses = await prisma.class.findMany({
                        where: {
                            name: {
                                in: dto.class_names.map(name => name.toLowerCase().replace(/\s+/g, ''))
                            },
                            schoolId: existingSchool.id
                        }
                    });

                    if (existingClasses.length > 0) {
                        console.log(colors.red("Some classes already exist in this school"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some classes already exist in this school",
                            error: existingClasses.map(c => c.name),
                            statusCode: 400
                        });
                    }

                    // Create the classes
                    await prisma.class.createMany({
                        data: dto.class_names.map(className => ({
                            name: className.toLowerCase().replace(/\s+/g, ''),
                            schoolId: existingSchool.id
                        }))
                    });

                    // Fetch created classes
                    const createdClasses = await prisma.class.findMany({
                        where: {
                            schoolId: existingSchool.id,
                            name: {
                                in: dto.class_names.map(name => name.toLowerCase().replace(/\s+/g, ''))
                            }
                        }
                    });

                    response.classes = createdClasses.map(cls => ({
                        id: cls.id,
                        name: cls.name,
                        school_id: cls.schoolId,
                        class_teacher_id: cls.classTeacherId || null,
                        created_at: formatDate(cls.createdAt),
                        updated_at: formatDate(cls.updatedAt)
                    }));
                }

                // 2. Handle Teachers
                if (dto.teachers && dto.teachers.length > 0) {
                    console.log(colors.cyan("Processing teachers..."));
                    
                    // Check if any emails already exist
                    const existingEmails = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                            }
                        }
                    });

                    if (existingEmails.length > 0) {
                        console.log(colors.red("Some teacher emails already exist in the system"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some teacher emails already exist in the system",
                            error: existingEmails.map(u => u.email),
                            statusCode: 400
                        });
                    }

                    // Generate passwords and create teachers
                    const teachersWithPasswords = await Promise.all(
                        dto.teachers.map(async (teacher) => {
                            const defaultPassword = `${teacher.first_name.slice(0, 3).toLowerCase()}${teacher.phone_number.slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);
                            return {
                                ...teacher,
                                password: hashedPassword,
                                defaultPassword
                            };
                        })
                    );

                    await prisma.user.createMany({
                        data: teachersWithPasswords.map(teacher => ({
                            email: teacher.email.toLowerCase(),
                            password: teacher.password,
                            role: "teacher",
                            school_id: existingSchool.id,
                            first_name: teacher.first_name.toLowerCase(),
                            last_name: teacher.last_name.toLowerCase(),
                            phone_number: teacher.phone_number
                        }))
                    });

                    // Fetch created teachers
                    const teachers = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                            }
                        }
                    });

                    // Store teachers for email sending later
                    createdUsers.teachers = teachers;

                    response.teachers = teachers.map(teacher => ({
                        id: teacher.id,
                        first_name: teacher.first_name,
                        last_name: teacher.last_name,
                        email: teacher.email,
                        phone_number: teacher.phone_number,
                        role: teacher.role,
                        school_id: teacher.school_id,
                        created_at: formatDate(teacher.createdAt),
                        updated_at: formatDate(teacher.updatedAt)
                    }));
                }

                // 3. Handle Students
                if (dto.students && dto.students.length > 0) {
                    console.log(colors.cyan("Processing students..."));
                    
                    // Check if any emails already exist
                    const existingEmails = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.students.map(student => student.email.toLowerCase())
                            }
                        }
                    });

                    if (existingEmails.length > 0) {
                        console.log(colors.red("Some student emails already exist in the system"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some student emails already exist in the system",
                            error: existingEmails.map(u => u.email),
                            statusCode: 400
                        });
                    }

                    // Get all classes for validation
                    const schoolClasses = await prisma.class.findMany({
                        where: { schoolId: existingSchool.id }
                    });

                    // Validate that all default classes exist
                    const requestedClasses = dto.students.map(student => 
                        student.default_class.toLowerCase().replace(/\s+/g, '')
                    );
                    
                    const invalidClasses = requestedClasses.filter(
                        className => !schoolClasses.some(c => c.name === className)
                    );

                    if (invalidClasses.length > 0) {
                        console.log(colors.red("Some selected classes do not exist in the school"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some selected classes do not exist in the school",
                            error: invalidClasses,
                            statusCode: 400
                        });
                    }

                    // Generate passwords and create students
                    const studentsWithPasswords = await Promise.all(
                        dto.students.map(async (student) => {
                            const defaultPassword = `${student.first_name.slice(0, 3).toLowerCase()}${student.phone_number.slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);
                            return {
                                ...student,
                                password: hashedPassword,
                                defaultPassword
                            };
                        })
                    );

                    await prisma.user.createMany({
                        data: studentsWithPasswords.map(student => ({
                            email: student.email.toLowerCase(),
                            password: student.password,
                            role: "student",
                            school_id: existingSchool.id,
                            first_name: student.first_name.toLowerCase(),
                            last_name: student.last_name.toLowerCase(),
                            phone_number: student.phone_number
                        }))
                    });

                    // Fetch created students
                    const students = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.students.map(student => student.email.toLowerCase())
                            }
                        }
                    });

                    // Enroll students in their default classes
                    await Promise.all(
                        students.map(async (student) => {
                            const studentData = dto.students?.find(s => 
                                s.email.toLowerCase() === student.email.toLowerCase()
                            );
                            if (studentData) {
                                const classId = schoolClasses.find(c => 
                                    c.name === studentData.default_class.toLowerCase().replace(/\s+/g, '')
                                )?.id;
                                if (classId) {
                                    await prisma.user.update({
                                        where: { id: student.id },
                                        data: {
                                            classesEnrolled: {
                                                connect: { id: classId }
                                            }
                                        }
                                    });
                                }
                            }
                        })
                    );

                    // Store students for email sending later
                    createdUsers.students = students;

                    response.students = students.map(student => ({
                        id: student.id,
                        first_name: student.first_name,
                        last_name: student.last_name,
                        email: student.email,
                        phone_number: student.phone_number,
                        role: student.role,
                        school_id: student.school_id,
                        created_at: formatDate(student.createdAt),
                        updated_at: formatDate(student.updatedAt)
                    }));
                }

                // 4. Handle Directors
                if (dto.directors && dto.directors.length > 0) {
                    console.log(colors.cyan("Processing directors..."));
                    
                    // Check if any emails already exist
                    const existingEmails = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.directors.map(director => director.email.toLowerCase())
                            }
                        }
                    });

                    if (existingEmails.length > 0) {
                        console.log(colors.red("Some director emails already exist in the system"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some director emails already exist in the system",
                            error: existingEmails.map(u => u.email),
                            statusCode: 400
                        });
                    }

                    // Generate passwords and create directors
                    const directorsWithPasswords = await Promise.all(
                        dto.directors.map(async (director) => {
                            const defaultPassword = `${director.first_name.slice(0, 3).toLowerCase()}${director.phone_number.slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);
                            return {
                                ...director,
                                password: hashedPassword,
                                defaultPassword
                            };
                        })
                    );

                    await prisma.user.createMany({
                        data: directorsWithPasswords.map(director => ({
                            email: director.email.toLowerCase(),
                            password: director.password,
                            role: "school_director",
                            school_id: existingSchool.id,
                            first_name: director.first_name.toLowerCase(),
                            last_name: director.last_name.toLowerCase(),
                            phone_number: director.phone_number
                        }))
                    });

                    // Fetch created directors
                    const directors = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.directors.map(director => director.email.toLowerCase())
                            }
                        }
                    });

                    // Store directors for email sending later
                    createdUsers.directors = directors;

                    response.directors = directors.map(director => ({
                        id: director.id,
                        first_name: director.first_name,
                        last_name: director.last_name,
                        email: director.email,
                        phone_number: director.phone_number,
                        role: director.role,
                        school_id: director.school_id,
                        created_at: formatDate(director.createdAt),
                        updated_at: formatDate(director.updatedAt)
                    }));
                }

                console.log(colors.green("Database operations completed successfully!"));

                return { response, createdUsers };
            }, {
                maxWait: 5000,  // Reduced timeout for database operations
                timeout: 15000   // Reduced timeout for database operations
            });

            // Step 2: Email Sending (Separate from database transaction)
            console.log(colors.cyan("Sending congratulatory emails..."));
            
            const emailPromises: Promise<void>[] = [];

            // Send teacher emails
            if (createdUsers.teachers.length > 0) {
                const teacherEmailPromises = createdUsers.teachers.map(async (teacher) => {
                    try {
                        await sendTeacherOnboardEmail({
                            firstName: teacher.first_name,
                            lastName: teacher.last_name,
                            email: teacher.email,
                            phone: teacher.phone_number,
                            schoolName: existingSchool?.school_name || 'Unknown School'
                        });
                        console.log(colors.green(`✅ Teacher email sent to: ${teacher.email}`));
                    } catch (emailError) {
                        console.log(colors.yellow(`⚠️ Failed to send teacher email to ${teacher.email}: ${emailError.message}`));
                    }
                });
                emailPromises.push(...teacherEmailPromises);
            }

            // Send student emails
            if (createdUsers.students.length > 0) {
                const studentEmailPromises = createdUsers.students.map(async (student) => {
                    try {
                        const studentData = dto.students?.find(s => 
                            s.email.toLowerCase() === student.email.toLowerCase()
                        );
                        const className = studentData?.default_class || 'Unassigned';
                        
                        await sendStudentOnboardEmail({
                            firstName: student.first_name,
                            lastName: student.last_name,
                            email: student.email,
                            phone: student.phone_number,
                            schoolName: existingSchool?.school_name || 'Unknown School',
                            className: className
                        });
                        console.log(colors.green(`✅ Student email sent to: ${student.email}`));
                    } catch (emailError) {
                        console.log(colors.yellow(`⚠️ Failed to send student email to ${student.email}: ${emailError.message}`));
                    }
                });
                emailPromises.push(...studentEmailPromises);
            }

            // Send director emails
            if (createdUsers.directors.length > 0) {
                const directorEmailPromises = createdUsers.directors.map(async (director) => {
                    try {
                        await sendDirectorOnboardEmail({
                            firstName: director.first_name,
                            lastName: director.last_name,
                            email: director.email,
                            phone: director.phone_number,
                            schoolName: existingSchool?.school_name || 'Unknown School'
                        });
                        console.log(colors.green(`✅ Director email sent to: ${director.email}`));
                    } catch (emailError) {
                        console.log(colors.yellow(`⚠️ Failed to send director email to ${director.email}: ${emailError.message}`));
                    }
                });
                emailPromises.push(...directorEmailPromises);
            }

            // Send all emails in parallel (non-blocking)
            if (emailPromises.length > 0) {
                await Promise.allSettled(emailPromises);
                console.log(colors.magenta(`📧 Sent ${emailPromises.length} congratulatory emails`));
            }

            console.log(colors.green("Comprehensive onboarding completed successfully!"));

            return ResponseHelper.success(
                "Data onboarded successfully",
                response
            );

        } catch (error) {
            console.log(colors.red("Error in comprehensive onboarding: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error in comprehensive onboarding",
                error: error.message,
                statusCode: 500
            });
        }
    }

    /**
     * Bulk onboard users from Excel file
     * @param file - The uploaded Excel file
     * @param user - The authenticated user
     * @returns Bulk onboarding response
     */
    async bulkOnboardFromExcel(file: Express.Multer.File, user: any): Promise<BulkOnboardResponseDto> {
        try {
            console.log(colors.cyan("Starting bulk onboarding from Excel file..."));
            
            // Get the school from the authenticated user
            const existingSchool = await this.prisma.school.findFirst({
                where: {
                    school_email: user.email
                }
            });

            if (!existingSchool) {
                throw new BadRequestException({
                    success: false,
                    message: "School not found",
                    statusCode: 400
                });
            }

            // Process the Excel file
            const processedData = await this.excelProcessorService.processExcelFile(file);
            
            console.log(colors.green(`✅ Processed ${processedData.length} rows from Excel file`));

            // Step 1: Database Transaction (Fast & Reliable)
            const { response, createdUsers, errors } = await this.prisma.$transaction(async (prisma) => {
                const response: any = {};
                const createdUsers: any = { teachers: [], students: [], directors: [] };
                const errors: Array<{ row: number; email: string; error: string }> = [];

                // Group data by role
                const teachers = processedData.filter(row => row['Role'] === 'teacher');
                const students = processedData.filter(row => row['Role'] === 'student');
                const directors = processedData.filter(row => row['Role'] === 'school_director');

                // Process teachers
                if (teachers.length > 0) {
                    console.log(colors.cyan(`Processing ${teachers.length} teachers...`));
                    
                    for (let i = 0; i < teachers.length; i++) {
                        const teacher = teachers[i];
                        const rowNumber = processedData.findIndex(row => 
                            row['Email'] === teacher['Email']
                        ) + 2; // +2 because Excel rows start from 1 and we have header

                        try {
                            // Check if email already exists
                            const existingUser = await prisma.user.findFirst({
                                where: { email: teacher['Email'] }
                            });

                            if (existingUser) {
                                errors.push({
                                    row: rowNumber,
                                    email: teacher['Email'],
                                    error: 'Email already exists in the system'
                                });
                                continue;
                            }

                            // Generate password and create teacher
                            const defaultPassword = `${teacher['First Name'].slice(0, 3).toLowerCase()}${teacher['Phone'].slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);

                            const createdTeacher = await prisma.user.create({
                                data: {
                                    email: teacher['Email'],
                                    password: hashedPassword,
                                    role: "teacher",
                                    school_id: existingSchool.id,
                                    first_name: teacher['First Name'].toLowerCase(),
                                    last_name: teacher['Last Name'].toLowerCase(),
                                    phone_number: teacher['Phone']
                                }
                            });

                            createdUsers.teachers.push(createdTeacher);
                        } catch (error) {
                            errors.push({
                                row: rowNumber,
                                email: teacher['Email'],
                                error: error.message
                            });
                        }
                    }
                }

                // Process students
                if (students.length > 0) {
                    console.log(colors.cyan(`Processing ${students.length} students...`));
                    
                    // Get all classes for validation
                    const schoolClasses = await prisma.class.findMany({
                        where: { schoolId: existingSchool.id }
                    });

                    for (let i = 0; i < students.length; i++) {
                        const student = students[i];
                        const rowNumber = processedData.findIndex(row => 
                            row['Email'] === student['Email']
                        ) + 2;

                        try {
                            // Check if email already exists
                            const existingUser = await prisma.user.findFirst({
                                where: { email: student['Email'] }
                            });

                            if (existingUser) {
                                errors.push({
                                    row: rowNumber,
                                    email: student['Email'],
                                    error: 'Email already exists in the system'
                                });
                                continue;
                            }

                            // Validate class exists
                            const classExists = schoolClasses.some(c => c.name === student['Class']);
                            if (!classExists) {
                                errors.push({
                                    row: rowNumber,
                                    email: student['Email'],
                                    error: `Class '${student['Class']}' does not exist in the school`
                                });
                                continue;
                            }

                            // Generate password and create student
                            const defaultPassword = `${student['First Name'].slice(0, 3).toLowerCase()}${student['Phone'].slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);

                            const createdStudent = await prisma.user.create({
                                data: {
                                    email: student['Email'],
                                    password: hashedPassword,
                                    role: "student",
                                    school_id: existingSchool.id,
                                    first_name: student['First Name'].toLowerCase(),
                                    last_name: student['Last Name'].toLowerCase(),
                                    phone_number: student['Phone']
                                }
                            });

                            // Enroll student in class
                            const classId = schoolClasses.find(c => c.name === student['Class'])?.id;
                            if (classId) {
                                await prisma.user.update({
                                    where: { id: createdStudent.id },
                                    data: {
                                        classesEnrolled: {
                                            connect: { id: classId }
                                        }
                                    }
                                });
                            }

                            createdUsers.students.push(createdStudent);
                        } catch (error) {
                            errors.push({
                                row: rowNumber,
                                email: student['Email'],
                                error: error.message
                            });
                        }
                    }
                }

                // Process directors
                if (directors.length > 0) {
                    console.log(colors.cyan(`Processing ${directors.length} directors...`));
                    
                    for (let i = 0; i < directors.length; i++) {
                        const director = directors[i];
                        const rowNumber = processedData.findIndex(row => 
                            row['Email'] === director['Email']
                        ) + 2;

                        try {
                            // Check if email already exists
                            const existingUser = await prisma.user.findFirst({
                                where: { email: director['Email'] }
                            });

                            if (existingUser) {
                                errors.push({
                                    row: rowNumber,
                                    email: director['Email'],
                                    error: 'Email already exists in the system'
                                });
                                continue;
                            }

                            // Generate password and create director
                            const defaultPassword = `${director['First Name'].slice(0, 3).toLowerCase()}${director['Phone'].slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);

                            const createdDirector = await prisma.user.create({
                                data: {
                                    email: director['Email'],
                                    password: hashedPassword,
                                    role: "school_director",
                                    school_id: existingSchool.id,
                                    first_name: director['First Name'].toLowerCase(),
                                    last_name: director['Last Name'].toLowerCase(),
                                    phone_number: director['Phone']
                                }
                            });

                            createdUsers.directors.push(createdDirector);
                        } catch (error) {
                            errors.push({
                                row: rowNumber,
                                email: director['Email'],
                                error: error.message
                            });
                        }
                    }
                }

                console.log(colors.green("Database operations completed successfully!"));

                return { response, createdUsers, errors };
            }, {
                maxWait: 5000,
                timeout: 15000
            });

            // Step 2: Email Sending (Separate from database transaction)
            console.log(colors.cyan("Sending congratulatory emails..."));
            
            const emailPromises: Promise<void>[] = [];

            // Send teacher emails
            if (createdUsers.teachers.length > 0) {
                const teacherEmailPromises = createdUsers.teachers.map(async (teacher) => {
                    try {
                        await sendTeacherOnboardEmail({
                            firstName: teacher.first_name,
                            lastName: teacher.last_name,
                            email: teacher.email,
                            phone: teacher.phone_number,
                            schoolName: existingSchool?.school_name || 'Unknown School'
                        });
                        console.log(colors.green(`✅ Teacher email sent to: ${teacher.email}`));
                    } catch (emailError) {
                        console.log(colors.yellow(`⚠️ Failed to send teacher email to ${teacher.email}: ${emailError.message}`));
                    }
                });
                emailPromises.push(...teacherEmailPromises);
            }

            // Send student emails
            if (createdUsers.students.length > 0) {
                const studentEmailPromises = createdUsers.students.map(async (student) => {
                    try {
                        const studentData = processedData.find(s => 
                            s['Email'] === student.email
                        );
                        const className = studentData?.['Class'] || 'Unassigned';
                        
                        await sendStudentOnboardEmail({
                            firstName: student.first_name,
                            lastName: student.last_name,
                            email: student.email,
                            phone: student.phone_number,
                            schoolName: existingSchool?.school_name || 'Unknown School',
                            className: className
                        });
                        console.log(colors.green(`✅ Student email sent to: ${student.email}`));
                    } catch (emailError) {
                        console.log(colors.yellow(`⚠️ Failed to send student email to ${student.email}: ${emailError.message}`));
                    }
                });
                emailPromises.push(...studentEmailPromises);
            }

            // Send director emails
            if (createdUsers.directors.length > 0) {
                const directorEmailPromises = createdUsers.directors.map(async (director) => {
                    try {
                        await sendDirectorOnboardEmail({
                            firstName: director.first_name,
                            lastName: director.last_name,
                            email: director.email,
                            phone: director.phone_number,
                            schoolName: existingSchool?.school_name || 'Unknown School'
                        });
                        console.log(colors.green(`✅ Director email sent to: ${director.email}`));
                    } catch (emailError) {
                        console.log(colors.yellow(`⚠️ Failed to send director email to ${director.email}: ${emailError.message}`));
                    }
                });
                emailPromises.push(...directorEmailPromises);
            }

            // Send all emails in parallel (non-blocking)
            if (emailPromises.length > 0) {
                await Promise.allSettled(emailPromises);
                console.log(colors.magenta(`📧 Sent ${emailPromises.length} congratulatory emails`));
            }

            // Calculate summary
            const total = processedData.length;
            const successful = createdUsers.teachers.length + createdUsers.students.length + createdUsers.directors.length;
            const failed = errors.length;

            console.log(colors.green("Bulk onboarding completed successfully!"));

            return {
                success: true,
                message: "Bulk onboarding completed successfully",
                data: {
                    total,
                    successful,
                    failed,
                    errors,
                    createdUsers: {
                        teachers: createdUsers.teachers.map(teacher => ({
                            id: teacher.id,
                            first_name: teacher.first_name,
                            last_name: teacher.last_name,
                            email: teacher.email,
                            phone_number: teacher.phone_number,
                            role: teacher.role,
                            school_id: teacher.school_id,
                            created_at: formatDate(teacher.createdAt),
                            updated_at: formatDate(teacher.updatedAt)
                        })),
                        students: createdUsers.students.map(student => ({
                            id: student.id,
                            first_name: student.first_name,
                            last_name: student.last_name,
                            email: student.email,
                            phone_number: student.phone_number,
                            role: student.role,
                            school_id: student.school_id,
                            created_at: formatDate(student.createdAt),
                            updated_at: formatDate(student.updatedAt)
                        })),
                        directors: createdUsers.directors.map(director => ({
                            id: director.id,
                            first_name: director.first_name,
                            last_name: director.last_name,
                            email: director.email,
                            phone_number: director.phone_number,
                            role: director.role,
                            school_id: director.school_id,
                            created_at: formatDate(director.createdAt),
                            updated_at: formatDate(director.updatedAt)
                        }))
                    }
                }
            };

        } catch (error) {
            console.log(colors.red("Error in bulk onboarding: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error in bulk onboarding",
                error: error.message,
                statusCode: 500
            });
        }
    }

    /**
     * Download Excel template for bulk onboarding
     * @returns Buffer containing the Excel template
     */
    async downloadExcelTemplate(): Promise<Buffer> {
        return this.excelProcessorService.generateExcelTemplate();
    }

    /**
     * Refresh access token using refresh token
     * @param refreshToken - The refresh token
     * @returns New access token and refresh token
     */
    async refreshToken(refreshToken: string) {
        this.logger.log(colors.cyan('Refreshing access token...'));

        try {
            // Verify the refresh token
            const secret = this.config.get('JWT_SECRET');
            const payload = await this.jwt.verifyAsync(refreshToken, {
                secret: secret
            });

            // Check if user still exists
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Generate new tokens
            const { access_token, refresh_token } = await this.signToken(user.id, user.email);

            this.logger.log(colors.green('Access token refreshed successfully'));

            return ResponseHelper.success(
                'Access token refreshed successfully',
                {
                    access_token,
                    refresh_token
                }
            );

        } catch (error) {
            this.logger.error(colors.red(`Error refreshing token: ${error.message}`));
            
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Refresh token has expired');
            }
            
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('Invalid refresh token');
            }
            
            throw error;
        }
    }

    /**
     * Send email verification OTP
     * @param email - User's email address
     * @param firstName - User's first name
     * @param otp - The OTP code
     */
    private async sendEmailVerificationOTP(email: string, firstName: string, otp: string) {
        try {
            await sendEmailVerificationOTP({ email, firstName, otp });
            this.logger.log(colors.green(`Email verification OTP sent to: ${email}`));
        } catch (error) {
            this.logger.error(colors.red(`Error sending email verification OTP: ${error.message}`));
            throw new InternalServerErrorException('Failed to send email verification OTP');
        }
    }

    /**
     * Request email verification code
     * @param email - User's email address
     * @returns Success response
     */
    async requestEmailVerification(email: string) {
        this.logger.log(colors.cyan('Requesting email verification...'));

        try {
            // Find the user by email
            const user = await this.prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                this.logger.error(colors.red(`User ${email} not found`));
                throw new NotFoundException('User not found');
            }

            // Check if email is already verified
            if (user.is_email_verified) {
                this.logger.log(colors.green(`Email ${email} is already verified`));
                return ResponseHelper.success(
                    'Email is already verified',
                    { email: user.email }
                );
            }

            // Generate OTP for email verification
            const otp = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Update OTP for the user
            await this.prisma.user.update({
                where: { email: email },
                data: {
                    otp,
                    otp_expires_at: otpExpiresAt,
                },
            });

            // Send email verification OTP
           try {
            this.logger.log(colors.cyan(`Sending email verification OTP to: ${user.email}`));
            await this.sendEmailVerificationOTP(user.email, user.first_name, otp);
            this.logger.log(colors.green(`Email verification OTP ${otp} sent to: ${user.email}`));
           } catch (error) {
            this.logger.error(colors.red(`Error sending email verification OTP: ${error.message}`));
            throw new InternalServerErrorException('Failed to send email verification OTP');
           }
                    
            return ResponseHelper.success(
                'Email verification code sent successfully. Please check your email.',
                { email: user.email }
            );

        } catch (error) {
            this.logger.error(colors.red(`Error requesting email verification: ${error.message}`));
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException('Error requesting email verification');
        }
    }

    /**
     * Logout user
     * @param userId - User ID to logout
     * @param reason - Optional reason for logout
     * @returns Success response
     */
    async logout(userId: string) {
        this.logger.log(colors.cyan(`Logging out user: ${userId}`));

        try {
            // Find the user
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    role: true
                }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            this.logger.log(colors.green(`User ${user.email} logged out successfully`));
            return ResponseHelper.success(
                'Logged out successfully',
                {
                    message: 'You have been successfully logged out',
                    user: {
                        id: user.id,
                        email: user.email,
                        name: `${user.first_name} ${user.last_name}`,
                        role: user.role
                    },
                    logout_time: new Date().toISOString(),
                }
            );

        } catch (error) {
            this.logger.error(colors.red(`Error during logout: ${error.message}`));
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException('Error during logout process');
        }
    }
}
 