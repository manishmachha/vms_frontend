import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Interview } from '../models/interview.model';

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

  getAllInterviews() {
    return this.api.get<Interview[]>('/interviews');
  }

  getVendorInterviews() {
    return this.api.get<Interview[]>('/interviews/vendor');
  }

  getInterviewById(id: number) {
    return this.api.get<Interview>(`/interviews/${id}`);
  }

  submitFeedback(interviewId: number, feedbackData: { feedback: string, rating: number, passed: boolean }) {
    return this.api.post<Interview>(`/interviews/${interviewId}/feedback`, feedbackData);
  }
}
