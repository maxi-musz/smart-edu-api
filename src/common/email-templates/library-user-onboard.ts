/**
 * Email templates for library user onboarding.
 * - New user: welcome + login credentials + prompt to change password.
 * - Creator: notification that a new library user was created.
 */

export const libraryUserOnboardNewUserTemplate = (payload: {
  libraryName: string;
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  role?: string;
}): string => {
  const roleLabel = payload.role ? ` (${payload.role.replace(/_/g, ' ')})` : '';
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white;">
          <h2 style="margin: 0;">Welcome to ${payload.libraryName}</h2>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Library Team Onboarding</p>
        </div>
        <div style="padding: 20px;">
          <p>Dear <strong>${payload.firstName} ${payload.lastName}</strong>,</p>
          <p>You have been added as a library user${roleLabel} to <strong>${payload.libraryName}</strong>. Below are your login credentials.</p>
          <div style="background-color: #eef2ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #3730a3;">Your login credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 5px 0;"><strong>Temporary password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 3px; font-family: monospace; font-size: 14px;">${payload.temporaryPassword}</code></p>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: #6b7280;">Please sign in and change your password after your first login for security.</p>
          </div>
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>Security:</strong> Keep your credentials private. Do not share this email. Change your password as soon as you log in.</p>
          </div>
          <p>If you did not expect this invitation, please contact your library administrator.</p>
          <p>Best regards,<br><strong>${payload.libraryName} Team</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
        </div>
      </div>
    </div>
  `;
};

export const libraryUserOnboardCreatorTemplate = (payload: {
  creatorFirstName: string;
  creatorLastName: string;
  newUserFirstName: string;
  newUserLastName: string;
  newUserEmail: string;
  newUserRole: string;
  libraryName: string;
}): string => {
  const roleLabel = payload.newUserRole.replace(/_/g, ' ');
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background-color: #0f172a; color: white;">
          <h2 style="margin: 0;">New library user created</h2>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${payload.libraryName}</p>
        </div>
        <div style="padding: 20px;">
          <p>Hi <strong>${payload.creatorFirstName} ${payload.creatorLastName}</strong>,</p>
          <p>You have successfully created a new library user. A welcome email with login credentials has been sent to the new user.</p>
          <div style="background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #334155;">New user details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${payload.newUserFirstName} ${payload.newUserLastName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.newUserEmail}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${roleLabel}</p>
            <p style="margin: 5px 0;"><strong>Library:</strong> ${payload.libraryName}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280;">The new user can sign in with the temporary password sent to their email. They are encouraged to change it after first login.</p>
          <p>Best regards,<br><strong>Smart Edu Hub</strong></p>
        </div>
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
        </div>
      </div>
    </div>
  `;
};
