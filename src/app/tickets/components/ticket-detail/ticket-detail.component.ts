import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '../../../services/ticket.service';
import { HeaderService } from '../../../services/header.service';
import { Ticket, TicketMessage, TicketStatus } from '../../models/ticket.model';
import { AuthStore } from '../../../services/auth.store';
import { FormsModule } from '@angular/forms';
import { User } from '../../../models/auth.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.css']
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  private headerService = inject(HeaderService);
  authStore = inject(AuthStore);

  ticketId = signal<string>('');
  ticket = signal<Ticket | null>(null);
  messages = signal<TicketMessage[]>([]);
  eligibleUsers = signal<User[]>([]);

  isEditingCc = false;
  selectedCcUserIds: string[] = [];
  ccSearchTerm = signal('');
  isCcDropdownOpen = signal(false);

  newMessage = '';
  selectedFiles: File[] = [];
  isSubmitting = false;

  get filteredCcUsers(): User[] {
    const term = this.ccSearchTerm().toLowerCase().trim();
    if (!term) return this.eligibleUsers();
    return this.eligibleUsers().filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  }

  toggleCcUser(userId: string) {
    const idx = this.selectedCcUserIds.indexOf(userId);
    if (idx > -1) {
      this.selectedCcUserIds.splice(idx, 1);
    } else {
      this.selectedCcUserIds.push(userId);
    }
  }

  isAdminOrManager = computed(() => {
    const role = this.authStore.userRole();
    return role === 'SUPER_ADMIN' || role === 'MANAGER';
  });

  @ViewChild('fileInput') fileInput!: ElementRef;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.ticketId.set(id);
        this.loadTicket();
        this.loadMessages();
        this.loadEligibleUsers();
      }
    });
  }

  loadEligibleUsers() {
    this.ticketService.getEligibleUsers().subscribe(users => {
      this.eligibleUsers.set(users);
    });
  }

  loadTicket() {
    this.ticketService.getTicket(this.ticketId()).subscribe({
      next: (data) => {
        this.ticket.set(data);
        this.headerService.setTitle(
          'Ticket #' + data.id,
          data.title,
          'bi bi-ticket-detailed'
        );
      },
      error: () => {
        alert('Failed to load ticket details');
      }
    });
  }

  loadMessages() {
    this.ticketService.getMessages(this.ticketId()).subscribe({
      next: (data) => {
        this.messages.set(data);
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  sendMessage() {
    if (!this.newMessage.trim() && this.selectedFiles.length === 0) {
      return;
    }

    this.isSubmitting = true;
    this.ticketService.addMessage(this.ticketId(), this.newMessage, this.selectedFiles).subscribe({
      next: (msg) => {
        this.messages.update(msgs => [...msgs, msg]);
        this.newMessage = '';
        this.selectedFiles = [];
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        this.isSubmitting = false;
        // Scroll to bottom logic could be added here
      },
      error: () => {
        alert('Failed to send message');
        this.isSubmitting = false;
      }
    });
  }

  updateStatus(status: TicketStatus | string) {
    this.ticketService.updateStatus(this.ticketId(), status as TicketStatus).subscribe({
      next: (updatedTicket) => {
        this.ticket.set(updatedTicket);
        alert(`Ticket status updated to ${status}`);
      },
      error: () => {
        alert('Failed to update status');
      }
    });
  }

  assignToMe() {
    const userId = this.authStore.user()?.id;
    if (userId) {
      this.assignTicket(userId);
    }
  }

  assignTicket(userId: string) {
    this.ticketService.assignTicket(this.ticketId(), userId).subscribe({
      next: (updatedTicket) => {
        this.ticket.set(updatedTicket);
        alert('Ticket assigned successfully');
      },
      error: () => {
        alert('Failed to assign ticket');
      }
    });
  }

  onAssigneeChange(event: any) {
    const userId = event.target.value;
    if (userId) {
      this.assignTicket(userId);
    }
  }

  startEditingCc() {
    this.isEditingCc = true;
    this.selectedCcUserIds = this.ticket()?.ccUsers?.map(u => u.id) || [];
    this.ccSearchTerm.set('');
    this.isCcDropdownOpen.set(true);
  }

  saveCcUsers() {
    this.ticketService.updateCcUsers(this.ticketId(), this.selectedCcUserIds).subscribe({
      next: (updatedTicket) => {
        this.ticket.set(updatedTicket);
        this.isEditingCc = false;
      },
      error: () => {
        alert('Failed to update CC users');
      }
    });
  }

  cancelEditingCc() {
    this.isEditingCc = false;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ESCALATED': return 'bg-red-100 text-red-800';
      case 'RESOLVED': return 'bg-gray-100 text-gray-800';
      case 'CLOSED': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
