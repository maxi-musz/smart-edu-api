// Teaching role notification email templates for teachers

export const teacherSubjectRoleTemplate = (payload: {
  teacherName: string;
  teacherEmail: string;
  schoolName: string;
  subjects: string[];
  assignedBy: string;
  roleDate: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;">
          <h2>📚 New Teaching Role</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Teaching Role Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.teacherName}</strong>,</p>
          
          <p>🎯 You have been assigned to teach the following <strong>${payload.subjects.length > 1 ? 'subjects' : 'subject'}</strong> at <strong>${payload.schoolName}</strong>:</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📖 Teaching Subjects</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              ${payload.subjects.map(subject => `<li style="margin: 5px 0;"><strong>${subject}</strong></li>`).join('')}
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>📅 Role Assignment Date:</strong> ${payload.roleDate}<br>
              <strong>👤 Assigned By:</strong> ${payload.assignedBy}
            </p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What This Means:</h3>
          <ul style="color: #4b5563;">
            <li>📚 You can now access teaching materials for these subjects</li>
            <li>📊 You can track student performance in these subjects</li>
            <li>📝 You can create and grade homework for these subjects</li>
            <li>📅 Your schedule will be updated to include these subjects</li>
            <li>💬 You can communicate with students taking these subjects</li>
          </ul>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Action Required:</strong> Please log in to your Smart Edu Hub account to review your new teaching responsibilities and update your availability if needed.</p>
          </div>
          
          <p>If you have any questions about this teaching role, please contact your school administrator.</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
};

export const teacherClassManagementTemplate = (payload: {
  teacherName: string;
  teacherEmail: string;
  schoolName: string;
  classes: string[];
  assignedBy: string;
  roleDate: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
          <h2>🏫 New Class Management Role</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Class Management Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.teacherName}</strong>,</p>
          
          <p>🎯 You have been assigned as the <strong>Class Teacher</strong> for the following <strong>${payload.classes.length > 1 ? 'classes' : 'class'}</strong> at <strong>${payload.schoolName}</strong>:</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">🏫 Managing Classes</h3>
            <ul style="margin: 0; padding-left: 20px; color: #15803d;">
              ${payload.classes.map(cls => `<li style="margin: 5px 0;"><strong>${cls}</strong></li>`).join('')}
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>📅 Role Assignment Date:</strong> ${payload.roleDate}<br>
              <strong>👤 Assigned By:</strong> ${payload.assignedBy}
            </p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 Your Responsibilities as Class Teacher:</h3>
          <ul style="color: #4b5563;">
            <li>👥 Manage and monitor student behavior and attendance</li>
            <li>📊 Track overall class performance and progress</li>
            <li>📝 Generate class reports and communicate with parents</li>
            <li>📅 Coordinate class activities and events</li>
            <li>💬 Act as the primary point of contact for class-related matters</li>
            <li>📚 Oversee the academic progress of all students in your class</li>
          </ul>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Action Required:</strong> Please log in to your Smart Edu Hub account to review your new class responsibilities and access your class dashboard.</p>
          </div>
          
          <p>If you have any questions about this class management role, please contact your school administrator.</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
};

