import { Routes } from '@angular/router';
import { InterviewListComponent } from './interview-list/interview-list.component';
import { InterviewDetailComponent } from './interview-detail/interview-detail.component';

export const INTERVIEW_ROUTES: Routes = [
  {
    path: '',
    component: InterviewListComponent
  },
  {
    path: ':id',
    component: InterviewDetailComponent
  }
];
