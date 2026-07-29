import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApplicationService } from '../../services/application.service';
import { HeaderService } from '../../services/header.service';
import { JobApplication } from '../../models/application.model';
import { NotificationDotComponent } from '../../shared/components/notification-dot/notification-dot.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-vendor-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, NotificationDotComponent],
  templateUrl: './vendor-application-list.component.html',
  styleUrls: ['./vendor-application-list.component.css'],
})
export class VendorApplicationListComponent implements OnInit {
  applicationService = inject(ApplicationService);
  headerService = inject(HeaderService);
  applications = signal<JobApplication[]>([]);
  public notificationService = inject(NotificationService);

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
    this.loadApplications();
  }

  hasNotification(appId: string | number): boolean {
    return this.notificationService.notifications().some(n => 
      ['APPLICATION', 'SUBMISSION'].includes(n.entityType) && 
      String(n.entityId) === String(appId) && 
      !n.read
    );
  }

  onCardClick(appId: string | number) {
    this.notificationService.markEntityAsRead('APPLICATION', appId);
    this.notificationService.markEntityAsRead('SUBMISSION', appId);
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
