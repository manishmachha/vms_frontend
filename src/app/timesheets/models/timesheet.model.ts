export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUESTED';

export interface TimesheetEntry {
  id?: number;
  entryDate: string;
  hours: number;
  taskDescription: string;
}

export interface Timesheet {
  id: number;
  employeeId: number;
  employeeName: string;
  projectAllocationId: number;
  projectName: string;
  projectRequestId: string;
  weekStartDate: string;
  weekEndDate: string;
  status: TimesheetStatus;
  totalHours: number;
  managerNotes?: string;
  employeeNotes?: string;
  invoiceOriginalFileName?: string;
  entries: TimesheetEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimesheetRequest {
  projectAllocationId: number;
  weekStartDate: string;
  weekEndDate: string;
  employeeNotes?: string;
  entries: TimesheetEntry[];
  submit: boolean; // If true, sets status to SUBMITTED, else DRAFT
}

export interface UpdateTimesheetStatusRequest {
  status: TimesheetStatus;
  managerNotes?: string;
}
