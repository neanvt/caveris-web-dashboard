/**
 * Exam API client
 * Uses the .NET Core API backend
 */

import { api } from '../api-client';

export interface CreateExamDTO {
  examName: string;
  examCode: string;
  description?: string;
  startDate: string;
  endDate: string;
  verificationMethods?: string[];
  maxVerificationAttempts?: number;
  offlineModeEnabled?: boolean;
  isTesting?: boolean;
}

export interface UpdateExamDTO {
  examName?: string;
  examCode?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  verificationMethods?: string[];
  maxVerificationAttempts?: number;
  offlineModeEnabled?: boolean;
  isTesting?: boolean;
}

export interface Exam {
  id: string;
  examName: string;
  examCode: string;
  description?: string;
  adminId: string;
  status: string;
  startDate: string;
  endDate: string;
  verificationMethods?: string[];
  maxVerificationAttempts: number;
  offlineModeEnabled: boolean;
  isTesting: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all exams
 */
export async function getAllExams(): Promise<{exams: Exam []}> {
  return api.get('/exams');
}

/**
 * Get single exam by ID
 */
export async function getExamById(id: string): Promise<Exam> {
  return api.get(`/exams/${id}`);
}

/**
 * Create new exam
 */
export async function createExam(data: CreateExamDTO): Promise<{exam: Exam}> {
  return api.post('/exams', data);
}

/**
 * Update exam
 */
export async function updateExam(id: string, data: UpdateExamDTO): Promise<{exam: Exam}> {
  return api.put(`/exams/${id}`, data);
}

/**
 * Delete exam
 */
export async function deleteExam(id: string): Promise<{message: string}> {
  return api.delete(`/exams/${id}`);
}
