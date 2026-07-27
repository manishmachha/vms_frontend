import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { UserAvatarComponent } from '../../layout/components/user-avatar/user-avatar.component';
import { ProjectService, UpdateStatusRequest } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { Client } from '../../models/client.model';
import { ClientService } from '../../services/client.service';
import { OrganizationService } from '../../services/organization.service';
import { FormsModule } from '@angular/forms';
import { HeaderService } from '../../services/header.service';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { NotificationService } from '../../services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from '../../services/dialog.service';
import { AddProjectDialogComponent } from '../components/add-project-modal/add-project-dialog.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    OrganizationLogoComponent,
    UserAvatarComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  clientService = inject(ClientService);
  orgService = inject(OrganizationService);
  headerService = inject(HeaderService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private mfeNav = inject(MfeNavigationService);

  viewMode = signal<'table' | 'grid'>('grid');
  dataSource = new MatTableDataSource<Project>([]);
  displayedColumns: string[] = ['name', 'client', 'dates', 'team', 'status', 'actions'];

  totalElements = signal(0);
  pageSize = signal(12);
  pageIndex = signal(0);
  sortField = signal('');
  sortOrder = signal('');

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  projects = signal<Project[]>([]);
  clients = signal<Client[]>([]);
  unreadProjectIds = new Set<string>();
  activeMenuId: string | null = null;

  searchQuery = '';
  statusFilter = '';
  clientFilter = '';
  statuses: ('ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED')[] = [
    'ACTIVE',
    'PLANNED',
    'ON_HOLD',
    'COMPLETED',
  ];

  ngOnInit() {
    this.headerService.setTitle(
      'Projects',
      'Manage client and internal projects',
      'bi bi-kanban-fill',
    );
    this.loadUnreadProjectIds();
    this.loadProjects();
    this.loadClients();

    // Close menu when clicking outside
    document.addEventListener('click', () => (this.activeMenuId = null));
  }

  loadUnreadProjectIds() {
    this.notificationService.getUnreadEntityIds('PROJECT').subscribe({
      next: (ids) => (this.unreadProjectIds = new Set(ids)),
      error: () => (this.unreadProjectIds = new Set()),
    });
  }

  hasNotification(projectId: string): boolean {
    return this.unreadProjectIds.has(projectId);
  }

  loadProjects() {
    let sortStr: string | undefined = undefined;
    if (this.sortField() && this.sortOrder()) {
      sortStr = `${this.sortField()},${this.sortOrder()}`;
    }
    this.projectService
      .getProjects(
        this.pageIndex(),
        this.pageSize(),
        this.searchQuery || undefined,
        sortStr,
        this.statusFilter || undefined,
        this.clientFilter || undefined
      )
      .subscribe((pageData) => {
        this.projects.set(pageData.content || []);
        this.totalElements.set(pageData.totalElements || 0);
        this.applyFilters();
      });
  }

  loadClients() {
    this.clientService.getAllClients(0, 100).subscribe((pageData) => {
      this.clients.set(pageData.content || []);
    });
  }

  onSearch() {
    this.pageIndex.set(0);
    this.loadProjects();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProjects();
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
    this.loadProjects();
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  filteredProjects(): Project[] {
    return this.applyFilters();
  }

  applyFilters(): Project[] {
    let result = this.projects();

    result = [...result].sort((a, b) => {
      const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
      const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
      if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
      return 0;
    });

    this.dataSource.data = result;
    return result;
  }

  onFilterChange() {
    this.pageIndex.set(0);
    this.loadProjects();
  }

  // ========== ACTIONS ==========

  toggleMenu(projectId: string) {
    this.activeMenuId = this.activeMenuId === projectId ? null : projectId;
  }

  openCreateModal() {
    this.activeMenuId = null;
    this.dialog.open(AddProjectDialogComponent, {
      width: '600px',
      data: { clients: this.clients() },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadProjects();
    });
  }

  openEditModal(project: Project) {
    this.activeMenuId = null;
    this.dialog.open(AddProjectDialogComponent, {
      width: '600px',
      data: { 
        clients: this.clients(),
        editProject: project 
      },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadProjects();
    });
  }

  changeStatus(project: Project, status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED') {
    this.activeMenuId = null;
    if (project.status === status) return;

    this.projectService.updateStatus(project.id, { status }).subscribe({
      next: () => this.loadProjects(),
      error: (err) => console.error('Failed to update status', err),
    });
  }

  confirmDelete(project: Project) {
    this.activeMenuId = null;
    this.dialogService.confirmDelete('Project').subscribe(confirmed => {
      if (confirmed) {
        this.projectService.deleteProject(project.id).subscribe({
          next: () => {
            this.loadProjects();
          },
          error: (err) => {
            console.error('Failed to delete project', err);
          },
        });
      }
    });
  }

  // ========== HELPERS ==========

  getStatusCount(status: string): number {
    return this.projects().filter((p) => p.status === status).length;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'PLANNED':
        return 'badge-info';
      case 'ON_HOLD':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-primary';
      default:
        return 'badge-primary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bi-play-circle text-green-500';
      case 'PLANNED':
        return 'bi-calendar-check text-blue-500';
      case 'ON_HOLD':
        return 'bi-pause-circle text-amber-500';
      case 'COMPLETED':
        return 'bi-check-circle text-indigo-500';
      default:
        return 'bi-circle';
    }
  }

  formatStatus(status: string): string {
    return status
      .replace('_', ' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  getProjectGradient(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'linear-gradient(to bottom right, #10b981, #059669)';
      case 'PLANNED':
        return 'linear-gradient(to bottom right, #3b82f6, #2563eb)';
      case 'ON_HOLD':
        return 'linear-gradient(to bottom right, #f59e0b, #d97706)';
      case 'COMPLETED':
        return 'linear-gradient(to bottom right, #6366f1, #4f46e5)';
      default:
        return 'linear-gradient(to bottom right, #64748b, #475569)';
    }
  }
}
