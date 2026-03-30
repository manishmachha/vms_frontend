export type InterviewType = 'SCREENING' | 'TECHNICAL' | 'HR' | 'CLIENT_ROUND' | 'FINAL';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Interview {
  id: number;
  applicationId: number;
  application?: {
    id: number;
    candidate?: {
      firstName: string;
      lastName: string;
    };
    job?: {
      title: string;
    };
  };
  interviewerId: number;
  interviewer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  scheduledAt: string;
  durationMinutes: number;
  type: InterviewType;
  status: InterviewStatus;
  meetingLink: string;
  feedback?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleInterviewRequest {
  applicationId: number;
  interviewerId?: number;
  scheduledAt: string;
  durationMinutes: number;
  type: InterviewType;
  meetingLink?: string;
}
