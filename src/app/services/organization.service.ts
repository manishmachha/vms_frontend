import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { ApiResponse, Organization, Vendor } from '../models/organization.model';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.dev';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  getAllOrganizations(): Observable<Organization[]> {
    return this.api.get<Organization[]>('/v1/organizations');
  }

  getVendors(): Observable<Vendor[]> {
    return this.api.get<Vendor[]>('/v1/organizations/type/VENDOR');
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

  approveVendor(id: string | number): Observable<Organization> {
    return this.api.post<Organization>(`/v1/organizations/${id}/approve`, {});
  }

  rejectVendor(id: string | number): Observable<Organization> {
    return this.api.post<Organization>(`/v1/organizations/${id}/reject`, {});
  }

  updateStatus(id: string | number, status: string): Observable<Organization> {
    const params = new HttpParams().set('status', status);
    return this.api.put<Organization>(`/v1/organizations/${id}/status`, {}, undefined, params);
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

  getDashboardStats(id: string | number): Observable<DashboardStatsResponse> {
    return this.api.get<DashboardStatsResponse>(`/v1/organizations/${id}/dashboard-stats`);
  }
}
