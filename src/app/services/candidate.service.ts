import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Candidate } from '../candidates/models/candidate.model';
import { Observable } from 'rxjs';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  private api = inject(ApiService);
  private readonly BASE_URL = '/candidates';

  getCandidates(): Observable<Candidate[]> {
    return this.api.get<Candidate[]>(this.BASE_URL);
  }

  getCandidate(id: string | number): Observable<Candidate> {
    return this.api.get<Candidate>(`${this.BASE_URL}/${id}`);
  }

  updateResume(id: string | number, file: File): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Candidate>(`${this.BASE_URL}/${id}/resume`, formData);
  }

  uploadResume(file: File): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Candidate>(`${this.BASE_URL}/upload`, formData);
  }

  updateCandidate(id: string | number, data: Partial<Candidate>): Observable<Candidate> {
    return this.api.put<Candidate>(`${this.BASE_URL}/${id}`, data);
  }

  deleteCandidate(id: string | number): Observable<void> {
    return this.api.delete<void>(`${this.BASE_URL}/${id}`);
  }

  downloadResume(id: string | number): Observable<Blob> {
    return this.api.download(`${this.BASE_URL}/${id}/resume`);
  }

  getDashboardStats(id: string | number): Observable<DashboardStatsResponse> {
    return this.api.get<DashboardStatsResponse>(`${this.BASE_URL}/${id}/dashboard-stats`);
  }
}