export const teacherRoleUpdateTemplate = (payload: {
  teacherName: string;
  teacherEmail: string;
  schoolName: string;
  newSubjects?: string[];
  removedSubjects?: string[];
  newClasses?: string[];
  removedClasses?: string[];
  assignedBy: string;
  updateDate: string;
}): string => {
  const hasSubjectChanges = (payload.newSubjects && payload.newSubjects.length > 0) || (payload.removedSubjects && payload.removedSubjects.length > 0);
  const hasClassChanges = (payload.newClasses && payload.newClasses.length > 0) || (payload.removedClasses && payload.removedClasses.length > 0);
  
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
          <h2>🔄 Teaching Role Update</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Teaching Role Update Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.teacherName}</strong>,</p>
          
          <p>🔄 Your teaching roles at <strong>${payload.schoolName}</strong> have been updated:</p>
          
          ${hasSubjectChanges ? `
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📚 Teaching Role Changes</h3>
            ${payload.newSubjects && payload.newSubjects.length > 0 ? `
            <div style="margin-bottom: 15px;">
              <p style="margin: 0 0 5px 0; color: #15803d;"><strong>✅ New Teaching Subjects:</strong></p>
              <ul style="margin: 0; padding-left: 20px; color: #15803d;">
                ${payload.newSubjects.map(subject => `<li style="margin: 3px 0;">${subject}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            ${payload.removedSubjects && payload.removedSubjects.length > 0 ? `
            <div>
              <p style="margin: 0 0 5px 0; color: #dc2626;"><strong>❌ Subjects Removed:</strong></p>
              <ul style="margin: 0; padding-left: 20px; color: #dc2626;">
                ${payload.removedSubjects.map(subject => `<li style="margin: 3px 0;">${subject}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          ${hasClassChanges ? `
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">🏫 Class Management Changes</h3>
            ${payload.newClasses && payload.newClasses.length > 0 ? `
            <div style="margin-bottom: 15px;">
              <p style="margin: 0 0 5px 0; color: #15803d;"><strong>✅ New Classes to Manage:</strong></p>
              <ul style="margin: 0; padding-left: 20px; color: #15803d;">
                ${payload.newClasses.map(cls => `<li style="margin: 3px 0;">${cls}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            ${payload.removedClasses && payload.removedClasses.length > 0 ? `
            <div>
              <p style="margin: 0 0 5px 0; color: #dc2626;"><strong>❌ Classes Removed:</strong></p>
              <ul style="margin: 0; padding-left: 20px; color: #dc2626;">
                ${payload.removedClasses.map(cls => `<li style="margin: 3px 0;">${cls}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>📅 Update Date:</strong> ${payload.updateDate}<br>
              <strong>👤 Updated By:</strong> ${payload.assignedBy}
            </p>
          </div>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Action Required:</strong> Please log in to your Smart Edu Hub account to review your updated teaching roles and adjust your schedule accordingly.</p>
          </div>
          
          <p>If you have any questions about these changes, please contact your school administrator.</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
}; 

export const timetableScheduleTemplate = (payload: {
  teacherName: string;
  teacherEmail: string;
  schoolName: string;
  subjectName: string;
  className: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  assignedBy: string;
  scheduleDate: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white;">
          <h2>📅 New Class Schedule</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Timetable Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.teacherName}</strong>,</p>
          
          <p>📅 A new class has been scheduled for you at <strong>${payload.schoolName}</strong>:</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #06b6d4; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #0891b2;">📚 Class Schedule Details</h3>
            <div style="color: #0891b2;">
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${payload.subjectName}</p>
              <p style="margin: 5px 0;"><strong>Class:</strong> ${payload.className}</p>
              <p style="margin: 5px 0;"><strong>Day:</strong> ${payload.dayOfWeek}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
              ${payload.room ? `<p style="margin: 5px 0;"><strong>Room:</strong> ${payload.room}</p>` : ''}
              ${payload.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${payload.notes}</p>` : ''}
            </div>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>📅 Schedule Date:</strong> ${payload.scheduleDate}<br>
              <strong>👤 Scheduled By:</strong> ${payload.assignedBy}
            </p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What This Means:</h3>
          <ul style="color: #4b5563;">
            <li>📚 You are now responsible for teaching this class at the scheduled time</li>
            <li>📊 You can access teaching materials and track student progress</li>
            <li>📝 You can create assignments and grade student work</li>
            <li>📅 This class will appear in your weekly schedule</li>
            <li>💬 You can communicate with students in this class</li>
            <li>⏰ Please ensure you arrive on time for your scheduled classes</li>
          </ul>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Action Required:</strong> Please log in to your Smart Edu Hub account to review your updated schedule and prepare for your upcoming classes.</p>
          </div>
          
          <div style="background-color: #fef2f2; border: 1px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #dc2626;"><strong>⚠️ Important:</strong> If you have any conflicts with this schedule or need to request changes, please contact your school administrator as soon as possible.</p>
          </div>
          
          <p>If you have any questions about this schedule, please contact your school administrator.</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
}; 

 