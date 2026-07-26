import { Routes } from '@angular/router';
import { TicketListComponent } from './components/ticket-list/ticket-list.component';
import { TicketFormComponent } from './components/ticket-form/ticket-form.component';
import { TicketDetailComponent } from './components/ticket-detail/ticket-detail.component';

export const TICKET_ROUTES: Routes = [
  {
    path: '',
    component: TicketListComponent,
  },
  {
    path: 'new',
    component: TicketFormComponent,
  },
  {
    path: ':id',
    component: TicketDetailComponent,
  }
];
