import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { ProjectService } from '../../services/project.service';
import { HeaderService } from '../../services/header.service';
import { Project, ProjectAllocation, UserSummary } from '../../models/project.model';
import { UserService } from '../../services/user.service';
import { User } from '../../models/auth.model';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { AllocateResourceModalComponent } from '../components/allocate-resource-modal/allocate-resource-modal.component';
import { UserAvatarComponent } from '../../layout/components/user-avatar/user-avatar.component';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../candidates/models/candidate.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from '../../services/dialog.service';
import { TimelineService, TimelineEvent } from '../../services/timeline.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { TimelineComponent } from '../../layout/components/timeline/timeline.component';
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    OrganizationLogoComponent,
    UserAvatarComponent,
    MatTabsModule,
    MatIconModule,
    TimelineComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private timelineService = inject(TimelineService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  project = signal<Project | null>(null);
  timelineEvents = signal<TimelineEvent[]>([]);
  allocations = signal<ProjectAllocation[]>([]);
  users = signal<User[]>([]);
  candidates = signal<Candidate[]>([]);

  private colors = [
    '#6366f1',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#14b8a6',
    '#f97316',
    '#ec4899',
  ];



  projectDuration = computed(() => {
    const p = this.project();
    if (!p?.startDate) return 'N/A';
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : new Date();
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months <= 1 ? '1 mo' : `${months} mo`;
  });



  ngOnInit() {
    this.headerService.setTitle(
      'Project Details',
      'View project information and allocations',
      'bi bi-kanban',
    );
    const projectIdStr = this.route.snapshot.paramMap.get('id');
    if (projectIdStr) {
      const projectId = projectIdStr;
      this.loadProject(projectId);
      this.loadAllocations(projectId);
    }
    this.loadUsers();
    this.loadCandidates();
  }

  loadProject(id: string) {
    this.projectService.getProject(id).subscribe((p) => {
      this.project.set(p);
      this.loadTimeline(id.toString());
    });
  }

  loadTimeline(id: string) {
    this.timelineService.getTimeline('PROJECT', id).subscribe({
      next: (res) => this.timelineEvents.set(res.content),
      error: (err) => console.error('Failed to load timeline', err),
    });
  }

  loadAllocations(id: string) {
    this.projectService.getAllocations(id).subscribe((data) => {
      this.allocations.set(data);
    });
  }

  loadUsers() {
    this.userService.getUsers(0, 500).subscribe((page) => {
      this.users.set(page.content || []);
    });
  }

  loadCandidates() {
    this.candidateService.getCandidates(0, 500).subscribe((page) => {
      this.candidates.set(page.content || []);
    });
  }

  getColor(alloc: ProjectAllocation): string {
    const index = this.allocations().indexOf(alloc);
    return this.colors[index % this.colors.length];
  }

  getTimelineOffset(alloc: ProjectAllocation): number {
    const p = this.project();
    if (!p?.startDate || !alloc.startDate) return 0;
    const projectStart = new Date(p.startDate).getTime();
    const projectEnd = p.endDate ? new Date(p.endDate).getTime() : Date.now();
    const allocStart = new Date(alloc.startDate).getTime();
    return ((allocStart - projectStart) / (projectEnd - projectStart)) * 100;
  }

  getTimelineWidth(alloc: ProjectAllocation): number {
    const p = this.project();
    if (!p?.startDate || !alloc.startDate) return 0;
    const projectStart = new Date(p.startDate).getTime();
    const projectEnd = p.endDate ? new Date(p.endDate).getTime() : Date.now();
    const allocStart = new Date(alloc.startDate).getTime();
    const allocEnd = alloc.endDate ? new Date(alloc.endDate).getTime() : projectEnd;
    return Math.min(100, ((allocEnd - allocStart) / (projectEnd - projectStart)) * 100);
  }

  openAllocateModal() {
    this.dialog.open(AllocateResourceModalComponent, {
      width: '500px',
      data: { 
        projectId: this.project()?.id,
        candidates: this.candidates()
      },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadAllocations(this.project()!.id);
    });
  }

  confirmDeallocate(alloc: ProjectAllocation) {
    this.dialogService.confirm(
      'Deallocate Resource',
      `Are you sure you want to remove this resource from the project?`,
      'danger'
    ).subscribe(confirmed => {
      if (confirmed && this.project()) {
        this.projectService.deallocateUser(this.project()!.id, alloc.id).subscribe(() => {
          this.loadAllocations(this.project()!.id);
        });
      }
    });
  }
}
