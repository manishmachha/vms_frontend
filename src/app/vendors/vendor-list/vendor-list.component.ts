import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../../services/organization.service';
import { Vendor } from '../../models/organization.model';
import { HeaderService } from '../../services/header.service';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OrganizationLogoComponent],
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.css'],
})
export class VendorListComponent implements OnInit {
  organizationService = inject(OrganizationService);
  headerService = inject(HeaderService);
  notificationService = inject(NotificationService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  vendors = signal<Vendor[]>([]);
  unreadVendorIds = new Set<number>();
  activeCount = signal(0);
  inactiveCount = signal(0);
  searchQuery = '';
  activeTab = 'all';

  tabs = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ];

  ngOnInit() {
    this.headerService.setTitle('Vendor Management', 'Manage vendor organizations', 'bi bi-shop');
    this.loadUnreadVendorIds();
    this.loadVendors();
  }

  loadUnreadVendorIds() {
    this.notificationService.getUnreadEntityIds('ORGANIZATION').subscribe({
      next: (ids: any) => (this.unreadVendorIds = new Set(ids)),
      error: () => (this.unreadVendorIds = new Set()),
    });
  }

  hasNotification(orgId: number | string): boolean {
    return this.unreadVendorIds.has(orgId as number);
  }

  loadVendors() {
    this.organizationService.getVendors().subscribe((data: Vendor[]) => {
      // Sort: notified first
      const sorted = [...data].sort((a, b) => {
        const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
        const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
        return bHasNotif - aHasNotif;
      });
      this.vendors.set(sorted);
      this.activeCount.set(data.filter((v) => v.status === 'ACTIVE').length);
      this.inactiveCount.set(data.filter((v) => v.status === 'INACTIVE').length);
    });
  }

  filteredVendors() {
    let result = this.vendors();

    // Filter by tab
    if (this.activeTab !== 'all') {
      result = result.filter((v) => v.status === this.activeTab);
    }

    // Filter by search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(query));
    }

    return result;
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
