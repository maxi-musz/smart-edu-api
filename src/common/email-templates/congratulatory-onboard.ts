// Congratulatory email templates for onboarded users

export const teacherOnboardEmailTemplate = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
  password: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <h2>🎉 Welcome to Smart Edu Hub!</h2>
          <p style="margin: 0; opacity: 0.9;">Advanced AI-Powered School Management System</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.firstName} ${payload.lastName}</strong>,</p>
          
          <p>🎊 <strong>Congratulations!</strong> You have been successfully onboarded as a <strong>Teacher</strong> at <strong>${payload.schoolName}</strong> on Smart Edu Hub - our advanced AI-powered school and learning management system.</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">🚀 Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${payload.password}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Please change your password after your first login for security.</p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>📚 Manage your assigned classes and subjects</li>
            <li>📊 Track student performance and progress</li>
            <li>📅 Create and manage class schedules</li>
            <li>📝 Generate and submit reports</li>
            <li>💬 Communicate with students and parents</li>
            <li>📱 Access the platform from any device</li>
          </ul>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>🔐 Security Note:</strong> Keep your login credentials safe and don't share them with anyone. For any technical support, contact your school administrator.</p>
          </div>
          
          <p>We're excited to have you join our innovative educational platform! 🚀</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
        </div>
      </div>
    </div>
  `;
};

export const studentOnboardEmailTemplate = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
  password: string;
  className?: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
          <h2>🎓 Welcome to Smart Edu Hub!</h2>
          <p style="margin: 0; opacity: 0.9;">Advanced AI-Powered Learning Management System</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.firstName} ${payload.lastName}</strong>,</p>
          
          <p>🎊 <strong>Congratulations!</strong> You have been successfully enrolled as a <strong>Student</strong> at <strong>${payload.schoolName}</strong> on Smart Edu Hub - our advanced AI-powered school and learning management system.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">🚀 Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${payload.password}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Please change your password after your first login for security.</p>
          </div>
          
          ${payload.className ? `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>📚 Class Assignment:</strong> You have been assigned to <strong>${payload.className}</strong></p>
          </div>
          ` : ''}
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>📖 Access your course materials and assignments</li>
            <li>📊 View your academic performance and progress</li>
            <li>📅 Check your class schedules and timetables</li>
            <li>📝 Submit assignments and take online quizzes</li>
            <li>💬 Communicate with teachers and classmates</li>
            <li>📱 Access learning resources from any device</li>
          </ul>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>🔐 Security Note:</strong> Keep your login credentials safe and don't share them with anyone. For any technical support, contact your school administrator.</p>
          </div>
          
          <p>Welcome to the future of learning! We're excited to have you on board! 🚀</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
        </div>
      </div>
    </div>
  `;
};

export const directorOnboardEmailTemplate = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
  password: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
          <h2>🎉 Welcome to Smart Edu Hub!</h2>
          <p style="margin: 0; opacity: 0.9;">Advanced AI-Powered School Management System</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.firstName} ${payload.lastName}</strong>,</p>
          
          <p>🎊 <strong>Congratulations!</strong> You have been successfully onboarded as a <strong>School Director</strong> at <strong>${payload.schoolName}</strong> on Smart Edu Hub - our advanced AI-powered school and learning management system.</p>
          
          <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #7c3aed;">🚀 Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${payload.password}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Please change your password after your first login for security.</p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>🏫 Manage your entire school operations</li>
            <li>👥 Oversee teachers, students, and staff</li>
            <li>📊 Access comprehensive analytics and reports</li>
            <li>💰 Monitor financial operations and payments</li>
            <li>📅 Manage academic schedules and timetables</li>
            <li>⚙️ Configure school settings and policies</li>
            <li>📱 Access the platform from any device</li>
          </ul>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>🔐 Security Note:</strong> Keep your login credentials safe and don't share them with anyone. For any technical support, contact our support team.</p>
          </div>
          
          <p>Welcome to the future of school management! We're excited to have you lead your school into the digital age! 🚀</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
        </div>
      </div>
    </div>
  `;
}; 