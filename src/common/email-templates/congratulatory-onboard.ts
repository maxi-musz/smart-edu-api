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
          
          <p>🎊 <strong>Congratulations!</strong> You have been successfully onboarded as a <strong>Teacher</strong> at <strong>${payload.schoolName}</strong> on Smart Edu Hub - our advanced AI-powered School and Learning Management System.</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">🚀 Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${payload.password}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Please change your Password after your first Login for Security.</p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>📚 Manage your assigned Classes and Subjects</li>
            <li>📊 Track Student Performance and Progress</li>
            <li>📅 Create and manage Class Schedules</li>
            <li>📝 Generate and submit Reports</li>
            <li>💬 Communicate with Students and Parents</li>
            <li>📱 Access the Platform from any Device</li>
          </ul>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>🔐 Security Note:</strong> Keep your Login Credentials safe and don't share them with anyone. For any Technical Support, contact your School Administrator.</p>
          </div>
          
          <p>We're excited to have you join our innovative Educational Platform! 🚀</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
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
          
          <p>🎊 <strong>Congratulations!</strong> You have been successfully enrolled as a <strong>Student</strong> at <strong>${payload.schoolName}</strong> on Smart Edu Hub - our advanced AI-powered School and Learning Management System.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">🚀 Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${payload.password}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Please change your Password after your first Login for Security.</p>
          </div>
          
          ${payload.className ? `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>📚 Class Assignment:</strong> You have been assigned to <strong>${payload.className}</strong></p>
          </div>
          ` : ''}
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>📖 Access your Course Materials and Assignments</li>
            <li>📊 View your Academic Performance and Progress</li>
            <li>📅 Check your Class Schedules and Timetables</li>
            <li>📝 Submit Assignments and take online Quizzes</li>
            <li>💬 Communicate with Teachers and Classmates</li>
            <li>📱 Access Learning Resources from any Device</li>
          </ul>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>🔐 Security Note:</strong> Keep your Login Credentials safe and don't share them with anyone. For any Technical Support, contact your School Administrator.</p>
          </div>
          
          <p>Welcome to the Future of Learning! We're excited to have you on board! 🚀</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
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
          
          <p>🎊 <strong>Congratulations!</strong> You have been successfully onboarded as a <strong>School Director</strong> at <strong>${payload.schoolName}</strong> on Smart Edu Hub - our advanced AI-powered School and Learning Management System.</p>
          
          <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #7c3aed;">🚀 Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${payload.password}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Please change your Password after your first Login for Security.</p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>🏫 Manage your entire School Operations</li>
            <li>👥 Oversee Teachers, Students, and Staff</li>
            <li>📊 Access comprehensive Analytics and Reports</li>
            <li>💰 Monitor Financial Operations and Payments</li>
            <li>📅 Manage Academic Schedules and Timetables</li>
            <li>⚙️ Configure School Settings and Policies</li>
            <li>📱 Access the Platform from any Device</li>
          </ul>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>🔐 Security Note:</strong> Keep your Login Credentials safe and don't share them with anyone. For any Technical Support, contact our Support Team.</p>
          </div>
          
          <p>Welcome to the Future of School Management! We're excited to have you lead your School into the Digital Age! 🚀</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
}; 