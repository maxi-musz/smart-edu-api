// Director notification email templates for teacher assignment changes

export const teacherRoleChangeDirectorTemplate = (payload: {
  directorName: string;
  directorEmail: string;
  schoolName: string;
  updatedBy: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  changeType: 'subject' | 'class' | 'both';
  newSubjects?: string[];
  removedSubjects?: string[];
  newClasses?: string[];
  removedClasses?: string[];
  previousSubjects?: string[];
  previousClasses?: string[];
  changeDate: string;
}): string => {
  const hasSubjectChanges = (payload.newSubjects && payload.newSubjects.length > 0) || (payload.removedSubjects && payload.removedSubjects.length > 0);
  const hasClassChanges = (payload.newClasses && payload.newClasses.length > 0) || (payload.removedClasses && payload.removedClasses.length > 0);
  
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white;">
          <h2>📋 Teacher Role Update Report</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - School Management Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.directorName}</strong>,</p>
          
          <p>📊 A teacher's teaching role has been updated at <strong>${payload.schoolName}</strong>. Here are the complete details:</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">👤 Teacher Information</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${payload.teacherName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.teacherEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${payload.teacherPhone || 'Not provided'}</p>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">🔄 Change Details</h3>
            <p style="margin: 5px 0;"><strong>Updated By:</strong> ${payload.updatedBy}</p>
            <p style="margin: 5px 0;"><strong>Change Date:</strong> ${payload.changeDate}</p>
            <p style="margin: 5px 0;"><strong>Change Type:</strong> ${payload.changeType === 'subject' ? 'Subject Assignment' : payload.changeType === 'class' ? 'Class Assignment' : 'Subject & Class Assignment'}</p>
          </div>
          
          ${hasSubjectChanges ? `
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📚 Teaching Role Changes</h3>
            ${payload.previousSubjects && payload.previousSubjects.length > 0 ? `
            <div style="margin-bottom: 15px;">
              <p style="margin: 0 0 5px 0; color: #6b7280;"><strong>Previous Subjects:</strong></p>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                ${payload.previousSubjects.map(subject => `<li style="margin: 3px 0;">${subject}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
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
            ${payload.previousClasses && payload.previousClasses.length > 0 ? `
            <div style="margin-bottom: 15px;">
              <p style="margin: 0 0 5px 0; color: #6b7280;"><strong>Previous Classes:</strong></p>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                ${payload.previousClasses.map(cls => `<li style="margin: 3px 0;">${cls}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
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
            <h3 style="margin: 0 0 10px 0; color: #92400e;">📊 Summary</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Teacher: <strong>${payload.teacherName}</strong></li>
              <li>Change Type: <strong>${payload.changeType === 'subject' ? 'Teaching Role' : payload.changeType === 'class' ? 'Class Management' : 'Teaching Role & Class Management'}</strong></li>
              <li>Updated By: <strong>${payload.updatedBy}</strong></li>
              <li>Date: <strong>${payload.changeDate}</strong></li>
              ${hasSubjectChanges ? `<li>Subject Changes: <strong>${(payload.newSubjects?.length || 0) + (payload.removedSubjects?.length || 0)} total changes</strong></li>` : ''}
              ${hasClassChanges ? `<li>Class Changes: <strong>${(payload.newClasses?.length || 0) + (payload.removedClasses?.length || 0)} total changes</strong></li>` : ''}
            </ul>
          </div>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Action Required:</strong> This is an informational notification. The teacher has been automatically notified of their role changes. No action is required from you unless you need to review or modify these roles.</p>
          </div>
          
          <p>This notification ensures you stay informed about all teacher role changes in your school.</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
};

export const newTeacherRoleDirectorTemplate = (payload: {
  directorName: string;
  directorEmail: string;
  schoolName: string;
  createdBy: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  assignedSubjects: string[];
  assignedClasses: string[];
  creationDate: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white;">
          <h2>🎉 New Teacher Role Report</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - School Management Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.directorName}</strong>,</p>
          
          <p>🎊 A new teacher has been added to <strong>${payload.schoolName}</strong> with initial roles. Here are the complete details:</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">👤 New Teacher Information</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${payload.teacherName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.teacherEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${payload.teacherPhone || 'Not provided'}</p>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">📋 Role Details</h3>
            <p style="margin: 5px 0;"><strong>Created By:</strong> ${payload.createdBy}</p>
            <p style="margin: 5px 0;"><strong>Creation Date:</strong> ${payload.creationDate}</p>
          </div>
          
          ${payload.assignedSubjects.length > 0 ? `
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📚 Initial Teaching Roles</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              ${payload.assignedSubjects.map(subject => `<li style="margin: 5px 0;"><strong>${subject}</strong></li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${payload.assignedClasses.length > 0 ? `
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">🏫 Initial Class Management Roles</h3>
            <ul style="margin: 0; padding-left: 20px; color: #15803d;">
              ${payload.assignedClasses.map(cls => `<li style="margin: 5px 0;"><strong>${cls}</strong></li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">📊 Summary</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>New Teacher: <strong>${payload.teacherName}</strong></li>
              <li>Email: <strong>${payload.teacherEmail}</strong></li>
              <li>Created By: <strong>${payload.createdBy}</strong></li>
              <li>Date: <strong>${payload.creationDate}</strong></li>
              <li>Teaching Roles: <strong>${payload.assignedSubjects.length}</strong></li>
              <li>Class Management Roles: <strong>${payload.assignedClasses.length}</strong></li>
            </ul>
          </div>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #15803d;"><strong>✅ Action Required:</strong> The new teacher has been automatically notified of their roles and welcome email. They can now log in to the platform and start their teaching responsibilities.</p>
          </div>
          
          <p>Welcome to the new teacher! 🎉</p>
          <p>Best regards,<br><strong>Smart Edu Hub Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All Rights Reserved.
        </div>
      </div>
    </div>
  `;
}; 