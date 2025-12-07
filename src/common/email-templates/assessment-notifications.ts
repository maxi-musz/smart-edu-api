// Assessment notification email templates

export const assessmentPublishedTemplate = (payload: {
  studentName: string;
  assessmentTitle: string;
  subjectName: string;
  schoolName: string;
  publishedDate: string;
  assessmentType?: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
          <h2>📝 New Assessment Published</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Assessment Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Hello <strong>${payload.studentName}</strong>,</p>
          
          <p>A new assessment has been published for you at <strong>${payload.schoolName}</strong>:</p>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📚 Assessment Details</h3>
            <div style="color: #1e40af;">
              <p style="margin: 5px 0;"><strong>Title:</strong> ${payload.assessmentTitle}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${payload.subjectName}</p>
              ${payload.assessmentType ? `<p style="margin: 5px 0;"><strong>Type:</strong> ${payload.assessmentType}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Published:</strong> ${payload.publishedDate}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Assessment</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Please log in to your Smart Edu Hub account to view and complete the assessment.
          </p>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #eee; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from Smart Edu Hub</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

export const assessmentUnpublishedTemplate = (payload: {
  studentName: string;
  assessmentTitle: string;
  subjectName: string;
  schoolName: string;
  unpublishedDate: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
          <h2>⚠️ Assessment Unpublished</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Assessment Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Hello <strong>${payload.studentName}</strong>,</p>
          
          <p>An assessment has been unpublished at <strong>${payload.schoolName}</strong>:</p>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">📚 Assessment Details</h3>
            <div style="color: #92400e;">
              <p style="margin: 5px 0;"><strong>Title:</strong> ${payload.assessmentTitle}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${payload.subjectName}</p>
              <p style="margin: 5px 0;"><strong>Unpublished:</strong> ${payload.unpublishedDate}</p>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This assessment is no longer available. If you have any questions, please contact your teacher or school administrator.
          </p>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #eee; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from Smart Edu Hub</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

export const assessmentResultReleasedTemplate = (payload: {
  studentName: string;
  assessmentTitle: string;
  subjectName: string;
  schoolName: string;
  releasedDate: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
          <h2>🎉 Assessment Results Released!</h2>
          <p style="margin: 0; opacity: 0.9;">Smart Edu Hub - Results Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>Hello <strong>${payload.studentName}</strong>,</p>
          
          <p>Great news! Your assessment results have been released at <strong>${payload.schoolName}</strong>:</p>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">📊 Assessment Details</h3>
            <div style="color: #065f46;">
              <p style="margin: 5px 0;"><strong>Title:</strong> ${payload.assessmentTitle}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${payload.subjectName}</p>
              <p style="margin: 5px 0;"><strong>Results Released:</strong> ${payload.releasedDate}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Results</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Please log in to your Smart Edu Hub account to view your detailed results and feedback.
          </p>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #eee; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from Smart Edu Hub</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

