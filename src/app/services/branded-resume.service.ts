import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { BrandedResume } from '../candidates/models/branded-resume.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BrandedResumeService {
  private api = inject(ApiService);

  getAll(): Observable<BrandedResume[]> {
    return this.api.get<BrandedResume[]>('/branded-resumes');
  }

  getById(id: string | number): Observable<BrandedResume> {
    return this.api.get<BrandedResume>(`/branded-resumes/${id}`);
  }

  download(id: string | number): Observable<Blob> {
    return this.api.download(`/branded-resumes/${id}/download`);
  }

  getForCandidate(candidateId: string | number): Observable<BrandedResume[]> {
    return this.api.get<BrandedResume[]>(`/candidates/${candidateId}/branded-resumes`);
  }

  getLatest(candidateId: string | number): Observable<BrandedResume | null> {
    return this.api.get<BrandedResume | null>(
      `/candidates/${candidateId}/branded-resumes/latest`,
    );
  }

  downloadLatest(candidateId: string | number): Observable<Blob> {
    return this.api.download(`/candidates/${candidateId}/branded-resumes/latest/download`);
  }

  regenerate(candidateId: string | number): Observable<string> {
    return this.api.post<string>(`/candidates/${candidateId}/branded-resumes/regenerate`);
  }
}
