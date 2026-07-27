import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface EmployeeDashboardStats {
  activeProjects: number;
  pendingInterviews: number;
  openTickets: number;
  draftTimesheets: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeDashboardService {
  private api = inject(ApiService);

  getStats(): Observable<EmployeeDashboardStats> {
    return this.api.get<EmployeeDashboardStats>('/v1/employee/dashboard/stats');
  }
}
