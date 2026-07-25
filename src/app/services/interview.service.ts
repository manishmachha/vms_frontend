import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Interview } from '../models/interview.model';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private api = inject(ApiService);

  scheduleInterview(request: any) {
    return this.api.post<Interview>('/interviews/schedule', request);
  }

  updateInterview(id: number, request: any) {
    return this.api.put<Interview>(`/interviews/${id}`, request);
  }

  requestFeedback(id: number) {
    return this.api.post<any>(`/interviews/${id}/request-feedback`, {});
  }

  getInterviewsByApplication(applicationId: number) {
    return this.api.get<Interview[]>(`/interviews/application/${applicationId}`);
  }

  getAllInterviews(
    page: number = 0,
    size: number = 20,
    search?: string,
    sort?: string,
    status?: string
  ): Observable<Page<Interview>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);
    if (status) params = params.set('status', status);
    return this.api.get<Page<Interview>>('/interviews', params);
  }

  getVendorInterviews(
    page: number = 0,
    size: number = 20,
    search?: string,
    sort?: string,
    status?: string
  ): Observable<Page<Interview>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);
    if (status) params = params.set('status', status);
    return this.api.get<Page<Interview>>('/interviews/vendor', params);
  }

  getInterviewById(id: number) {
    return this.api.get<Interview>(`/interviews/${id}`);
  }

  submitFeedback(interviewId: number, feedbackData: { feedback: string, rating: number, passed: boolean }) {
    return this.api.post<Interview>(`/interviews/${interviewId}/feedback`, feedbackData);
  }
}
