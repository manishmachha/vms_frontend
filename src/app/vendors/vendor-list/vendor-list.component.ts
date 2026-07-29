import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../../services/organization.service';
import { Vendor } from '../../models/organization.model';
import { HeaderService } from '../../services/header.service';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { NotificationDotComponent } from '../../shared/components/notification-dot/notification-dot.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    OrganizationLogoComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NotificationDotComponent
  ],
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.css'],
})
export class VendorListComponent implements OnInit {
  organizationService = inject(OrganizationService);
  headerService = inject(HeaderService);
  private mfeNav = inject(MfeNavigationService);

  viewMode = signal<'table' | 'grid'>('grid');
  dataSource = new MatTableDataSource<Vendor>([]);
  displayedColumns: string[] = ['vendor', 'orgType', 'registered', 'status', 'actions'];

  totalElements = signal(0);
  pageSize = signal(12);
  pageIndex = signal(0);
  sortField = signal('');
  sortOrder = signal('');

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  vendors = signal<Vendor[]>([]);
  activeCount = signal(0);
  inactiveCount = signal(0);
  searchQuery = '';
  activeTab = 'all';
  public notificationService = inject(NotificationService);

  tabs = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ];

  ngOnInit() {
    this.headerService.setTitle('Vendor Management', 'Manage vendor organizations', 'bi bi-shop');
    this.loadVendors();
  }

  hasNotification(orgId: number | string): boolean {
    return this.notificationService.notifications().some(n => 
      n.entityType === 'VENDOR' && 
      String(n.entityId) === String(orgId) && 
      !n.read
    );
  }

  onCardClick(orgId: number | string) {
    this.notificationService.markEntityAsRead('VENDOR', orgId);
  }

  loadVendors() {
    let sortStr: string | undefined = undefined;
    if (this.sortField() && this.sortOrder()) {
      sortStr = `${this.sortField()},${this.sortOrder()}`;
    }
    const statusF = this.activeTab === 'all' ? 'ALL' : this.activeTab;
    this.organizationService
      .getVendors(this.pageIndex(), this.pageSize(), this.searchQuery, statusF, sortStr)
      .subscribe((pageData) => {
        const sorted = [...pageData.content].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.vendors.set(sorted);
        this.dataSource.data = sorted;
        this.totalElements.set(pageData.totalElements);
        this.activeCount.set(sorted.filter((v) => v.status === 'ACTIVE').length);
        this.inactiveCount.set(sorted.filter((v) => v.status === 'INACTIVE').length);
      });
  }

  onTabChange(tabValue: string) {
    this.activeTab = tabValue;
    this.pageIndex.set(0);
    this.loadVendors();
  }

  onSearchChange() {
    this.pageIndex.set(0);
    this.loadVendors();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadVendors();
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
    this.loadVendors();
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  filteredVendors() {
    return this.vendors();
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return 'badge-warning';
      case 'ACTIVE':
        return 'badge-success';
      case 'INACTIVE':
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  }

  approve(id: number | string) {
    if (confirm('Approve this vendor?')) {
      this.organizationService.approveVendor(id).subscribe(() => this.loadVendors());
    }
  }

  reject(id: number | string) {
    if (confirm('Reject this vendor?')) {
      this.organizationService.rejectVendor(id).subscribe(() => this.loadVendors());
    }
  }

  toggleStatus(vendor: Vendor, newStatus: string) {
    const action = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    if (confirm(`Are you sure you want to ${action} this vendor?`)) {
      this.organizationService.updateStatus(vendor.id, newStatus).subscribe(() => {
        this.loadVendors();
      });
    }
  }

  gradients = [
    'from-emerald-400 to-teal-500',
    'from-indigo-400 to-purple-500',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-500',
    'from-lime-400 to-green-500',
    'from-fuchsia-400 to-violet-500',
  ];

  getRandomGradient(): string {
    return this.gradients[Math.floor(Math.random() * this.gradients.length)];
  }
}
