import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { ClientFormComponent } from '../components/client-form/client-form.component';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { HeaderService } from '../../services/header.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { NotificationDotComponent } from '../../shared/components/notification-dot/notification-dot.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatDialogModule,
    OrganizationLogoComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NotificationDotComponent
  ],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css'],
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private mfeNav = inject(MfeNavigationService);

  viewMode = signal<'table' | 'grid'>('grid');
  dataSource = new MatTableDataSource<Client>([]);
  displayedColumns: string[] = ['client', 'industry', 'location', 'projects', 'status', 'actions'];

  totalElements = signal(0);
  pageSize = signal(12);
  pageIndex = signal(0);
  sortField = signal('');
  sortOrder = signal('');

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  clients = signal<Client[]>([]);
  projects = signal<Project[]>([]);

  searchQuery = signal('');
  industryFilter = signal('');
  statusFilter = signal<Client['status'] | ''>('');
  availableStatuses: NonNullable<Client['status']>[] = ['ACTIVE', 'LEAD', 'INACTIVE'];
  activeMenuId: number | null = null;
  public notificationService = inject(NotificationService);

  constructor() {
    effect(() => {
      this.dataSource.data = this.filteredClients();
    });
  }

  ngOnInit() {
    this.headerService.setTitle(
      'Clients',
      'Manage your clients and their projects',
      'bi bi-building',
    );
    this.loadData();
    document.addEventListener('click', () => (this.activeMenuId = null));
  }

  loadData() {
    let sortStr: string | undefined = undefined;
    if (this.sortField() && this.sortOrder()) {
      sortStr = `${this.sortField()},${this.sortOrder()}`;
    }
    this.clientService
      .getAllClients(
        this.pageIndex(),
        this.pageSize(),
        this.searchQuery() || undefined,
        sortStr,
        this.statusFilter() || undefined,
        this.industryFilter() || undefined
      )
      .subscribe((pageData) => {
        this.clients.set(pageData.content || []);
        this.totalElements.set(pageData.totalElements || 0);
      });
    if (this.projects().length === 0) {
      this.projectService.getProjects(0, 100).subscribe((page) => this.projects.set(page.content || []));
    }
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.pageIndex.set(0);
    this.loadData();
  }

  onIndustryFilterChange(val: string) {
    this.industryFilter.set(val);
    this.pageIndex.set(0);
    this.loadData();
  }

  onStatusFilterChange(val: any) {
    this.statusFilter.set(val);
    this.pageIndex.set(0);
    this.loadData();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
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
    this.loadData();
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  hasNotification(clientId: string | number): boolean {
    return this.notificationService.notifications().some(n => 
      n.entityType === 'CLIENT' && 
      String(n.entityId) === String(clientId) && 
      !n.read
    );
  }

  onCardClick(clientId: string | number) {
    this.notificationService.markEntityAsRead('CLIENT', clientId);
  }

  filteredClients = computed(() => {
    const list = [...this.clients()];
    return list.sort((a, b) => {
      const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
      const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
      return bHasNotif - aHasNotif;
    });
  });

  // Stats computed values
  activeProjectsCount = computed(
    () => this.projects().filter((p) => p.status === 'ACTIVE' && p.client).length,
  );

  uniqueIndustries = computed(
    () =>
      [
        ...new Set(
          this.clients()
            .map((c) => c.industry)
            .filter(Boolean),
        ),
      ] as string[],
  );

  uniqueIndustriesCount = computed(() => this.uniqueIndustries().length);

  getClientProjectCount(clientId: number): number {
    return this.projects().filter((p) => p.client?.id === clientId).length;
  }

  openClientDialog(client?: Client) {
    this.activeMenuId = null;
    const dialogRef = this.dialog.open(ClientFormComponent, {
      width: '600px',
      data: client,
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  toggleMenu(id: number) {
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  deleteClient(client: Client) {
    this.activeMenuId = null;
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      this.clientService.deleteClient(client.id).subscribe(() => this.loadData());
    }
  }

  getStatusClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'LEAD':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getIndustryClass(industry?: string): string {
    const ind = industry?.toLowerCase() || '';
    if (ind.includes('tech') || ind.includes('soft')) return 'bg-indigo-50 text-indigo-600';
    if (ind.includes('health') || ind.includes('pharma')) return 'bg-rose-50 text-rose-600';
    if (ind.includes('fin') || ind.includes('bank')) return 'bg-emerald-50 text-emerald-600';
    if (ind.includes('retail') || ind.includes('e-comm')) return 'bg-amber-50 text-amber-600';
    return 'bg-slate-50 text-slate-600';
  }
}
