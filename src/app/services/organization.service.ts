import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Organization } from '../models/auth.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.dev';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  getAllOrganizations(): Observable<Organization[]> {
    return this.api.get<Organization[]>('/v1/organizations');
  }

  getOrganizationById(id: string | number): Observable<Organization> {
    return this.api.get<Organization>(`/v1/organizations/${id}`);
  }

  createOrganization(data: Partial<Organization>): Observable<Organization> {
    return this.api.post<Organization>('/v1/organizations', data);
  }

  updateOrganization(id: string | number, data: Partial<Organization>): Observable<Organization> {
    return this.api.put<Organization>(`/v1/organizations/${id}`, data);
  }

  deleteOrganization(id: string | number): Observable<void> {
    return this.api.delete<void>(`/v1/organizations/${id}`);
  }

  uploadLogo(id: string | number, file: File): Observable<Organization> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<Organization>>(
        `${environment.apiUrl}/v1/organizations/${id}/logo`,
        formData,
      )
      .pipe(map((res) => res.data));
  }

  getApprovedOrganizations(): Observable<Organization[]> {
    return this.api.get<Organization[]>('/v1/organizations/approved');
  }

  getHandbookUrl(): Observable<{ url: string }> {
    return this.api.get<{ url: string }>('/v1/organizations/handbook');
  }

  uploadHandbook(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post('/v1/organizations/handbook', formData);
  }
}
