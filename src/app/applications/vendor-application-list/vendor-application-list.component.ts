import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApplicationService } from '../../services/application.service';
import { NotificationService } from '../../services/notification.service';
import { HeaderService } from '../../services/header.service';
import { JobApplication } from '../../models/application.model';

@Component({
  selector: 'app-vendor-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  templateUrl: './vendor-application-list.component.html',
  styleUrls: ['./vendor-application-list.component.css'],
})
export class VendorApplicationListComponent implements OnInit {
  applicationService = inject(ApplicationService);
  notificationService = inject(NotificationService);
  headerService = inject(HeaderService);
  applications = signal<JobApplication[]>([]);
  unreadAppIds = new Set<string>();

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  searchText = '';
  statusFilter = '';

  ngOnInit() {
    this.headerService.setTitle(
      'My Applications',
      'Track the status of your candidates',
      'bi bi-people',
    );
    this.loadUnreadAppIds();
    this.loadApplications();
  }

  loadUnreadAppIds() {
    this.notificationService.getUnreadEntityIds('APPLICATION').subscribe({
      next: (ids) => (this.unreadAppIds = new Set(ids.map(String))),
      error: () => (this.unreadAppIds = new Set()),
    });
  }

  hasNotification(appId: string | number): boolean {
    return this.unreadAppIds.has(String(appId));
  }

  loadApplications(pageIndex: number = 0, pageSize: number = this.pageSize) {
    this.applicationService
      .getApplications(
        undefined,
        pageIndex,
        pageSize,
        undefined,
        this.searchText || undefined,
        (this.statusFilter || undefined) as any
      )
      .subscribe((page) => {
        const sorted = [...(page.content || [])].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.applications.set(sorted);
        this.totalElements = page.totalElements || 0;
        this.currentPage = page.number || pageIndex;
      });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.loadApplications(event.pageIndex, event.pageSize);
  }

  onSearchOrFilter() {
    this.loadApplications(0, this.pageSize);
  }
}
