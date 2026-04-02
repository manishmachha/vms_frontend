import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    OrganizationLogoComponent,
    UserAvatarComponent,
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

  projects = signal<Project[]>([]);
  clients = signal<Client[]>([]);
  unreadProjectIds = new Set<number>();
  activeMenuId: number | null = null;

  searchQuery = '';
  statusFilter = '';
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

  hasNotification(projectId: number): boolean {
    return this.unreadProjectIds.has(projectId);
  }

  loadProjects() {
    this.projectService.getProjects().subscribe((data) => {
      this.projects.set(data);
    });
  }

  loadClients() {
    this.clientService.getAllClients().subscribe((data) => {
      this.clients.set(data);
    });
  }

  filteredProjects(): Project[] {
    let result = this.projects();

    if (this.statusFilter) {
      result = result.filter((p) => p.status === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.requestId && p.requestId.toLowerCase().includes(query)) ||
          p.client?.name?.toLowerCase().includes(query),
      );
    }

    result = [...result].sort((a, b) => {
      const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
      const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
      if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  // ========== ACTIONS ==========

  toggleMenu(projectId: number) {
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
