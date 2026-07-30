import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../../services/ticket.service';
import { HeaderService } from '../../../services/header.service';
import { TicketCategory, TicketPriority } from '../../models/ticket.model';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';
import { User } from '../../../models/auth.model';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.css']
})
export class TicketFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private mfeNav = inject(MfeNavigationService);

  ticketForm: FormGroup;
  isSubmitting = signal(false);
  categories = Object.values(TicketCategory);
  priorities = Object.values(TicketPriority);

  referenceEntities = signal<any[]>([]);
  showReferenceSearch = signal(false);

  eligibleUsers = signal<User[]>([]);
  selectedFiles: File[] = [];

  ccSearchTerm = signal('');
  isCcDropdownOpen = signal(false);

  get filteredCcUsers(): User[] {
    const term = this.ccSearchTerm().toLowerCase().trim();
    if (!term) return this.eligibleUsers();
    return this.eligibleUsers().filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  }

  get selectedCcUsersList(): User[] {
    const ids = this.ticketForm.get('ccUserIds')?.value || [];
    return this.eligibleUsers().filter(u => ids.includes(u.id));
  }

  toggleCcUser(userId: string) {
    const current: string[] = [...(this.ticketForm.get('ccUserIds')?.value || [])];
    const idx = current.indexOf(userId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(userId);
    }
    this.ticketForm.get('ccUserIds')?.setValue(current);
  }

  removeCcUser(userId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const current: string[] = [...(this.ticketForm.get('ccUserIds')?.value || [])];
    const idx = current.indexOf(userId);
    if (idx > -1) {
      current.splice(idx, 1);
      this.ticketForm.get('ccUserIds')?.setValue(current);
    }
  }

  constructor() {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required]],
      category: ['', Validators.required],
      refEntityId: [null],
      priority: ['MEDIUM', Validators.required],
      ccUserIds: [[]]
    });

    // Listen to category changes
    this.ticketForm.get('category')?.valueChanges.subscribe(category => {
      this.ticketForm.get('refEntityId')?.setValue(null);
      if (category && category !== 'OTHER') {
        this.showReferenceSearch.set(true);
        this.loadReferenceEntities(category);
      } else {
        this.showReferenceSearch.set(false);
        this.referenceEntities.set([]);
      }
    });
  }

  ngOnInit() {
    this.headerService.setTitle(
      'Raise a Ticket',
      'Create a new support request',
      'bi bi-plus-circle'
    );
    this.ticketService.getEligibleUsers().subscribe(users => {
      this.eligibleUsers.set(users);
    });
  }

  loadReferenceEntities(category: TicketCategory, searchTerm: string = '') {
    this.ticketService.getReferenceEntities(category, searchTerm).subscribe(data => {
      this.referenceEntities.set(data);
    });
  }

  onSearchReference(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    const category = this.ticketForm.get('category')?.value;
    if (category) {
      this.loadReferenceEntities(category, term);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  onSubmit() {
    if (this.ticketForm.valid) {
      this.isSubmitting.set(true);
      this.ticketService.createTicket(this.ticketForm.value, this.selectedFiles).subscribe({
        next: (ticket) => {
          alert('Ticket created successfully');
          this.router.navigateByUrl(this.mfeNav.basePath + '/tickets/' + ticket.id);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert('Failed to create ticket');
        }
      });
    } else {
      this.ticketForm.markAllAsTouched();
    }
  }

  cancel() {
    this.router.navigateByUrl(this.mfeNav.basePath + '/tickets');
  }
}
