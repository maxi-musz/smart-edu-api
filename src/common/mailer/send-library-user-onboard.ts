import * as colors from 'colors';
import { sendMail } from './send-mail';
import {
  libraryUserOnboardNewUserTemplate,
  libraryUserOnboardCreatorTemplate,
} from '../email-templates/library-user-onboard';

export interface LibraryUserOnboardNewUserPayload {
  to: string;
  libraryName: string;
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  role?: string;
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
    });
    await sendMail({
      to: payload.to,
      subject: `Welcome to ${payload.libraryName} – Your login details`,
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
