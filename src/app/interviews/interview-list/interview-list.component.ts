import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { FormsModule } from '@angular/forms';
import { InterviewService } from '../../services/interview.service';
import { Interview } from '../../models/interview.model';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../services/auth.store';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ScheduleInterviewDialogComponent } from '../../applications/dialogs/schedule-interview-dialog/schedule-interview-dialog.component';
import { HeaderService } from '../../services/header.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { NotificationDotComponent } from '../../shared/components/notification-dot/notification-dot.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-interview-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NotificationDotComponent
  ],
  templateUrl: './interview-list.component.html',
  styleUrls: ['./interview-list.component.css'],
})
export class InterviewListComponent implements OnInit {
  private interviewService = inject(InterviewService);
  public authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private mfeNav = inject(MfeNavigationService);

  viewMode = signal<'table' | 'grid'>('grid');
  dataSource = new MatTableDataSource<Interview>([]);
  displayedColumns: string[] = ['candidate', 'job', 'round', 'date', 'type', 'status', 'actions'];

  totalElements = signal(0);
  pageSize = signal(12);
  pageIndex = signal(0);
  sortField = signal('');
  sortOrder = signal('');

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  searchQuery = '';
  activeTab = signal('all');
  interviews = signal<Interview[]>([]);
  filteredInterviews = signal<Interview[]>([]);
  public notificationService = inject(NotificationService);
  
  // Stats
  totalInterviews = signal(0);
  todayCount = signal(0);
  awaitingFeedbackCount = signal(0);
  passRate = signal(0);

  hasNotification(interviewId: string | number): boolean {
    return this.notificationService.notifications().some(n => 
      n.entityType === 'INTERVIEW' && 
      String(n.entityId) === String(interviewId) && 
      !n.read
    );
  }

  onCardClick(interviewId: string | number) {
    this.notificationService.markEntityAsRead('INTERVIEW', interviewId);
  }

  tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'all', label: 'All Interviews' }
  ];

  ngOnInit() {
    this.headerService.setTitle(
      'Interviews',
      'Manage your interviews',
      'bi bi-calendar-check',
    );
    this.loadInterviews();
  }

  loadInterviews() {
    let sortStr: string | undefined = undefined;
    if (this.sortField() && this.sortOrder()) {
      sortStr = `${this.sortField()},${this.sortOrder()}`;
    }
    const statusParam = this.activeTab() === 'all' ? undefined : this.activeTab();
    const fetchObservable = this.authStore.isVendor()
      ? this.interviewService.getVendorInterviews(this.pageIndex(), this.pageSize(), this.searchQuery || undefined, sortStr, statusParam)
      : this.interviewService.getAllInterviews(this.pageIndex(), this.pageSize(), this.searchQuery || undefined, sortStr, statusParam);

    fetchObservable.subscribe({
      next: (res) => {
        const list = res.content || [];
        this.interviews.set(list);
        this.totalElements.set(res.totalElements || 0);
        this.updateStats(list);
        this.applyFilters();
      },
      error: (err) => console.error(err)
    });
  }

  updateStats(data: Interview[]) {
    this.totalInterviews.set(this.totalElements());
    
    const today = new Date().toISOString().split('T')[0];
    this.todayCount.set(data.filter(i => i.scheduledAt && i.scheduledAt.startsWith(today)).length);
    
    this.awaitingFeedbackCount.set(
      data.filter(i => i.status === 'COMPLETED' && !i.feedback).length
    );

    const completed = data.filter(i => i.feedback);
    if (completed.length > 0) {
      this.passRate.set(75); // Mock
    }
  }

  setActiveTab(id: string) {
    this.activeTab.set(id);
    this.pageIndex.set(0);
    this.loadInterviews();
  }

  onSearch() {
    this.pageIndex.set(0);
    this.loadInterviews();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadInterviews();
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
    this.loadInterviews();
  }

  onSortChangeSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) {
      this.sortField.set('');
      this.sortOrder.set('');
    } else {
      const parts = val.split(',');
      this.sortField.set(parts[0]);
      this.sortOrder.set(parts[1]);
    }
    this.pageIndex.set(0);
    this.loadInterviews();
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  applyFilters() {
    const filtered = this.interviews();
    this.filteredInterviews.set(filtered);
    this.dataSource.data = filtered;
  }

  getDateBg(interview: Interview): string {
    const isToday = new Date(interview.scheduledAt).toDateString() === new Date().toDateString();
    if (isToday) return 'bg-indigo-600 text-white';
    if (interview.status === 'COMPLETED') return 'bg-emerald-50 text-emerald-900';
    if (interview.status === 'CANCELLED') return 'bg-red-50 text-red-900';
    return 'bg-gray-50 text-gray-900';
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border border-red-200';
      case 'NO_SHOW': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  openScheduleDialog(interview?: Interview) {
    const dialogRef = this.dialog.open(ScheduleInterviewDialogComponent, {
      width: '600px',
      data: { 
        applicationId: interview?.application?.id,
        candidateName: interview ? `${interview.application?.candidate?.firstName} ${interview.application?.candidate?.lastName}` : null,
        jobTitle: interview?.application?.job?.title
      },
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInterviews();
      }
    });
  }
}
