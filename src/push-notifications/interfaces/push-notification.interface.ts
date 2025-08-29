import { DeviceType } from '../dto/register-device.dto';

export interface IDeviceToken {
  id: string;
  token: string;
  deviceType: DeviceType;
  user_id: string;
  school_id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegisterDevice {
  token: string;
  deviceType: DeviceType;
  user_id: string;
  school_id: string;
}

export interface IPushMessage {
  to: string;
  sound: 'default' | 'default' | null;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  mutableContent?: boolean;
  priority?: 'default' | 'normal' | 'high';
  subtitle?: string;
  ttl?: number;
}

export interface IPushNotificationData {
  type: string;
  notificationId?: string;
  assignmentId?: string;
  teacherId?: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  screen?: string;
  [key: string]: any;
}

export interface ISendPushNotification {
  title: string;
  body: string;
  data?: IPushNotificationData;
  recipients?: string[];
  notificationType?: string;
  schoolId?: string;
}
