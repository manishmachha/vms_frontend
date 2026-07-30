import { Component, inject, OnInit, signal, computed, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Subject, debounceTime, merge, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    OrganizationLogoComponent,
    UserAvatarComponent,
    MatTabsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private mfeNav = inject(MfeNavigationService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  project = signal<Project | null>(null);
  allocations = signal<ProjectAllocation[]>([]);
  totalAllocations = signal<number>(0);
  searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();

  users = signal<User[]>([]);
  candidates = signal<Candidate[]>([]);

  displayedColumns: string[] = ['resource', 'role', 'period', 'status', 'actions'];

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
    }
    this.loadUsers();
    this.loadCandidates();

    this.searchSubject.pipe(debounceTime(300)).subscribe(query => {
      this.searchQuery.set(query);
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadAllocations();
    });
  }

  ngAfterViewInit() {
    // If paginator and sort are available, hook them up to reload data
    setTimeout(() => {
      merge(this.paginator.page, this.sort.sortChange).subscribe(() => {
        this.loadAllocations();
      });
      // Initial load
      this.loadAllocations();
    });
  }

  onSearch(query: string) {
    this.searchSubject.next(query);
  }

  loadProject(id: string) {
    this.projectService.getProject(id).subscribe((p) => {
      this.project.set(p);
    });
  }

  loadAllocations() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) return;

    let sortString = '';
    if (this.sort?.active && this.sort?.direction) {
      sortString = `${this.sort.active},${this.sort.direction}`;
    }

    this.projectService.getAllocations(
      projectId,
      this.paginator?.pageIndex || 0,
      this.paginator?.pageSize || 10,
      this.searchQuery(),
      sortString
    ).subscribe((page) => {
      this.allocations.set(page.content || []);
      this.totalAllocations.set(page.totalElements || 0);
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

  openAllocateModal() {
    this.dialog.open(AllocateResourceModalComponent, {
      width: '500px',
      data: { 
        projectId: this.project()?.id,
        candidates: this.candidates()
      },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadAllocations();
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
          this.loadAllocations();
        });
      }
    });
  }
}
