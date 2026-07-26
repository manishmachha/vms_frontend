import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TicketService } from '../../services/ticket.service';
import { Ticket, TicketCategory, TicketStatus, TicketPriority } from '../../models/ticket.model';
import { HeaderService } from '../../../services/header.service';
import { AuthStore } from '../../../services/auth.store';
import { NotificationService } from '../../../services/notification.service';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatPaginatorModule],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.css'],
})
export class TicketListComponent implements OnInit {
  ticketService = inject(TicketService);
  headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  tickets = signal<Ticket[]>([]);
  
  openCount = computed(() => this.tickets().filter((t) => t.status === TicketStatus.OPEN).length);
  resolvedCount = computed(() => this.tickets().filter((t) => t.status === TicketStatus.RESOLVED).length);
  unreadTicketIds = new Set<string>();

  searchQuery = '';
  statusFilter = '';
  categoryFilter = '';
  priorityFilter = '';
  sortField = 'createdAt,desc';

  categories = Object.values(TicketCategory);
  statuses = Object.values(TicketStatus);
  priorities = Object.values(TicketPriority);

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 12;

  ngOnInit() {
    this.headerService.setTitle(
      'Support Tickets',
      'Manage and track support requests',
      'bi bi-headset',
    );
    this.loadUnreadTicketIds();
    this.loadTickets();
  }

  loadUnreadTicketIds() {
    this.notificationService.getUnreadEntityIds('TICKET').subscribe({
      next: (ids) => (this.unreadTicketIds = new Set(ids.map(String))),
      error: () => (this.unreadTicketIds = new Set()),
    });
  }

  hasNotification(ticketId: string | number): boolean {
    return this.unreadTicketIds.has(String(ticketId));
  }

  loadTickets(page: number = 0) {
    this.ticketService.getTickets(
      page,
      this.pageSize,
      this.searchQuery || undefined,
      this.statusFilter as TicketStatus || undefined,
      this.categoryFilter as TicketCategory || undefined,
      this.priorityFilter as TicketPriority || undefined,
      undefined,
      this.sortField
    ).subscribe((data) => {
      const list = data.content || [];
      const sorted = [...list].sort((a, b) => {
        const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
        const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
        if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
        return 0;
      });

      this.tickets.set(sorted);
      this.totalElements = data.totalElements;
      this.totalPages = data.totalPages;
      this.currentPage = data.number;
    });
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.loadTickets(page);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.loadTickets(event.pageIndex);
  }

  private searchTimeout: any;
  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadTickets(0);
    }, 300);
  }

  applyFilters() {
    this.loadTickets(0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ESCALATED':
        return 'bg-red-100 text-red-800';
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800';
      case 'CLOSED':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onCardClick(ticketId: string | number) {
    if (this.hasNotification(ticketId)) {
      this.notificationService.markAsReadByEntity('TICKET', ticketId).subscribe(() => {
        this.unreadTicketIds.delete(String(ticketId));
        this.notificationService.refreshCounts();
      });
    }
  }
}
