import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  JobApplication,
  ApplicationStatus,
} from '../models/application.model';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private api = inject(ApiService);

  apply(jobId: string | number, formData: FormData) {
    return this.api.post<JobApplication>(`/applications/jobs/${jobId}/apply`, formData);
  }

  publicApply(jobId: string | number, formData: FormData) {
    return this.api.post<JobApplication>(`/public/applications/jobs/${jobId}/apply`, formData);
  }

  getApplications(
    jobId?: string,
    page: number = 0,
    size: number = 20,
    mode: 'INBOUND' | 'OUTBOUND' = 'INBOUND',
    search?: string,
    status?: ApplicationStatus,
  ) {
    let params = new HttpParams().set('page', page).set('size', size).set('mode', mode);

    if (jobId) {
      params = params.set('jobId', jobId);
    }
    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.api.get<Page<JobApplication>>('/applications', params);
  }

  updateStatus(id: string | number, status: ApplicationStatus) {
    return this.api.post<JobApplication>(`/applications/${id}/status`, { status });
  }

  deleteApplication(id: string | number) {
    return this.api.delete<void>(`/applications/${id}`);
  }

  makeClientDecision(id: string | number, approved: boolean, feedback: string) {
    return this.api.post<JobApplication>(`/applications/${id}/decision`, { approved, feedback });
  }

  getLatestAnalysis(id: string | number) {
    return this.api.get<any>(`/applications/${id}/analysis`);
  }

  getDocuments(id: string | number) {
    return this.api.get<any[]>(`/applications/${id}/documents`);
  }

  getTimeline(id: string | number, page: number = 0, size: number = 50) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api.get<any>(`/applications/${id}/timeline`, params);
  }

  addTimelineEvent(id: string | number, event: any) {
    return this.api.post(`/applications/${id}/timeline`, event);
  }

  runAnalysis(id: string | number) {
    return this.api.post<void>(`/applications/${id}/analysis`, {});
  }

  downloadDocument(docId: string) {
    return this.api.download(`/applications/documents/${docId}/download`);
  }

  downloadResume(id: string | number) {
    return this.api.download(`/applications/${id}/resume/download`);
  }

  uploadDocument(id: string | number, category: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.api.post(`/applications/${id}/documents`, formData);
  }

  getApplicationDetails(id: number | string) {
    return this.api.get<JobApplication>(`/applications/${id}`);
  }

  getDashboardStats(id: string | number): Observable<DashboardStatsResponse> {
    return this.api.get<DashboardStatsResponse>(`/applications/${id}/dashboard-stats`);
  }
}
