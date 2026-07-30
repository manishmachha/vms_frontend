import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Page } from '../models/page.model';
import { Ticket, TicketCreateRequest, TicketMessage, TicketCategory, TicketStatus, TicketPriority } from '../tickets/models/ticket.model';
import { User } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private api = inject(ApiService);
  private apiUrl = `/tickets`;

  createTicket(request: TicketCreateRequest, files?: File[]): Observable<Ticket> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));

    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.api.post<Ticket>(this.apiUrl, formData);
  }

  getTickets(
    page: number = 0,
    size: number = 10,
    searchTerm?: string,
    status?: TicketStatus,
    category?: TicketCategory,
    priority?: TicketPriority,
    assignedToId?: string,
    sort?: string
  ): Observable<Page<Ticket>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (status) params = params.set('status', status);
    if (category) params = params.set('category', category);
    if (priority) params = params.set('priority', priority);
    if (assignedToId) params = params.set('assignedToId', assignedToId.toString());
    if (sort) params = params.set('sort', sort);

    return this.api.get<Page<Ticket>>(this.apiUrl, params);
  }

  getTicket(id: string): Observable<Ticket> {
    return this.api.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: TicketStatus): Observable<Ticket> {
    const params = new HttpParams().set('status', status);
    return this.api.put<Ticket>(`${this.apiUrl}/${id}/status`, null, undefined, params);
  }

  assignTicket(id: string, userId: string): Observable<Ticket> {
    const params = new HttpParams().set('userId', userId);
    return this.api.put<Ticket>(`${this.apiUrl}/${id}/assign`, null, undefined, params);
  }

  addMessage(ticketId: string, message: string, files?: File[]): Observable<TicketMessage> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify({ message })], { type: 'application/json' }));

    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.api.post<TicketMessage>(`${this.apiUrl}/${ticketId}/messages`, formData);
  }

  getMessages(ticketId: string): Observable<TicketMessage[]> {
    return this.api.get<TicketMessage[]>(`${this.apiUrl}/${ticketId}/messages`);
  }

  getReferenceEntities(category: TicketCategory, searchTerm?: string): Observable<any[]> {
    let params = new HttpParams().set('category', category);
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    return this.api.get<any[]>(`${this.apiUrl}/reference-entities`, params);
  }

  getEligibleUsers(): Observable<User[]> {
    return this.api.get<User[]>(`${this.apiUrl}/eligible-users`);
  }

  updateCcUsers(ticketId: string, ccUserIds: string[]): Observable<Ticket> {
    return this.api.put<Ticket>(`${this.apiUrl}/${ticketId}/cc`, ccUserIds);
  }
}
