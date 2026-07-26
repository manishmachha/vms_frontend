import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../../models/page.model';
import { Ticket, TicketCreateRequest, TicketMessage, TicketCategory, TicketStatus, TicketPriority } from '../models/ticket.model';
import { User } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets`;

  createTicket(request: TicketCreateRequest, files?: File[]): Observable<Ticket> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.http.post<Ticket>(this.apiUrl, formData);
  }

  getTickets(
    page: number = 0,
    size: number = 10,
    searchTerm?: string,
    status?: TicketStatus,
    category?: TicketCategory,
    priority?: TicketPriority,
    assignedToId?: number,
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

    return this.http.get<Page<Ticket>>(this.apiUrl, { params });
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, status: TicketStatus): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}/status`, null, { params: { status } });
  }

  assignTicket(id: number, userId: number): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}/assign`, null, { params: { userId: userId.toString() } });
  }

  addMessage(ticketId: number, message: string, files?: File[]): Observable<TicketMessage> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify({ message })], { type: 'application/json' }));
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.http.post<TicketMessage>(`${this.apiUrl}/${ticketId}/messages`, formData);
  }

  getMessages(ticketId: number): Observable<TicketMessage[]> {
    return this.http.get<TicketMessage[]>(`${this.apiUrl}/${ticketId}/messages`);
  }

  getReferenceEntities(category: TicketCategory, searchTerm?: string): Observable<any[]> {
    let params = new HttpParams().set('category', category);
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    return this.http.get<any[]>(`${this.apiUrl}/reference-entities`, { params });
  }

  getEligibleUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/eligible-users`);
  }

  updateCcUsers(ticketId: number, ccUserIds: number[]): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${ticketId}/cc`, ccUserIds);
  }
}
