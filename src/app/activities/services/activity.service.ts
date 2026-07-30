import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorEmail: string;
  actorId: string;
  organizationId: string;
  entityLabel: string;
  message: string;
  changes: any[];
  timestamp: string;
  read: boolean;
}

export interface ActivityLogStatsResponse {
  totalCreates: number;
  totalUpdates: number;
  totalDeletes: number;
  totalActivities: number;
  activitiesByCategory: { [key: string]: number };
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private api = inject(ApiService);
  private apiUrl = `/activities`;

  getActivities(
    organizationId?: string,
    actionType?: string,
    category?: string,
    search?: string,
    user?: string,
    page: number = 0,
    size: number = 20,
    sortField: string = 'timestamp',
    sortDirection: string = 'desc',
    entityId?: string
  ): Observable<Page<ActivityLog>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortField', sortField)
      .set('sortDirection', sortDirection);

    if (organizationId) params = params.set('organizationId', organizationId);
    if (actionType) params = params.set('actionType', actionType);
    if (category) params = params.set('category', category);
    if (search) params = params.set('search', search);
    if (user) params = params.set('user', user);
    if (entityId) params = params.set('entityId', entityId);

    return this.api.get<Page<ActivityLog>>(this.apiUrl, params);
  }

  getActivityStats(organizationId?: string): Observable<ActivityLogStatsResponse> {
    let params = new HttpParams();
    if (organizationId) params = params.set('organizationId', organizationId);
    
    return this.api.get<ActivityLogStatsResponse>(`${this.apiUrl}/stats`, params);
  }
}
