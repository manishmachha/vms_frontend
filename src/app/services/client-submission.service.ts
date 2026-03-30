import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.dev';

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
  clientId: number;
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
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/client-submissions`;

  getSubmissionsByCandidate(candidateId: string | number): Observable<ClientSubmission[]> {
    return this.http
      .get<ApiResponse<ClientSubmission[]>>(`${this.apiUrl}?candidateId=${candidateId}`)
      .pipe(map((res) => res.data));
  }

  getSubmissionsByClient(clientId: string | number): Observable<ClientSubmission[]> {
    return this.http
      .get<ApiResponse<ClientSubmission[]>>(`${this.apiUrl}?clientId=${clientId}`)
      .pipe(map((res) => res.data));
  }

  createSubmission(request: CreateSubmissionRequest): Observable<ClientSubmission> {
    return this.http
      .post<ApiResponse<ClientSubmission>>(this.apiUrl, request)
      .pipe(map((res) => res.data));
  }

  updateStatus(id: string | number, request: UpdateStatusRequest): Observable<ClientSubmission> {
    return this.http
      .put<ApiResponse<ClientSubmission>>(`${this.apiUrl}/${id}/status`, request)
      .pipe(map((res) => res.data));
  }

  updateDetails(
    id: string | number,
    externalReferenceId?: string,
    remarks?: string,
  ): Observable<ClientSubmission> {
    return this.http
      .put<ApiResponse<ClientSubmission>>(`${this.apiUrl}/${id}`, {
        externalReferenceId,
        remarks,
      })
      .pipe(map((res) => res.data));
  }

  getComments(submissionId: string | number): Observable<ClientSubmissionComment[]> {
    return this.http
      .get<ApiResponse<ClientSubmissionComment[]>>(`${this.apiUrl}/${submissionId}/comments`)
      .pipe(map((res) => res.data));
  }

  addComment(
    submissionId: string | number,
    commentText: string,
  ): Observable<ClientSubmissionComment> {
    return this.http
      .post<
        ApiResponse<ClientSubmissionComment>
      >(`${this.apiUrl}/${submissionId}/comments`, { commentText })
      .pipe(map((res) => res.data));
  }
}
