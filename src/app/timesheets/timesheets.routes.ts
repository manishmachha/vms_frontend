import { Routes } from '@angular/router';
import { TimesheetListComponent } from './components/timesheet-list/timesheet-list.component';
import { TimesheetFormComponent } from './components/timesheet-form/timesheet-form.component';
import { TimesheetDetailComponent } from './components/timesheet-detail/timesheet-detail.component';

export const TIMESHEET_ROUTES: Routes = [
  {
    path: '',
    component: TimesheetListComponent
  },
  {
    path: 'new',
    component: TimesheetFormComponent
  },
  {
    path: ':id',
    component: TimesheetDetailComponent
  },
  {
    path: 'edit/:id',
    component: TimesheetFormComponent
  }
];
