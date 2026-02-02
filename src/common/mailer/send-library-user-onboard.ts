import * as colors from 'colors';
import { sendMail } from './send-mail';
import {
  libraryUserOnboardNewUserTemplate,
  libraryUserOnboardCreatorTemplate,
} from '../email-templates/library-user-onboard';
import { libraryUserPermissionsUpdatedTemplate } from '../email-templates/library-user-permissions-updated';

export interface LibraryUserOnboardNewUserPayload {
  to: string;
  libraryName: string;
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  role?: string;
  permissions?: string[];
}

export interface LibraryUserOnboardCreatorPayload {
  to: string;
  creatorFirstName: string;
  creatorLastName: string;
  newUserFirstName: string;
  newUserLastName: string;
  newUserEmail: string;
  newUserRole: string;
  libraryName: string;
  permissions?: string[];
}

/** Send onboarding email to the new library user (login credentials). */
export const sendLibraryUserOnboardToNewUser = async (
  payload: LibraryUserOnboardNewUserPayload,
): Promise<void> => {
  try {
    const html = libraryUserOnboardNewUserTemplate({
      libraryName: payload.libraryName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      temporaryPassword: payload.temporaryPassword,
      role: payload.role,
      permissions: payload.permissions,
    });
    await sendMail({
      to: payload.to,
      subject: `Welcome to the library platform – Your login details`,
      html,
    });
    console.log(colors.green(`Library user onboarding email sent to ${payload.to}`));
  } catch (error) {
    console.error(colors.red('Error sending library user onboarding email to new user:'), error);
    throw error;
  }
};

/** Send notification to the creator (admin) that a new library user was created. */
export const sendLibraryUserOnboardToCreator = async (
  payload: LibraryUserOnboardCreatorPayload,
): Promise<void> => {
  try {
    const html = libraryUserOnboardCreatorTemplate({
      creatorFirstName: payload.creatorFirstName,
      creatorLastName: payload.creatorLastName,
      newUserFirstName: payload.newUserFirstName,
      newUserLastName: payload.newUserLastName,
      newUserEmail: payload.newUserEmail,
      newUserRole: payload.newUserRole,
      libraryName: payload.libraryName,
      permissions: payload.permissions,
    });
    await sendMail({
      to: payload.to,
      subject: `New library user created – ${payload.newUserFirstName} ${payload.newUserLastName}`,
      html,
    });
    console.log(colors.green(`Library user creation notification sent to ${payload.to}`));
  } catch (error) {
    console.error(colors.red('Error sending library user creation notification to creator:'), error);
    throw error;
  }
};

export interface LibraryUserPermissionsUpdatedPayload {
  to: string;
  libraryName: string;
  firstName: string;
  lastName: string;
  addedPermissions: string[];
  removedPermissions: string[];
  currentPermissions: string[];
}

/** Send email to a library user when their permissions are updated (added or removed). */
export const sendLibraryUserPermissionsUpdated = async (
  payload: LibraryUserPermissionsUpdatedPayload,
): Promise<void> => {
  try {
    const html = libraryUserPermissionsUpdatedTemplate({
      libraryName: payload.libraryName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      addedPermissions: payload.addedPermissions,
      removedPermissions: payload.removedPermissions,
      currentPermissions: payload.currentPermissions,
    });
    await sendMail({
      to: payload.to,
      subject: `Your permissions have been updated – ${payload.libraryName}`,
      html,
    });
    console.log(colors.green(`Library user permissions-updated email sent to ${payload.to}`));
  } catch (error) {
    console.error(colors.red('Error sending library user permissions-updated email:'), error);
    throw error;
  }
};
