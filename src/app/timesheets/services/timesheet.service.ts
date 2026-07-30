import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Timesheet, CreateTimesheetRequest, UpdateTimesheetStatusRequest, TimesheetStats } from '../models/timesheet.model';
import { Page } from '../../models/page.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  private api = inject(ApiService);
  private readonly BASE_URL = '/timesheets';

  getTimesheets(page: number = 0, size: number = 20, status?: string, vendorId?: string, sort?: string, direction?: string): Observable<Page<Timesheet>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status) params = params.set('status', status);
    if (vendorId) params = params.set('vendorId', vendorId);
    if (sort) params = params.set('sort', `${sort},${direction || 'asc'}`);
    
    return this.api.get<Page<Timesheet>>(this.BASE_URL, params);
  }

  getTimesheetStats(vendorId?: string): Observable<TimesheetStats> {
    let params = new HttpParams();
    if (vendorId) params = params.set('vendorId', vendorId);
    return this.api.get<TimesheetStats>(`${this.BASE_URL}/stats`, params);
  }

  getTimesheetById(id: number | string): Observable<Timesheet> {
    return this.api.get<Timesheet>(`${this.BASE_URL}/${id}`);
  }

  createTimesheet(data: CreateTimesheetRequest): Observable<Timesheet> {
    return this.api.post<Timesheet>(this.BASE_URL, data);
  }

  updateTimesheet(id: number | string, data: CreateTimesheetRequest): Observable<Timesheet> {
    return this.api.put<Timesheet>(`${this.BASE_URL}/${id}`, data);
  }

  updateStatus(id: number | string, data: UpdateTimesheetStatusRequest): Observable<Timesheet> {
    return this.api.put<Timesheet>(`${this.BASE_URL}/${id}/status`, data);
  }

  uploadInvoice(id: number | string, file: File): Observable<Timesheet> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Timesheet>(`${this.BASE_URL}/${id}/invoice`, formData);
  }

  downloadInvoice(id: number | string): Observable<Blob> {
    return this.api.download(`${this.BASE_URL}/${id}/invoice`);
  }

  deleteTimesheet(id: number | string): Observable<void> {
    return this.api.delete<void>(`${this.BASE_URL}/${id}`);
  }
}
