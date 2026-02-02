/**
 * Email templates for library platform user onboarding.
 * Uses application theme: brand primary #4f46e5, heading #111827, bg #fdfdfd, etc.
 * - New user: welcome to the library platform + login credentials + permissions.
 * - Creator: notification that a new user was onboarded to the platform.
 */

const theme = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  heading: '#111827',
  body: '#374151',
  accent: '#64748b',
  border: '#e2e8f0',
  bg: '#fdfdfd',
  cardBg: '#ffffff',
  muted: '#6b7280',
  codeBg: '#e5e7eb',
  shadow: '0 4px 4px rgba(241, 241, 241, 0.25)',
};

export const libraryUserOnboardNewUserTemplate = (payload: {
  libraryName: string;
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  role?: string;
  permissions?: string[];
}): string => {
  const roleLabel = payload.role ? ` (${payload.role.replace(/_/g, ' ')})` : '';
  const permissionsList =
    payload.permissions && payload.permissions.length > 0
      ? payload.permissions.map((p) => `<li style="margin: 4px 0;">${p.replace(/_/g, ' ')}</li>`).join('')
      : '<li style="margin: 4px 0; color: #64748b;">No additional permissions assigned.</li>';

  return `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; padding: 20px; background-color: ${theme.bg}; color: ${theme.body};">
      <div style="max-width: 600px; margin: 0 auto; background-color: ${theme.cardBg}; border-radius: 8px; overflow: hidden; box-shadow: ${theme.shadow}; border: 1px solid ${theme.border};">
        <div style="padding: 24px; border-bottom: 1px solid ${theme.border}; background-color: ${theme.primary}; color: #fff;">
          <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 1.5rem;">Welcome to the library platform</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 0.95rem;">${payload.libraryName}</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; color: ${theme.heading}; font-size: 15px;">Dear <strong>${payload.firstName} ${payload.lastName}</strong>,</p>
          <p style="margin: 0 0 20px 0; line-height: 1.6; color: ${theme.body};">
            You have been onboarded to the library platform <strong>${payload.libraryName}</strong>${roleLabel}. You can sign in using the credentials below.
          </p>
          <div style="background-color: #eef2ff; border-left: 4px solid ${theme.primary}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 1rem; color: ${theme.primaryHover};">Your login credentials</h2>
            <p style="margin: 6px 0;"><strong>Email:</strong> ${payload.email}</p>
            <p style="margin: 6px 0;"><strong>Temporary password:</strong> <code style="background-color: ${theme.codeBg}; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${payload.temporaryPassword}</code></p>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: ${theme.muted};">Please sign in and change your password after your first login.</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid ${theme.border}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 10px 0; font-family: Georgia, serif; font-size: 1rem; color: ${theme.heading};">Your permissions on this platform</h2>
            <ul style="margin: 0; padding-left: 20px; color: ${theme.body};">
              ${permissionsList}
            </ul>
          </div>
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 14px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Security:</strong> Keep your credentials private. Do not share this email. Change your password after you log in.</p>
          </div>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${theme.muted};">If you did not expect this invitation, please contact your library administrator.</p>
          <p style="margin: 20px 0 0 0;">Best regards,<br><strong>${payload.libraryName}</strong></p>
        </div>
        <div style="padding: 16px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: ${theme.muted}; border-top: 1px solid ${theme.border};">
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
  permissions?: string[];
}): string => {
  const roleLabel = payload.newUserRole.replace(/_/g, ' ');
  const permissionsList =
    payload.permissions && payload.permissions.length > 0
      ? payload.permissions.map((p) => `<li style="margin: 4px 0;">${p.replace(/_/g, ' ')}</li>`).join('')
      : '<li style="margin: 4px 0; color: #64748b;">None</li>';

  return `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; padding: 20px; background-color: ${theme.bg}; color: ${theme.body};">
      <div style="max-width: 600px; margin: 0 auto; background-color: ${theme.cardBg}; border-radius: 8px; overflow: hidden; box-shadow: ${theme.shadow}; border: 1px solid ${theme.border};">
        <div style="padding: 24px; border-bottom: 1px solid ${theme.border}; background-color: ${theme.heading}; color: #fff;">
          <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 1.5rem;">New user onboarded to the library platform</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 0.95rem;">${payload.libraryName}</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; color: ${theme.heading}; font-size: 15px;">Hi <strong>${payload.creatorFirstName} ${payload.creatorLastName}</strong>,</p>
          <p style="margin: 0 0 20px 0; line-height: 1.6; color: ${theme.body};">
            A new user has been successfully onboarded to the library platform <strong>${payload.libraryName}</strong>. A welcome email with login credentials has been sent to them.
          </p>
          <div style="background-color: #f8fafc; border-left: 4px solid ${theme.accent}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 10px 0; font-family: Georgia, serif; font-size: 1rem; color: ${theme.heading};">New user details</h2>
            <p style="margin: 6px 0;"><strong>Name:</strong> ${payload.newUserFirstName} ${payload.newUserLastName}</p>
            <p style="margin: 6px 0;"><strong>Email:</strong> ${payload.newUserEmail}</p>
            <p style="margin: 6px 0;"><strong>Role:</strong> ${roleLabel}</p>
            <p style="margin: 6px 0;"><strong>Platform:</strong> ${payload.libraryName}</p>
            <p style="margin: 10px 0 0 0;"><strong>Permissions:</strong></p>
            <ul style="margin: 4px 0 0 0; padding-left: 20px;">
              ${permissionsList}
            </ul>
          </div>
          <p style="margin: 0; font-size: 14px; color: ${theme.muted};">The new user can sign in with the temporary password sent to their email. They are encouraged to change it after first login.</p>
          <p style="margin: 20px 0 0 0;">Best regards,<br><strong>Smart Edu Hub</strong></p>
        </div>
        <div style="padding: 16px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: ${theme.muted}; border-top: 1px solid ${theme.border};">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
        </div>
      </div>
    </div>
  `;
};
