import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { ApiService } from './api.service';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private api = inject(ApiService);
  private readonly BASE_URL = '/clients';

  getAllClients(): Observable<Client[]> {
    return this.api.get<Client[]>(this.BASE_URL);
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
