import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Vendor } from '../models/vendor.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private api = inject(ApiService);

  createVendor(data: Vendor) {
    return this.api.post<Vendor>('/v1/vendors', data);
  }

  getVendors(): Observable<Vendor[]> {
    return this.api.get<Vendor[]>('/v1/vendors');
  }

  getVendorById(id: string | number): Observable<Vendor> {
    return this.api.get<Vendor>(`/v1/vendors/${id}`);
  }

  updateVendor(id: string | number, data: Partial<Vendor>): Observable<Vendor> {
    return this.api.put<Vendor>(`/v1/vendors/${id}`, data);
  }

  deleteVendor(id: string | number): Observable<void> {
    return this.api.delete<void>(`/v1/vendors/${id}`);
  }

  approveVendor(id: string | number): Observable<Vendor> {
    return this.api.post<Vendor>(`/v1/vendors/${id}/approve`, {});
  }

  rejectVendor(id: string | number): Observable<Vendor> {
    return this.api.post<Vendor>(`/v1/vendors/${id}/reject`, {});
  }

  updateVendorStatus(id: string | number, status: string): Observable<Vendor> {
    const params = new HttpParams().set('status', status);
    return this.api.put<Vendor>(`/v1/vendors/${id}/status`, {}, undefined, params);
  }

  uploadLogo(id: string | number, file: File): Observable<Vendor> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Vendor>(`/v1/vendors/${id}/logo`, formData);
  }
}
