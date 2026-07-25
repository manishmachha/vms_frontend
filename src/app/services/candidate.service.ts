import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Candidate } from '../candidates/models/candidate.model';
import { Observable } from 'rxjs';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  private api = inject(ApiService);
  private readonly BASE_URL = '/candidates';

  getCandidates(
    page: number = 0,
    size: number = 20,
    search?: string,
    sort?: string,
    filterType?: string,
    source?: string
  ): Observable<Page<Candidate>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);
    if (filterType) params = params.set('filterType', filterType);
    if (source) params = params.set('source', source);
    return this.api.get<Page<Candidate>>(this.BASE_URL, params);
  }

  getCandidate(id: string | number): Observable<Candidate> {
    return this.api.get<Candidate>(`${this.BASE_URL}/${id}`);
  }

  updateResume(id: string | number, file: File): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Candidate>(`${this.BASE_URL}/${id}/resume`, formData);
  }

  uploadResume(file: File, source: string): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    if (source) {
      formData.append('source', source);
    }
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
