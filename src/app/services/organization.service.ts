import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { ApiResponse, Organization, Vendor } from '../models/organization.model';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { Page } from '../models/page.model';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  getAllOrganizations(
    page: number = 0,
    size: number = 20,
    search?: string,
    type?: string,
    status?: string,
    sort?: string
  ): Observable<Page<Organization>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (type && type !== 'ALL') params = params.set('type', type);
    if (status && status !== 'ALL') params = params.set('status', status);
    if (sort) params = params.set('sort', sort);
    return this.api.get<Page<Organization>>('/v1/organizations', params);
  }

  getVendors(
    page: number = 0,
    size: number = 20,
    search?: string,
    status?: string,
    sort?: string
  ): Observable<Page<Vendor>> {
    let params = new HttpParams()
      .set('type', 'VENDOR')
      .set('page', page.toString())
      .set('size', size.toString());
    if (search) params = params.set('search', search);
    if (status && status !== 'ALL') params = params.set('status', status);
    if (sort) params = params.set('sort', sort);
    return this.api.get<Page<Vendor>>('/v1/organizations', params);
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
