import { 
  OnboardSchoolDocs, 
  DirectorLoginOtpDocs, 
  VerifyLoginOtpDocs, 
  SignInDocs, 
  RequestPasswordResetDocs, 
  VerifyPasswordResetDocs, 
  ResetPasswordDocs,
  OnboardClassesDocs,
  OnboardTeachersDocs,
  OnboardStudentsDocs,
  OnboardDirectorsDocs,
  OnboardDataDocs
} from 'src/docs/auth';
import { BulkOnboardDocs, DownloadTemplateDocs } from 'src/docs/bulk-onboard';

// Auth Controller Documentation Decorators
export const AuthControllerDocs = {
  // Onboard School
  onboardSchool: {
    operation: OnboardSchoolDocs.operation,
    consumes: OnboardSchoolDocs.consumes,
    body: OnboardSchoolDocs.body,
    response201: OnboardSchoolDocs.response201,
    response400: OnboardSchoolDocs.response400
  },

  // Director Login OTP
  directorLoginOtp: {
    operation: DirectorLoginOtpDocs.operation,
    response200: DirectorLoginOtpDocs.response200
  },

  // Verify Login OTP
  verifyLoginOtp: {
    operation: VerifyLoginOtpDocs.operation,
    response200: VerifyLoginOtpDocs.response200
  },

  // Sign In
  signIn: {
    operation: SignInDocs.operation,
    response200: SignInDocs.response200,
    response200OtpRequired: SignInDocs.response200OtpRequired,
    response200EmailNotVerified: SignInDocs.response200EmailNotVerified
  },

  // Request Password Reset OTP
  requestPasswordResetOtp: {
    operation: RequestPasswordResetDocs.operation,
    response200: RequestPasswordResetDocs.response200
  },

  // Verify Password Reset OTP
  verifyPasswordResetOtp: {
    operation: VerifyPasswordResetDocs.operation,
    response200: VerifyPasswordResetDocs.response200
  },

  // Reset Password
  resetPassword: {
    operation: ResetPasswordDocs.operation,
    response200: ResetPasswordDocs.response200
  },

  // Onboard Classes
  onboardClasses: {
    bearerAuth: OnboardClassesDocs.bearerAuth,
    operation: OnboardClassesDocs.operation,
    response201: OnboardClassesDocs.response201
  },

  // Onboard Teachers
  onboardTeachers: {
    bearerAuth: OnboardTeachersDocs.bearerAuth,
    operation: OnboardTeachersDocs.operation,
    response201: OnboardTeachersDocs.response201
  },

  // Onboard Students
  onboardStudents: {
    bearerAuth: OnboardStudentsDocs.bearerAuth,
    operation: OnboardStudentsDocs.operation,
    response201: OnboardStudentsDocs.response201
  },

  // Onboard Directors
  onboardDirectors: {
    bearerAuth: OnboardDirectorsDocs.bearerAuth,
    operation: OnboardDirectorsDocs.operation,
    response201: OnboardDirectorsDocs.response201
  },

  // Onboard Data
  onboardData: {
    bearerAuth: OnboardDataDocs.bearerAuth,
    operation: OnboardDataDocs.operation,
    response201: OnboardDataDocs.response201
  },

  // Bulk Onboard from Excel
  bulkOnboardFromExcel: {
    operation: BulkOnboardDocs.operation,
    consumes: BulkOnboardDocs.consumes,
    body: BulkOnboardDocs.body,
    bearerAuth: BulkOnboardDocs.bearerAuth,
    response201: BulkOnboardDocs.response201,
    response400: BulkOnboardDocs.response400,
    response401: BulkOnboardDocs.response401,
    response500: BulkOnboardDocs.response500
  },

  // Download Excel Template
  downloadExcelTemplate: {
    operation: DownloadTemplateDocs.operation,
    bearerAuth: DownloadTemplateDocs.bearerAuth,
    response200: DownloadTemplateDocs.response200,
    response401: DownloadTemplateDocs.response401
  }
}; 