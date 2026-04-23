import { Component, inject, OnInit, signal, computed } from '@angular/core';
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

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatDialogModule, OrganizationLogoComponent],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css'],
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  clients = signal<Client[]>([]);
  projects = signal<Project[]>([]);

  searchQuery = signal('');
  industryFilter = signal('');
  activeMenuId: number | null = null;

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
    this.clientService.getAllClients().subscribe((data) => this.clients.set(data));
    this.projectService.getProjects().subscribe((data) => this.projects.set(data));
  }

  filteredClients = computed(() => {
    let result = this.clients();
    const query = this.searchQuery().toLowerCase();
    const filter = this.industryFilter();

    if (filter) {
      result = result.filter((c) => c.industry === filter);
    }

    if (query) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.city?.toLowerCase().includes(query) ||
          c.industry?.toLowerCase().includes(query),
      );
    }

    return result;
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
