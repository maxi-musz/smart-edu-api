/**
 * Email template when a library platform user's permissions are updated (added or removed).
 * Uses application theme: brand primary #4f46e5, heading #111827, etc.
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
  shadow: '0 4px 4px rgba(241, 241, 241, 0.25)',
};

export const libraryUserPermissionsUpdatedTemplate = (payload: {
  libraryName: string;
  firstName: string;
  lastName: string;
  addedPermissions: string[];
  removedPermissions: string[];
  currentPermissions: string[];
}): string => {
  const hasAdded = payload.addedPermissions.length > 0;
  const hasRemoved = payload.removedPermissions.length > 0;
  const addedList =
    hasAdded
      ? payload.addedPermissions.map((p) => `<li style="margin: 4px 0;">${p.replace(/_/g, ' ')}</li>`).join('')
      : '';
  const removedList =
    hasRemoved
      ? payload.removedPermissions.map((p) => `<li style="margin: 4px 0;">${p.replace(/_/g, ' ')}</li>`).join('')
      : '';
  const currentList =
    payload.currentPermissions.length > 0
      ? payload.currentPermissions.map((p) => `<li style="margin: 4px 0;">${p.replace(/_/g, ' ')}</li>`).join('')
      : '<li style="margin: 4px 0; color: #64748b;">No permissions assigned.</li>';

  return `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; padding: 20px; background-color: ${theme.bg}; color: ${theme.body};">
      <div style="max-width: 600px; margin: 0 auto; background-color: ${theme.cardBg}; border-radius: 8px; overflow: hidden; box-shadow: ${theme.shadow}; border: 1px solid ${theme.border};">
        <div style="padding: 24px; border-bottom: 1px solid ${theme.border}; background-color: ${theme.primary}; color: #fff;">
          <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 1.5rem;">Your permissions have been updated</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 0.95rem;">${payload.libraryName}</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; color: ${theme.heading}; font-size: 15px;">Dear <strong>${payload.firstName} ${payload.lastName}</strong>,</p>
          <p style="margin: 0 0 20px 0; line-height: 1.6; color: ${theme.body};">
            Your permissions on the library platform <strong>${payload.libraryName}</strong> have been updated. See the details below.
          </p>
          ${hasAdded ? `
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 10px 0; font-family: Georgia, serif; font-size: 1rem; color: #065f46;">Added</h2>
            <ul style="margin: 0; padding-left: 20px;">${addedList}</ul>
          </div>
          ` : ''}
          ${hasRemoved ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 10px 0; font-family: Georgia, serif; font-size: 1rem; color: #991b1b;">Removed</h2>
            <ul style="margin: 0; padding-left: 20px;">${removedList}</ul>
          </div>
          ` : ''}
          <div style="background-color: #f8fafc; border: 1px solid ${theme.border}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 10px 0; font-family: Georgia, serif; font-size: 1rem; color: ${theme.heading};">Your current permissions on this platform</h2>
            <ul style="margin: 0; padding-left: 20px;">${currentList}</ul>
          </div>
          <p style="margin: 0; font-size: 14px; color: ${theme.muted};">If you did not expect this change, please contact your library administrator.</p>
          <p style="margin: 20px 0 0 0;">Best regards,<br><strong>${payload.libraryName}</strong></p>
        </div>
        <div style="padding: 16px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: ${theme.muted}; border-top: 1px solid ${theme.border};">
          &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
        </div>
      </div>
    </div>
  `;
};
