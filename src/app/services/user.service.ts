import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  User,
  CreateEmployeeRequest,
  PersonalDetailsRequest,
  EmploymentDetailsRequest,
  ContactInfoRequest,
  BankDetailsRequest,
  UpdateManagerRequest,
  ChangePasswordRequest,
  EmploymentStatusRequest,
  ConvertToFteRequest,
  UpdateStatusRequest,
} from '../models/auth.model';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private api = inject(ApiService);
  private baseUrl = `${environment.apiUrl}/v1/users`;

  getUsers(
    page: number = 0,
    size: number = 20,
    search?: string,
    role?: string,
    status?: string,
    sort?: string
  ): Observable<Page<User>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (role && role !== 'ALL') params = params.set('role', role);
    if (status && status !== 'ALL') params = params.set('status', status);
    if (sort) params = params.set('sort', sort);
    return this.api.get<Page<User>>('/v1/users', params);
  }

  getUser(userId: string | number) {
    return this.api.get<User>(`/v1/users/${userId}`);
  }

  getUsersByOrganization(orgId: string | number) {
    return this.api.get<User[]>(`/v1/users/organization/${orgId}`);
  }

  getUserStats(userId: string | number) {
    return this.api.get<DashboardStatsResponse>(`/v1/users/${userId}/stats`);
  }

  createUser(data: CreateEmployeeRequest) {
    return this.api.post<User>('/v1/users', data);
  }

  updateUser(id: string | number, data: CreateEmployeeRequest) {
    return this.api.put<User>(`/v1/users/${id}`, data);
  }

  assignRole(userId: string | number, role: string) {
    const params = new HttpParams().set('role', role);
    return this.api.put<User>(`/v1/users/${userId}/role`, {}, undefined, params);
  }

  deleteUser(userId: string | number) {
    return this.api.delete<void>(`/v1/users/${userId}`);
  }

  uploadProfilePhoto(userId: string | number, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<User>(`/v1/users/${userId}/profile-photo`, formData);
  }

  // Placeholder methods for features not yet in backend
  updatePersonal(userId: string, data: PersonalDetailsRequest) {
    return this.api.put<User>(`/v1/users/${userId}`, data);
  }

  updateStatus(userId: string, data: UpdateStatusRequest) {
    return this.api.put<User>(`/v1/users/${userId}`, data);
  }

  changePassword(userId: string, data: ChangePasswordRequest) {
    return this.api.post<User>(`/v1/users/${userId}/password`, data);
  }

  updateEmployment(userId: string, data: EmploymentDetailsRequest) {
    return this.api.put<User>(`/v1/users/${userId}`, data);
  }

  updateContact(userId: string, data: ContactInfoRequest) {
    return this.api.put<User>(`/v1/users/${userId}`, data);
  }

  updateBankDetails(userId: string, data: BankDetailsRequest) {
    return this.api.put<User>(`/v1/users/${userId}`, data);
  }

  updateManager(userId: string, data: UpdateManagerRequest) {
    return this.api.put<User>(`/v1/users/${userId}`, data);
  }

  updateEmploymentStatus(userId: string, data: EmploymentStatusRequest) {
    return this.api.put<User>(`/v1/users/${userId}`, data);
  }

  convertToFullTime(userId: string, data?: ConvertToFteRequest) {
    return this.api.post<User>(`/v1/users/${userId}/convert-to-fte`, data || {});
  }

  getProfilePhoto(userId: string): Observable<Blob> {
    return this.api.download(`/v1/users/${userId}/profile-photo`);
  }

  // ========== MY PROFILE ENDPOINTS ==========

  getMe() {
    return this.api.get<User>('/v1/users/me');
  }

  updateMe(data: { firstName?: string; lastName?: string; phone?: string; status?: boolean }) {
    return this.api.put<User>('/v1/users/me', data);
  }

  changeMyPassword(data: { currentPassword: string; newPassword: string }) {
    return this.api.post<void>('/v1/users/me/change-password', data);
  }

  resetPassword(userId: string | number, data: { newPassword: string }) {
    return this.api.post<void>(`/v1/users/${userId}/reset-password`, data);
  }
}
