import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Candidate } from '../models/candidate.model';
import { Observable } from 'rxjs';
import { JobApplication } from '../../models/application.model';
import { Interview } from '../../models/interview.model';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  private api = inject(ApiService);
  private readonly BASE_URL = '/candidates';

  /**
   * Get all candidates (Vendor gets theirs, Admin gets all)
   */
  getCandidates(): Observable<Candidate[]> {
    return this.api.get<Candidate[]>(this.BASE_URL);
  }

  /**
   * Get a single candidate by ID
   */
  getCandidate(id: string): Observable<Candidate> {
    return this.api.get<Candidate>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Create a candidate by uploading a resume (AI Parsing)
   */
  updateResume(id: string, file: File): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Candidate>(`${this.BASE_URL}/${id}/resume`, formData);
  }

  uploadResume(file: File): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Candidate>(`${this.BASE_URL}/upload`, formData);
  }

  /**
   * Create a candidate manually (without resume)
   */
  createManual(data: Partial<Candidate>): Observable<Candidate> {
    return this.api.post<Candidate>(`${this.BASE_URL}/manual`, data);
  }

  /**
   * Update candidate details
   */
  updateCandidate(id: string, data: Partial<Candidate>): Observable<Candidate> {
    return this.api.put<Candidate>(`${this.BASE_URL}/${id}`, data);
  }

  /**
   * Delete candidate
   */
  deleteCandidate(id: string): Observable<void> {
    return this.api.delete<void>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Download resume file
   */
  downloadResume(id: string): Observable<Blob> {
    return this.api.download(`${this.BASE_URL}/${id}/resume`);
  }

  archiveCandidate(id: string): Observable<Candidate> {
    return this.api.post<Candidate>(`${this.BASE_URL}/${id}/archive`, {});
  }

  getCandidateApplications(id: string): Observable<JobApplication[]> {
    return this.api.get<JobApplication[]>(`${this.BASE_URL}/${id}/applications`);
  }

  getCandidateInterviews(id: string): Observable<Interview[]> {
    return this.api.get<Interview[]>(`${this.BASE_URL}/${id}/interviews`);
  }

  getDashboardStats(id: string): Observable<DashboardStatsResponse> {
    return this.api.get<DashboardStatsResponse>(`${this.BASE_URL}/${id}/dashboard-stats`);
  }
}
