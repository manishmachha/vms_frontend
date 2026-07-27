import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TimesheetService } from '../../services/timesheet.service';
import { Timesheet } from '../../models/timesheet.model';
import { HeaderService } from '../../../services/header.service';
import { AuthStore } from '../../../services/auth.store';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-timesheet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatPaginatorModule],
  templateUrl: './timesheet-list.component.html',
})
export class TimesheetListComponent implements OnInit {
  timesheetService = inject(TimesheetService);
  headerService = inject(HeaderService);
  authStore = inject(AuthStore);

  dataSource = new MatTableDataSource<Timesheet>([]);
  displayedColumns: string[] = ['period', 'project', 'hours', 'status', 'actions'];
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  statusFilter = signal<string>('');

  ngOnInit() {
    this.headerService.setTitle('Timesheets', 'Manage weekly timesheets', 'bi bi-clock-history');
    this.loadTimesheets();
  }

  loadTimesheets() {
    this.timesheetService.getTimesheets(this.pageIndex(), this.pageSize(), this.statusFilter()).subscribe({
      next: (res) => {
        this.dataSource.data = res.content || [];
        this.totalElements.set(res.totalElements || 0);
      },
      error: (err) => console.error('Failed to load timesheets', err)
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTimesheets();
  }
}
