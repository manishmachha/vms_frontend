import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { ApiService } from './api.service';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private api = inject(ApiService);
  private readonly BASE_URL = '/clients';

  getAllClients(
    page: number = 0,
    size: number = 20,
    search?: string,
    sort?: string,
    status?: string,
    industry?: string
  ): Observable<Page<Client>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);
    if (status) params = params.set('status', status);
    if (industry) params = params.set('industry', industry);
    return this.api.get<Page<Client>>(this.BASE_URL, params);
  }

  getClientById(id: string | number): Observable<Client> {
    return this.api.get<Client>(`${this.BASE_URL}/${id}`);
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return this.api.post<Client>(this.BASE_URL, client);
  }

  updateClient(id: string | number, client: Partial<Client>): Observable<Client> {
    return this.api.put<Client>(`${this.BASE_URL}/${id}`, client);
  }

  deleteClient(id: string | number): Observable<void> {
    return this.api.delete<void>(`${this.BASE_URL}/${id}`);
  }

  uploadLogo(id: string | number, file: File): Observable<Client> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Client>(`${this.BASE_URL}/${id}/logo`, formData);
  }

  getDashboardStats(id: string | number): Observable<DashboardStatsResponse> {
    return this.api.get<DashboardStatsResponse>(`${this.BASE_URL}/${id}/dashboard-stats`);
  }
}
