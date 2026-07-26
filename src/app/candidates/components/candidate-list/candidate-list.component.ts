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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    OrganizationLogoComponent,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css'],
})
export class CandidateListComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);
  public authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  viewMode = signal<'table' | 'grid'>('grid');
  dataSource = new MatTableDataSource<Candidate>([]);
  displayedColumns: string[] = ['candidate', 'contact', 'experience', 'source', 'organization', 'actions'];

  totalElements = signal(0);
  pageSize = signal(12);
  pageIndex = signal(0);
  sortField = signal('');
  sortOrder = signal('');

  candidates = signal<Candidate[]>([]);
  filteredCandidates = signal<Candidate[]>([]);
  searchQuery = signal('');
  filterType = signal<'ALL' | 'MINE'>('ALL');
  sourceFilter = signal<string>('ALL');
  availableSources = signal<string[]>(['vms', 'LinkedIn', 'Referral']);
  totalCandidates = signal<number>(0);
  candidatesCreatedByYou = signal<number>(0);
  naukriCandidates = signal<number>(0);
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
    let sortStr: string | undefined = undefined;
    if (this.sortField() && this.sortOrder()) {
      sortStr = `${this.sortField()},${this.sortOrder()}`;
    }
    this.candidateService
      .getCandidates(
        this.pageIndex(),
        this.pageSize(),
        this.searchQuery() || undefined,
        sortStr,
        this.filterType(),
        this.sourceFilter()
      )
      .subscribe({
        next: (pageData) => {
          const sorted = [...(pageData.content || [])].sort((a, b) => {
            const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
            const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
            return bHasNotif - aHasNotif;
          });

          this.candidates.set(sorted);
          this.totalElements.set(pageData.totalElements || 0);
          this.totalCandidates.set(pageData.totalElements || 0);

          const currentUserId = String(this.authStore.user()?.id);
          this.candidatesCreatedByYou.set(
            sorted.filter((c) => String(c.createdBy?.id) === currentUserId).length
          );
          
          this.naukriCandidates.set(
            sorted.filter((c) => c.source?.toLowerCase() === 'naukri').length
          );

          const sources = new Set(sorted.map((c) => c.source).filter((s) => !!s));
          this.availableSources.update((current) => {
            const combined = new Set([...current, ...(Array.from(sources) as string[])]);
            return Array.from(combined);
          });

          this.filterCandidates();
        },
        error: (err) => {
          console.error('Failed to load candidates', err);
        },
      });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.pageIndex.set(0);
    this.loadCandidates();
  }

  setFilterType(type: 'ALL' | 'MINE') {
    this.filterType.set(type);
    this.pageIndex.set(0);
    this.loadCandidates();
  }

  setSourceFilter(source: string) {
    this.sourceFilter.set(source);
    this.pageIndex.set(0);
    this.loadCandidates();
  }

  filterCandidates() {
    const sorted = this.candidates();
    this.filteredCandidates.set(sorted);
    this.dataSource.data = sorted;
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCandidates();
  }

  onSortChange(event: Sort) {
    if (!event.active || !event.direction) {
      this.sortField.set('');
      this.sortOrder.set('');
    } else {
      this.sortField.set(event.active);
      this.sortOrder.set(event.direction);
    }
    this.pageIndex.set(0);
    this.loadCandidates();
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(CandidateUploadDialogComponent, {
      width: '500px',
      disableClose: true,
      panelClass: 'rounded-xl',
    });

    dialogRef.afterClosed().subscribe((result: Candidate | undefined) => {
      if (result) {
        this.loadCandidates();
      }
    });
  }

  onCardClick(candidateId: string | number) {
    if (this.hasNotification(candidateId)) {
      this.notificationService.markAsReadByEntity('CANDIDATE', candidateId).subscribe(() => {
        this.unreadCandidateIds.delete(String(candidateId));
        this.notificationService.refreshCounts();
      });
    }
  }
}
