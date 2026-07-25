import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  Job,
  JobCreateRequest,
  JobEnrichRequest,
  JobFinalVerifyRequest,
} from '../models/job.model';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private api = inject(ApiService);

  createJob(job: JobCreateRequest) {
    return this.api.post<Job>('/jobs', job);
  }

  getJobs(
    page: number = 0,
    size: number = 20,
    search?: string,
    status?: string,
    employmentType?: string,
    sort?: string
  ) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (employmentType) params = params.set('employmentType', employmentType);
    if (sort) params = params.set('sort', sort);
    return this.api.get<Page<Job>>('/jobs', params);
  }

  getJob(id: string | number) {
    return this.api.get<Job>(`/jobs/${id}`);
  }

  verifyJob(id: string | number) {
    return this.api.post<Job>(`/jobs/${id}/verify`, {});
  }

  enrichJob(id: string | number, data: JobEnrichRequest) {
    return this.api.post<Job>(`/jobs/${id}/enrich`, data);
  }

  finalVerifyJob(id: string | number, data: JobFinalVerifyRequest) {
    return this.api.post<Job>(`/jobs/${id}/approve`, data);
  }

  publishJob(id: string | number) {
    return this.api.post<Job>(`/jobs/${id}/publish`, {});
  }

  updateJob(id: string | number, data: any) {
    return this.api.put<Job>(`/jobs/${id}`, data);
  }

  deleteJob(id: string | number) {
    return this.api.delete<void>(`/jobs/${id}`);
  }

  updateStatus(id: string | number, status: string, message?: string) {
    return this.api.post<Job>(`/jobs/${id}/status`, { status, message });
  }

  getPublishedJobs(
    page: number = 0,
    size: number = 20,
    search?: string,
    employmentType?: string,
    sort?: string
  ) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    if (employmentType) params = params.set('employmentType', employmentType);
    if (sort) params = params.set('sort', sort);
    return this.api.get<Page<Job>>('/jobs/published', params);
  }
}
