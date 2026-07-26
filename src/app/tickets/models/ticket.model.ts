import { User } from '../../models/auth.model';

export enum TicketCategory {
  ACCOUNT = 'ACCOUNT',
  JOB = 'JOB',
  CANDIDATE = 'CANDIDATE',
  APPLICATION = 'APPLICATION',
  INTERVIEW = 'INTERVIEW',
  OTHER = 'OTHER'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  Hold = 'HOLD',
  ESCALATED = 'ESCALATED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface TicketAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  sender: User;
  message: string;
  attachments: TicketAttachment[];
  createdAt: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: TicketCategory;
  refEntityId?: number;
  refEntityName?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: User;
  assignedTo?: User;
  ccUsers?: User[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketCreateRequest {
  title: string;
  description: string;
  category: TicketCategory;
  refEntityId?: number;
  priority: TicketPriority;
  ccUserIds?: number[];
}
