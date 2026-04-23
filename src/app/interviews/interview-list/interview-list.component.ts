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

@Component({
  selector: 'app-interview-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatDialogModule],
  templateUrl: './interview-list.component.html',
  styleUrls: ['./interview-list.component.css'],
})
export class InterviewListComponent implements OnInit {
  private interviewService = inject(InterviewService);
  public authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  searchQuery = '';
  activeTab = signal('upcoming');
  interviews = signal<Interview[]>([]);
  filteredInterviews = signal<Interview[]>([]);
  
  // Stats
  totalInterviews = signal(0);
  todayCount = signal(0);
  awaitingFeedbackCount = signal(0);
  passRate = signal(0);

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
    const fetchObservable = this.authStore.isVendor()
      ? this.interviewService.getVendorInterviews()
      : this.interviewService.getAllInterviews();

    fetchObservable.subscribe({
      next: (res) => {
        this.interviews.set(res || []);
        this.updateStats(res || []);
        this.applyFilters();
      },
      error: (err) => console.error(err)
    });
  }

  updateStats(data: Interview[]) {
    this.totalInterviews.set(data.length);
    
    const today = new Date().toISOString().split('T')[0];
    this.todayCount.set(data.filter(i => i.scheduledAt.startsWith(today)).length);
    
    this.awaitingFeedbackCount.set(
      data.filter(i => i.status === 'COMPLETED' && !i.feedback).length
    );

    const completed = data.filter(i => i.feedback);
    if (completed.length > 0) {
      // Logic for pass rate could be added here if defined in data
      this.passRate.set(75); // Mock
    }
  }

  setActiveTab(id: string) {
    this.activeTab.set(id);
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.interviews();
    const now = new Date();

    // Tab Filter
    if (this.activeTab() === 'upcoming') {
      filtered = filtered.filter(i => new Date(i.scheduledAt) >= now && i.status !== 'CANCELLED');
    } else if (this.activeTab() === 'completed') {
      filtered = filtered.filter(i => i.status === 'COMPLETED');
    }

    // Search Query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.application?.candidate?.firstName.toLowerCase().includes(query) ||
        i.application?.candidate?.lastName.toLowerCase().includes(query) ||
        i.application?.job?.title.toLowerCase().includes(query) ||
        (i.application?.job?.requestId && i.application.job.requestId.toLowerCase().includes(query))
      );
    }

    this.filteredInterviews.set(filtered);
  }

  getDateBg(interview: Interview): string {
    const isToday = new Date(interview.scheduledAt).toDateString() === new Date().toDateString();
    if (isToday) return 'bg-indigo-600 text-white';
    if (interview.status === 'COMPLETED') return 'bg-emerald-50 text-emerald-900';
    if (interview.status === 'CANCELLED') return 'bg-red-50 text-red-900';
    return 'bg-gray-50 text-gray-900';
  }

  getStatusClass(interview: Interview): string {
    switch (interview.status) {
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
