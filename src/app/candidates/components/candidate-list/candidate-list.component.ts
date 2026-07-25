import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../models/candidate.model';
import { HeaderService } from '../../../services/header.service';
import { AuthStore } from '../../../services/auth.store';
import { NotificationService } from '../../../services/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CandidateUploadDialogComponent } from '../candidate-upload-dialog/candidate-upload-dialog.component';

import { OrganizationLogoComponent } from '../../../layout/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrganizationLogoComponent, MatDialogModule],
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css'],
})
export class CandidateListComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);
  public authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  candidates = signal<Candidate[]>([]);
  filteredCandidates = signal<Candidate[]>([]);
  searchQuery = signal('');
  filterType = signal<'ALL' | 'MINE'>('ALL');
  sourceFilter = signal<string>('ALL');
  availableSources = signal<string[]>([]);
  totalCandidates = signal<number>(0);
  candidatesCreatedByYou = signal<number>(0);
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
        this.totalCandidates.set(sorted.length);
        this.candidatesCreatedByYou.set(
          sorted.filter((c) => String(c.createdBy?.id) === String(this.authStore.user()?.id)).length
        );

        const sources = new Set(sorted.map(c => c.source).filter(s => !!s));
        this.availableSources.set(Array.from(sources) as string[]);

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

  setFilterType(type: 'ALL' | 'MINE') {
    this.filterType.set(type);
    this.filterCandidates();
  }

  setSourceFilter(source: string) {
    this.sourceFilter.set(source);
    this.filterCandidates();
  }

  filterCandidates() {
    const q = this.searchQuery().toLowerCase();
    const type = this.filterType();
    const currentUserId = String(this.authStore.user()?.id);

    this.filteredCandidates.set(
      this.candidates().filter((c) => {
        const matchesSearch =
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q));

        const matchesFilter =
          type === 'ALL' ? true : String(c.createdBy?.id) === currentUserId;

        const sourceF = this.sourceFilter();
        const matchesSource = sourceF === 'ALL' ? true : c.source === sourceF;

        return matchesSearch && matchesFilter && matchesSource;
      })
    );
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(CandidateUploadDialogComponent, {
      width: '500px',
      disableClose: true,
      panelClass: 'rounded-xl'
    });

    dialogRef.afterClosed().subscribe((result: Candidate | undefined) => {
      if (result) {
        // Upload successful, reload candidate list
        this.loadCandidates();
      }
    });
  }
}
