import { AcademicTerm, AcademicSessionStatus } from '@prisma/client';

export interface IAcademicSession {
  id: string;
  school_id: string;
  academic_year: string;
  start_year: number;
  end_year: number;
  term: AcademicTerm;
  start_date: Date;
  end_date: Date;
  status: AcademicSessionStatus;
  is_current: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAcademicSession {
  school_id: string;
  academic_year: string;
  start_year: number;
  end_year: number;
  term: AcademicTerm;
  start_date: Date;
  end_date: Date;
  status?: AcademicSessionStatus;
  is_current?: boolean;
}

export interface IUpdateAcademicSession {
  academic_year?: string;
  start_year?: number;
  end_year?: number;
  term?: AcademicTerm;
  start_date?: Date;
  end_date?: Date;
  status?: AcademicSessionStatus;
  is_current?: boolean;
}

export interface IAcademicSessionFilters {
  school_id?: string;
  academic_year?: string;
  start_year?: number;
  end_year?: number;
  term?: AcademicTerm;
  status?: AcademicSessionStatus;
  is_current?: boolean;
}

export interface IAcademicSessionQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
