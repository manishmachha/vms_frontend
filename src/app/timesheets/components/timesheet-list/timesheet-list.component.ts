import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TimesheetService } from '../../services/timesheet.service';
import { Timesheet, TimesheetStats } from '../../models/timesheet.model';
import { HeaderService } from '../../../services/header.service';
import { AuthStore } from '../../../services/auth.store';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { OrganizationService } from '../../../services/organization.service';
import { Organization } from '../../../models/organization.model';

@Component({
  selector: 'app-timesheet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatPaginatorModule, MatSortModule],
  templateUrl: './timesheet-list.component.html',
})
export class TimesheetListComponent implements OnInit {
  timesheetService = inject(TimesheetService);
  headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  organizationService = inject(OrganizationService);

  dataSource = new MatTableDataSource<Timesheet>([]);
  displayedColumns: string[] = ['period', 'project', 'hours', 'status', 'actions'];
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  
  statusFilter = signal<string>('');
  vendorFilter = signal<string>('');
  sortField = signal<string>('');
  sortDirection = signal<string>('');
  
  stats = signal<TimesheetStats | null>(null);
  vendors = signal<Organization[]>([]);

  ngOnInit() {
    this.headerService.setTitle('Timesheets', 'Manage weekly timesheets', 'bi bi-clock-history');
    this.loadTimesheets();
    this.loadStats();
    
    if (this.authStore.isAdmin()) {
      this.loadVendors();
    }
  }

  loadTimesheets() {
    this.timesheetService.getTimesheets(
      this.pageIndex(), 
      this.pageSize(), 
      this.statusFilter() || undefined,
      this.vendorFilter() || undefined,
      this.sortField() || undefined,
      this.sortDirection() || undefined
    ).subscribe({
      next: (res) => {
        this.dataSource.data = res.content || [];
        this.totalElements.set(res.totalElements || 0);
      },
      error: (err) => console.error('Failed to load timesheets', err)
    });
  }

  loadStats() {
    this.timesheetService.getTimesheetStats(this.vendorFilter() || undefined).subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => console.error('Failed to load timesheet stats', err)
    });
  }

  loadVendors() {
    this.organizationService.getAllOrganizations(0, 100, undefined, 'VENDOR', 'ACTIVE').subscribe({
      next: (res) => this.vendors.set(res.content || []),
      error: (err) => console.error('Failed to load vendors', err)
    });
  }

  onFilterChange() {
    this.pageIndex.set(0);
    this.loadTimesheets();
    this.loadStats();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTimesheets();
  }

  onSortChange(event: Sort) {
    this.sortField.set(event.active);
    this.sortDirection.set(event.direction);
    this.pageIndex.set(0);
    this.loadTimesheets();
  }
}
