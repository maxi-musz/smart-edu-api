import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export class UserDocs {
    static get bearerAuth() {
        return ApiBearerAuth('JWT-auth');
    }

    static get operation() {
        return ApiOperation({
            summary: 'Get user profile details',
            description: 'Fetch the authenticated user\'s profile information including school details'
        });
    }

    static get response200() {
        return ApiResponse({
            status: 200,
            description: 'User profile retrieved successfully',
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User profile retrieved successfully' },
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'user_01HXYZABC123' },
                            email: { type: 'string', example: 'director@school.edu' },
                            first_name: { type: 'string', example: 'John' },
                            last_name: { type: 'string', example: 'Doe' },
                            phone_number: { type: 'string', example: '+1-202-555-0123' },
                            role: { type: 'string', example: 'school_director' },
                            status: { type: 'string', example: 'active' },
                            is_email_verified: { type: 'boolean', example: true },
                            school_id: { type: 'string', example: 'sch_01HXYZABC456' },
                            display_picture: { 
                                type: 'string', 
                                example: 'https://cdn.example.com/avatars/john.jpg',
                                nullable: true 
                            },
                            gender: { 
                                type: 'string', 
                                example: 'male',
                                nullable: true 
                            },
                            created_at: { type: 'string', example: 'Jan 15, 2024, 10:30 AM' },
                            updated_at: { type: 'string', example: 'Jan 15, 2024, 10:30 AM' },
                            school: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    id: { type: 'string', example: 'sch_01HXYZABC456' },
                                    name: { type: 'string', example: 'excellence academy' },
                                    email: { type: 'string', example: 'admin@excellence.edu' },
                                    phone: { type: 'string', example: '+1-202-555-0100' },
                                    address: { type: 'string', example: '123 education street, washington dc' },
                                    type: { type: 'string', example: 'secondary' },
                                    ownership: { type: 'string', example: 'private' },
                                    status: { type: 'string', example: 'active' }
                                }
                            }
                        }
                    },
                    statusCode: { type: 'number', example: 200 }
                }
            }
        });
    }

    static get response401() {
        return ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing JWT token',
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Unauthorized' },
                    statusCode: { type: 'number', example: 401 }
                }
            }
        });
    }

    static get response404() {
        return ApiResponse({
            status: 404,
            description: 'User not found',
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'User not found' },
                    statusCode: { type: 'number', example: 404 }
                }
            }
        });
    }

    static get response500() {
        return ApiResponse({
            status: 500,
            description: 'Internal server error',
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Failed to retrieve user profile' },
                    statusCode: { type: 'number', example: 500 }
                }
            }
        });
    }
}
