import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { User } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(private readonly prisma: PrismaService) {}

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

            // Format the response
            const formattedProfile = {
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
                } : null
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
}
