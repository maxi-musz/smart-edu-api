// Student enrollment notification email templates

export const newStudentEnrollmentTemplate = (payload: {
  studentName: string;
  studentEmail: string;
  schoolName: string;
  studentId: string;
  className: string;
  enrollmentDate: string;
  studentDetails: {
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    address?: string;
    academicLevel?: string;
    previousSchool?: string;
  };
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
          <h2>🎓 New Student Enrollment</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Student Enrollment Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>A new student has been enrolled at <strong>${payload.schoolName}</strong>:</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">📚 Student Information</h3>
            <div style="color: #15803d;">
              <p style="margin: 5px 0;"><strong>Student Name:</strong> ${payload.studentName}</p>
              <p style="margin: 5px 0;"><strong>Student ID:</strong> ${payload.studentId}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.studentEmail}</p>
              <p style="margin: 5px 0;"><strong>Class:</strong> ${payload.className}</p>
              <p style="margin: 5px 0;"><strong>Enrollment Date:</strong> ${payload.enrollmentDate}</p>
            </div>
          </div>
          
          ${payload.studentDetails.guardianName ? `
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">👨‍👩‍👧‍👦 Guardian Information</h3>
            <div style="color: #1e40af;">
              <p style="margin: 5px 0;"><strong>Guardian Name:</strong> ${payload.studentDetails.guardianName}</p>
              ${payload.studentDetails.guardianPhone ? `<p style="margin: 5px 0;"><strong>Guardian Phone:</strong> ${payload.studentDetails.guardianPhone}</p>` : ''}
              ${payload.studentDetails.guardianEmail ? `<p style="margin: 5px 0;"><strong>Guardian Email:</strong> ${payload.studentDetails.guardianEmail}</p>` : ''}
              ${payload.studentDetails.address ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${payload.studentDetails.address}</p>` : ''}
            </div>
          </div>
          ` : ''}
          
          ${payload.studentDetails.academicLevel || payload.studentDetails.previousSchool ? `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">📖 Academic Information</h3>
            <div style="color: #92400e;">
              ${payload.studentDetails.academicLevel ? `<p style="margin: 5px 0;"><strong>Academic Level:</strong> ${payload.studentDetails.academicLevel}</p>` : ''}
              ${payload.studentDetails.previousSchool ? `<p style="margin: 5px 0;"><strong>Previous School:</strong> ${payload.studentDetails.previousSchool}</p>` : ''}
            </div>
          </div>
          ` : ''}
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Action Required:</strong> Please review the student's enrollment details and ensure all necessary documentation is in place.</p>
          </div>
          
          <p>This notification has been sent to all school directors for awareness.</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
};

export const studentWelcomeTemplate = (payload: {
  studentName: string;
  studentEmail: string;
  schoolName: string;
  studentId: string;
  className: string;
  classTeacher?: string;
  enrollmentDate: string;
  loginCredentials: {
    email: string;
    password: string;
  };
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
          <h2>🎓 Welcome to Smart Edu Hub!</h2>
          <p style="margin: 0; opacity: 0.9;">Your Academic Journey Begins Here</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.studentName}</strong>,</p>
          
          <p>🎉 Welcome to <strong>${payload.schoolName}</strong>! We're excited to have you join our academic community and begin your educational journey with us.</p>
          
          <div style="background-color: #faf5ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #7c3aed;">📚 Your Enrollment Details</h3>
            <div style="color: #7c3aed;">
              <p style="margin: 5px 0;"><strong>Student ID:</strong> ${payload.studentId}</p>
              <p style="margin: 5px 0;"><strong>Class:</strong> ${payload.className}</p>
              ${payload.classTeacher ? `<p style="margin: 5px 0;"><strong>Class Teacher:</strong> ${payload.classTeacher}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Enrollment Date:</strong> ${payload.enrollmentDate}</p>
            </div>
          </div>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">🔐 Your Login Credentials</h3>
            <div style="color: #1e40af;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.loginCredentials.email}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> ${payload.loginCredentials.password}</p>
            </div>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>📚 Access your course materials and assignments</li>
            <li>📊 View your academic progress and grades</li>
            <li>📅 Check your class schedule and timetable</li>
            <li>💬 Communicate with teachers and classmates</li>
            <li>📝 Submit assignments and take quizzes</li>
            <li>📱 Access your account from any device</li>
          </ul>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Next Steps:</strong> Please log in to your Smart Edu Hub account using the credentials above and complete your profile setup.</p>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>🔒 Security Note:</strong> For your security, please change your password after your first login.</p>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact your class teacher or school administrator.</p>
          <p>We wish you a successful and rewarding academic year!</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong><br><em>${payload.schoolName}</em></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
};

export const classTeacherNotificationTemplate = (payload: {
  teacherName: string;
  className: string;
  schoolName: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  enrollmentDate: string;
  studentDetails: {
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    academicLevel?: string;
    previousSchool?: string;
  };
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
          <h2>👨‍🏫 New Student in Your Class</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Class Teacher Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.teacherName}</strong>,</p>
          
          <p>🎉 A new student has been enrolled in your class <strong>${payload.className}</strong> at <strong>${payload.schoolName}</strong>.</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">📚 New Student Information</h3>
            <div style="color: #92400e;">
              <p style="margin: 5px 0;"><strong>Student Name:</strong> ${payload.studentName}</p>
              <p style="margin: 5px 0;"><strong>Student ID:</strong> ${payload.studentId}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.studentEmail}</p>
              <p style="margin: 5px 0;"><strong>Class:</strong> ${payload.className}</p>
              <p style="margin: 5px 0;"><strong>Enrollment Date:</strong> ${payload.enrollmentDate}</p>
            </div>
          </div>
          
          ${payload.studentDetails.guardianName ? `
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">👨‍👩‍👧‍👦 Guardian Information</h3>
            <div style="color: #1e40af;">
              <p style="margin: 5px 0;"><strong>Guardian Name:</strong> ${payload.studentDetails.guardianName}</p>
              ${payload.studentDetails.guardianPhone ? `<p style="margin: 5px 0;"><strong>Guardian Phone:</strong> ${payload.studentDetails.guardianPhone}</p>` : ''}
              ${payload.studentDetails.guardianEmail ? `<p style="margin: 5px 0;"><strong>Guardian Email:</strong> ${payload.studentDetails.guardianEmail}</p>` : ''}
            </div>
          </div>
          ` : ''}
          
          ${payload.studentDetails.academicLevel || payload.studentDetails.previousSchool ? `
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">📖 Academic Background</h3>
            <div style="color: #15803d;">
              ${payload.studentDetails.academicLevel ? `<p style="margin: 5px 0;"><strong>Academic Level:</strong> ${payload.studentDetails.academicLevel}</p>` : ''}
              ${payload.studentDetails.previousSchool ? `<p style="margin: 5px 0;"><strong>Previous School:</strong> ${payload.studentDetails.previousSchool}</p>` : ''}
            </div>
          </div>
          ` : ''}
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>✅ Action Required:</strong> Please welcome the new student and ensure they are properly integrated into your class activities.</p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What You Can Do:</h3>
          <ul style="color: #4b5563;">
            <li>👋 Welcome the student on their first day</li>
            <li>📚 Introduce them to class routines and expectations</li>
            <li>👥 Help them integrate with classmates</li>
            <li>📞 Contact guardian if needed for additional information</li>
            <li>📊 Monitor their initial progress and provide support</li>
          </ul>
          
          <p>Thank you for your dedication to student success!</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong><br><em>${payload.schoolName}</em></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
};
