import { NotificationType } from '@prisma/client';

export interface INotification {
  id: string;
  school_id: string;
  academic_session_id: string;
  title: string;
  description: string;
  type: NotificationType;
  comingUpOn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNotification {
  school_id: string;
  academic_session_id: string;
  title: string;
  description: string;
  type: NotificationType;
  comingUpOn?: Date;
}

export interface IUpdateNotification {
  title?: string;
  description?: string;
  type?: NotificationType;
  comingUpOn?: Date;
}

export interface INotificationFilters {
  school_id: string;
  academic_session_id?: string;
  type?: NotificationType;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'createdAt' | 'title' | 'type';
  sort_order?: 'asc' | 'desc';
}

export interface INotificationPagination {
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
