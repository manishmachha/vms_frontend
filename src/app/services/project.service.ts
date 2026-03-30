import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Project, ProjectAllocation } from '../models/project.model';

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
  candidateId: number;
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

  getProjects() {
    return this.api.get<Project[]>('/projects');
  }

  getProject(id: number) {
    return this.api.get<Project>(`/projects/${id}`);
  }

  createProject(request: CreateProjectRequest) {
    return this.api.post<Project>('/projects', request);
  }

  updateProject(id: number, request: UpdateProjectRequest) {
    return this.api.put<Project>(`/projects/${id}`, request);
  }

  updateStatus(id: number, request: UpdateStatusRequest) {
    return this.api.put<Project>(`/projects/${id}/status`, request);
  }

  deleteProject(id: number) {
    return this.api.delete<void>(`/projects/${id}`);
  }

  getAllocations(projectId: number) {
    return this.api.get<ProjectAllocation[]>(`/projects/${projectId}/allocations`);
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

  deallocateUser(projectId: number, allocationId: number) {
    return this.api.delete<void>(`/projects/${projectId}/allocations/${allocationId}`);
  }
}
