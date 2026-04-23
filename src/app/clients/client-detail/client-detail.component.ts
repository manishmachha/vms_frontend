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
      const id = params.get('id');
      if (id) {
        this.loadClient(id);
        this.loadProjects(id);
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
    this.projectService.getProjects().subscribe((projects: Project[]) => {
      const id = Number(clientId);
      const filtered = projects.filter((p) => p.client?.id === id);
      this.clientProjects.set(filtered);
    });
  }
}
