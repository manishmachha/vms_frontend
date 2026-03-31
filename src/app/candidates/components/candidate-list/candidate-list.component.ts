import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../models/candidate.model';
import { HeaderService } from '../../../services/header.service';
import { AuthStore } from '../../../services/auth.store';
import { NotificationService } from '../../../services/notification.service';

import { OrganizationLogoComponent } from '../../../layout/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrganizationLogoComponent],
  templateUrl: './candidate-list.component.html',
})
export class CandidateListComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);
  public authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);

  candidates = signal<Candidate[]>([]);
  filteredCandidates = signal<Candidate[]>([]);
  searchQuery = signal('');
  unreadCandidateIds = new Set<string>();

  ngOnInit() {
    this.headerService.setTitle(
      'Candidates',
      'Manage your candidate database',
      'bi bi-people-fill',
    );
    this.loadUnreadCandidateIds();
    this.loadCandidates();
  }

  loadUnreadCandidateIds() {
    this.notificationService.getUnreadEntityIds('CANDIDATE').subscribe({
      next: (ids) => (this.unreadCandidateIds = new Set(ids.map(String))),
      error: () => (this.unreadCandidateIds = new Set()),
    });
  }

  hasNotification(candidateId: string | number): boolean {
    return this.unreadCandidateIds.has(String(candidateId));
  }

  loadCandidates() {
    this.candidateService.getCandidates().subscribe({
      next: (data) => {
        // Sort: notified candidates first
        const sorted = [...data].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });

        this.candidates.set(sorted);
        this.filterCandidates();
      },
      error: (err) => {
        console.error('Failed to load candidates', err);
      },
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.filterCandidates();
  }

  filterCandidates() {
    const q = this.searchQuery().toLowerCase();
    this.filteredCandidates.set(
      this.candidates().filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q)),
      ),
    );
  }
}
