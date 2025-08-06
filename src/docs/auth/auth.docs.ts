import { ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardSchoolDto, RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, VerifyresetOtp, OnboardClassesDto, OnboardTeachersDto, OnboardStudentsDto, OnboardDirectorsDto, OnboardDataDto, RequestLoginOtpDTO, VerifyEmailOTPDto } from 'src/shared/dto/auth.dto';

// Onboard School Documentation
export const OnboardSchoolDocs = {
  operation: ApiOperation({
    summary: 'Onboard a new school',
    description: 'Register a new school with required documents and information'
  }),
  consumes: ApiConsumes('multipart/form-data'),
  body: ApiBody({
    description: 'School registration data with required documents',
    schema: {
      type: 'object',
      properties: {
        school_name: {
          type: 'string',
          description: 'Name of the school',
          example: 'St. Mary\'s Secondary School'
        },
        school_email: {
          type: 'string',
          description: 'Email address of the school',
          example: 'info@stmarys.edu.ng'
        },
        school_address: {
          type: 'string',
          description: 'Physical address of the school',
          example: '123 Education Street, Lagos, Nigeria'
        },
        school_phone: {
          type: 'string',
          description: 'Phone number of the school',
          example: '+2348012345678'
        },
        school_type: {
          type: 'string',
          description: 'Type of school',
          enum: ['primary', 'secondary', 'primary_and_secondary', 'other'],
          example: 'secondary'
        },
        school_ownership: {
          type: 'string',
          description: 'Ownership type of the school',
          enum: ['government', 'private', 'other'],
          example: 'private'
        },
        cac_or_approval_letter: {
          type: 'string',
          format: 'binary',
          description: 'CAC certificate or approval letter (PDF, DOC, DOCX)'
        },
        utility_bill: {
          type: 'string',
          format: 'binary',
          description: 'Utility bill for address verification (PDF, JPG, PNG)'
        },
        tax_cert: {
          type: 'string',
          format: 'binary',
          description: 'Tax certificate (PDF, DOC, DOCX)'
        }
      },
      required: ['school_name', 'school_email', 'school_address', 'school_phone', 'school_type', 'school_ownership']
    }
  }),
  response201: ApiResponse({
    status: 201,
    description: 'School successfully onboarded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'School onboarded successfully' },
        data: { type: 'object' },
        statusCode: { type: 'number', example: 201 }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided'
  })
};

