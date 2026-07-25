import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { StatItem } from '../models/dashboard-stats.model';

export interface ChartData {
  label: string;
  value: number;
}

export interface RecentActivity {
  id: number;
  title: string;
  message: string;
  action: string;
  entityType: string;
  entityId: number;
  createdAt: string;
  metadata: any;
  orgName: string;
}

export interface DashboardStats {
  stats: StatItem[];
  employeesByDepartment: ChartData[];
  projectsByStatus: ChartData[];
  orgDistribution: ChartData[];
  recruitmentPipeline: ChartData[];
  recentActivity: RecentActivity[];
  recentInterviews: import('../models/interview.model').Interview[];
  totalActiveJobs: number;
  totalEmployees: number;
  totalApplications: number;
  pendingApprovals: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiService = inject(ApiService);
  private apiUrl = '/v1/admin/dashboard/stats';

  getStats(): Observable<DashboardStats> {
    return this.apiService.get<DashboardStats>(this.apiUrl);
  }
}
