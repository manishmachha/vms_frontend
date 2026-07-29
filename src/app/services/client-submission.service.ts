import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ClientSubmission {
  id: number;
  candidateId: number;
  candidateName: string;
  clientId: number;
  clientName: string;
  jobId?: number;
  jobTitle?: string;
  externalReferenceId?: string;
  remarks?: string;
  status: ClientSubmissionStatus;
  submittedAt: string;
  submittedById?: number;
  submittedByFirstName?: string;
}

export type ClientSubmissionStatus =
  | 'SUBMITTED'
  | 'CLIENT_SCREENING'
  | 'CLIENT_INTERVIEW'
  | 'CLIENT_OFFERED'
  | 'CLIENT_REJECTED'
  | 'ONBOARDING'
  | 'WITHDRAWN';

export interface CreateSubmissionRequest {
  candidateId: number;
  clientId: string;
  jobId?: number;
  externalReferenceId?: string;
  remarks?: string;
}

export interface UpdateStatusRequest {
  status: ClientSubmissionStatus;
  remarks?: string;
}

export interface ClientSubmissionComment {
  id: number;
  commentText: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    role?: string;
  };
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ClientSubmissionService {
  private api = inject(ApiService);
  private apiUrl = `/client-submissions`;

  getSubmissionsByCandidate(candidateId: string | number): Observable<ClientSubmission[]> {
    return this.api.get<ClientSubmission[]>(`${this.apiUrl}?candidateId=${candidateId}`);
  }

  getSubmissionsByClient(clientId: string | number): Observable<ClientSubmission[]> {
    return this.api.get<ClientSubmission[]>(`${this.apiUrl}?clientId=${clientId}`);
  }

  createSubmission(request: CreateSubmissionRequest): Observable<ClientSubmission> {
    return this.api.post<ClientSubmission>(this.apiUrl, request);
  }

  updateStatus(id: string | number, request: UpdateStatusRequest): Observable<ClientSubmission> {
    return this.api.put<ClientSubmission>(`${this.apiUrl}/${id}/status`, request);
  }

  updateDetails(
    id: string | number,
    externalReferenceId?: string,
    remarks?: string,
  ): Observable<ClientSubmission> {
    return this.api.put<ClientSubmission>(`${this.apiUrl}/${id}`, {
      externalReferenceId,
      remarks,
    });
  }

  getComments(submissionId: string | number): Observable<ClientSubmissionComment[]> {
    return this.api.get<ClientSubmissionComment[]>(`${this.apiUrl}/${submissionId}/comments`);
  }

  addComment(
    submissionId: string | number,
    commentText: string,
  ): Observable<ClientSubmissionComment> {
    return this.api.post<ClientSubmissionComment>(`${this.apiUrl}/${submissionId}/comments`, { commentText });
  }
}
