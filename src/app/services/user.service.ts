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
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.dev';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/v1/users`;

  getUsers(page: number = 0, size: number = 20, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) params = params.set('sort', sort);
    return this.api.get<User[]>('/v1/users', params);
  }

  getUser(userId: string | number) {
    return this.api.get<User>(`/v1/users/${userId}`);
  }

  getUsersByVendor(vendorId: string | number) {
    return this.api.get<User[]>(`/v1/users/vendor/${vendorId}`);
  }

  createUser(data: CreateEmployeeRequest) {
    return this.api.post<User>('/v1/users', data);
  }

  updateUser(id: string | number, data: CreateEmployeeRequest) {
    return this.api.put<User>(`/v1/users/${id}`, data);
  }

  assignRole(userId: string | number, role: string) {
    const params = new HttpParams().set('role', role);
    return this.api.put<User>(`/v1/users/${userId}/role`, {});
  }

  deleteUser(userId: string | number) {
    return this.api.delete<void>(`/v1/users/${userId}`);
  }

  uploadProfilePhoto(userId: string | number, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<User>>(`${this.baseUrl}/${userId}/profile-photo`, formData)
      .pipe(map((res) => res.data));
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
    return this.http.get(`${this.baseUrl}/${userId}/profile-photo`, { responseType: 'blob' });
  }
}