// Director Login OTP Documentation
export const DirectorLoginOtpDocs = {
  operation: ApiOperation({
    summary: 'Request login OTP for user',
    description: 'Send a one-time password to the user\'s email for login. This endpoint is used for both directors and other roles that require OTP verification before login.'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Otp successfully sent' },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
};

// Verify Login OTP Documentation
export const VerifyLoginOtpDocs = {
  operation: ApiOperation({
    summary: 'Verify login OTP and sign in user',
    description: 'Verify the OTP sent to user\'s email and complete login. This endpoint is used for both email verification and role-based OTP verification.'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Login successful - returns user data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Login successful' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-id' },
            email: { type: 'string', example: 'user@example.com' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            phone_number: { type: 'string', example: '+2348012345678' },
            is_email_verified: { type: 'boolean', example: true },
            role: { type: 'string', example: 'director' },
            school_id: { type: 'string', example: 'school-id' },
            created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updated_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
};

// Sign In Documentation
export const SignInDocs = {
  operation: ApiOperation({
    summary: 'Sign in with email and password',
    description: 'Authenticate user with email and password credentials. Role-based OTP verification applies: students, teachers, and parents can sign in directly if email is verified. Directors, admins, and other roles require OTP verification before login.'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Sign in successful - returns JWT token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User signed in successfully' },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response200OtpRequired: ApiResponse({
    status: 200,
    description: 'OTP verification required for role',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP verification required for this role. Please check your email for the OTP.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-id' },
            email: { type: 'string', example: 'user@example.com' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            phone_number: { type: 'string', example: '+2348012345678' },
            is_email_verified: { type: 'boolean', example: true },
            role: { type: 'string', example: 'director' },
            school_id: { type: 'string', example: 'school-id' },
            created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updated_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response200EmailNotVerified: ApiResponse({
    status: 200,
    description: 'Email not verified - OTP sent for verification',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email not verified, please verify your email address with the otp sent to your email address' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-id' },
            email: { type: 'string', example: 'user@example.com' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            phone_number: { type: 'string', example: '+2348012345678' },
            is_email_verified: { type: 'boolean', example: false },
            role: { type: 'string', example: 'student' },
            school_id: { type: 'string', example: 'school-id' },
            created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updated_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
};

// Password Reset Documentation
export const RequestPasswordResetDocs = {
  operation: ApiOperation({
    summary: 'Request password reset OTP',
    description: 'Send a one-time password to user\'s email for password reset'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Password reset OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password reset OTP sent' },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
};

export const VerifyPasswordResetDocs = {
  operation: ApiOperation({
    summary: 'Verify password reset OTP',
    description: 'Verify the OTP sent for password reset'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP verified successfully' },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
};

export const ResetPasswordDocs = {
  operation: ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password with new password and confirmation'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password reset successful' },
        statusCode: { type: 'number', example: 200 }
      }
    }
  })
};

// Onboarding Documentation (Protected Endpoints)
export const OnboardClassesDocs = {
  operation: ApiOperation({
    summary: 'Onboard classes',
    description: 'Create multiple classes for the school (requires authentication)'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response201: ApiResponse({
    status: 201,
    description: 'Classes onboarded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Classes onboarded successfully' },
        data: { type: 'object' },
        statusCode: { type: 'number', example: 201 }
      }
    }
  })
};

export const OnboardTeachersDocs = {
  operation: ApiOperation({
    summary: 'Onboard teachers',
    description: 'Create multiple teachers for the school (requires authentication)'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response201: ApiResponse({
    status: 201,
    description: 'Teachers onboarded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teachers onboarded successfully' },
        data: { type: 'object' },
        statusCode: { type: 'number', example: 201 }
      }
    }
  })
};

export const OnboardStudentsDocs = {
  operation: ApiOperation({
    summary: 'Onboard students',
    description: 'Create multiple students for the school (requires authentication)'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response201: ApiResponse({
    status: 201,
    description: 'Students onboarded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Students onboarded successfully' },
        data: { type: 'object' },
        statusCode: { type: 'number', example: 201 }
      }
    }
  })
};

export const OnboardDirectorsDocs = {
  operation: ApiOperation({
    summary: 'Onboard directors',
    description: 'Create multiple directors for the school (requires authentication)'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response201: ApiResponse({
    status: 201,
    description: 'Directors onboarded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Directors onboarded successfully' },
        data: { type: 'object' },
        statusCode: { type: 'number', example: 201 }
      }
    }
  })
};

export const OnboardDataDocs = {
  operation: ApiOperation({
    summary: 'Onboard all data',
    description: 'Create classes, teachers, students, and directors in bulk (requires authentication)'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response201: ApiResponse({
    status: 201,
    description: 'Data onboarded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Data onboarded successfully' },
        data: { type: 'object' },
        statusCode: { type: 'number', example: 201 }
      }
    }
  })
};

// Bulk Onboard from Excel Documentation
export const BulkOnboardFromExcelDocs = {
  operation: ApiOperation({
    summary: 'Bulk onboard from Excel file',
    description: 'Upload an Excel file to bulk onboard classes, teachers, students, and directors (requires authentication)'
  }),
  consumes: ApiConsumes('multipart/form-data'),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  body: ApiBody({
    description: 'Excel file for bulk onboarding',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx, .xls) containing onboarding data'
        }
      },
      required: ['file']
    }
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Bulk onboarding successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Bulk onboarding completed successfully' },
        data: {
          type: 'object',
          properties: {
            totalRecords: { type: 'number', example: 100 },
            successfulRecords: { type: 'number', example: 95 },
            failedRecords: { type: 'number', example: 5 },
            errors: { type: 'array', items: { type: 'string' } }
          }
        },
        statusCode: { type: 'number', example: 201 }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file format or data'
  })
};

// Download Excel Template Documentation
export const DownloadExcelTemplateDocs = {
  operation: ApiOperation({
    summary: 'Download Excel template for bulk onboarding',
    description: 'Download a pre-formatted Excel template for bulk onboarding data (requires authentication)'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Excel template downloaded successfully',
    schema: {
      type: 'string',
      format: 'binary',
      description: 'Excel file (.xlsx) containing the template'
    }
  })
}; 