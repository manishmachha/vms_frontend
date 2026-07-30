import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { HubDashboardBannerComponent } from '../../shared/components/hub-dashboard-banner/hub-dashboard-banner.component';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';
import { HeaderService } from '../../services/header.service';
import { MatDialog } from '@angular/material/dialog';
import { ClientFormComponent } from '../components/client-form/client-form.component';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, OrganizationLogoComponent, HubDashboardBannerComponent],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css'],
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private headerService = inject(HeaderService);
  private mfeNav = inject(MfeNavigationService);
  private dialog = inject(MatDialog);
  clientId = signal<string>('');

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  client = signal<Client | undefined>(undefined);
  dashboardStats = signal<DashboardStatsResponse | null>(null);
  clientProjects = signal<Project[]>([]);

  activeProjectsCount = computed(() => {
    return this.clientProjects().filter((p) => p.status === 'ACTIVE').length;
  });

  ngOnInit() {
    this.headerService.setTitle(
      'Client Details',
      'Review client details and projects',
      'bi bi-building',
    );
    this.route.paramMap.subscribe((params) => {
      this.clientId.set(params.get('id') || '');
      if (this.clientId()) {
        this.loadClient(this.clientId());
        this.loadProjects(this.clientId());
      }
    });
  }

  loadClient(id: string | number) {
    this.clientService.getClientById(id).subscribe((client: Client) => {
      this.client.set(client);
    });

    this.clientService.getDashboardStats(id).subscribe({
      next: stats => this.dashboardStats.set(stats),
      error: err => console.error('Failed to load dashboard stats', err)
    });
  }

  loadProjects(clientId: string | number) {
    this.projectService.getProjects(0, 100).subscribe((page) => {
      const projects = page.content || [];
      const id = clientId;
      const filtered = projects.filter((p) => p.client?.id === id);
      this.clientProjects.set(filtered);
    });
  }

  openClientDialog(client?: Client) {
    const dialogRef = this.dialog.open(ClientFormComponent, {
      width: '600px',
      data: client,
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadClient(this.clientId());
    });
  }
}
