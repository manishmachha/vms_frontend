import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Project, ProjectAllocation } from '../models/project.model';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';

// ========== REQUEST TYPES ==========

export interface CreateProjectRequest {
  name: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateStatusRequest {
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED';
}

export interface AllocateUserRequest {
  candidateId: string;
  startDate: string;
  endDate?: string;
  percentage?: number;
  billingRole?: string;
}

export interface UpdateAllocationRequest {
  startDate?: string;
  endDate?: string;
  percentage?: number;
  billingRole?: string;
  status?: 'ACTIVE' | 'ENDED' | 'PLANNED';
}

// ========== SERVICE ==========

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private api = inject(ApiService);

  getProjects(
    page: number = 0,
    size: number = 20,
    search?: string,
    sort?: string,
    status?: string,
    clientId?: string | number
  ): Observable<Page<Project>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);
    if (status) params = params.set('status', status);
    if (clientId) params = params.set('clientId', clientId.toString());
    return this.api.get<Page<Project>>('/projects', params);
  }

  getProject(id: string) {
    return this.api.get<Project>(`/projects/${id}`);
  }

  createProject(request: CreateProjectRequest) {
    return this.api.post<Project>('/projects', request);
  }

  updateProject(id: number, request: UpdateProjectRequest) {
    return this.api.put<Project>(`/projects/${id}`, request);
  }

  updateStatus(id: string, request: UpdateStatusRequest) {
    return this.api.put<Project>(`/projects/${id}/status`, request);
  }

  deleteProject(id: string) {
    return this.api.delete<void>(`/projects/${id}`);
  }

  getAllocations(
    projectId: string,
    page: number = 0,
    size: number = 10,
    search?: string,
    sort?: string,
    status?: string
  ): Observable<Page<ProjectAllocation>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);
    if (status) params = params.set('status', status);
    
    return this.api.get<Page<ProjectAllocation>>(`/projects/${projectId}/allocations`, params);
  }

  allocateUser(projectId: number, request: AllocateUserRequest) {
    return this.api.post<ProjectAllocation>(`/projects/${projectId}/allocate`, request);
  }

  updateAllocation(projectId: number, allocationId: number, request: UpdateAllocationRequest) {
    return this.api.put<ProjectAllocation>(
      `/projects/${projectId}/allocations/${allocationId}`,
      request,
    );
  }

  deallocateUser(projectId: string, allocationId: number) {
    return this.api.delete<void>(`/projects/${projectId}/allocations/${allocationId}`);
  }
}
