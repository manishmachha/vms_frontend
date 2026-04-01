import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { InterviewService } from '../../../services/interview.service';
import { UserService } from '../../../services/user.service';
import { AuthStore } from '../../../services/auth.store';
import { ApplicationService } from '../../../services/application.service';
import { InterviewType } from '../../../models/interview.model';
import { JobApplication } from '../../../models/application.model';

@Component({
  selector: 'app-schedule-interview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './schedule-interview-dialog.component.html',
})
export class ScheduleInterviewDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private interviewService = inject(InterviewService);
  private userService = inject(UserService);
  private applicationService = inject(ApplicationService);
  private authStore = inject(AuthStore);
  public dialogRef = inject(MatDialogRef<ScheduleInterviewDialogComponent>);
  public data = inject(MAT_DIALOG_DATA);

  applications = signal<JobApplication[]>([]);
  appSearchTerm = signal('');

  potentialCcUsers = signal<any[]>([]);
  userSearchTerm = signal('');

  filteredCcUsers = computed(() => {
    const term = this.userSearchTerm().toLowerCase();
    const users = this.potentialCcUsers();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.organizationName?.toLowerCase().includes(term),
    );
  });

  filteredApplications = computed(() => {
    const term = this.appSearchTerm().toLowerCase();
    const apps = this.applications();
    if (!term) return apps;
    return apps.filter(
      (a) =>
        a.candidate?.firstName.toLowerCase().includes(term) ||
        a.candidate?.lastName.toLowerCase().includes(term) ||
        a.job?.title.toLowerCase().includes(term)
    );
  });

  scheduleForm = this.fb.group({
    applicationId: [this.data?.applicationId || null, Validators.required],
    scheduledAt: ['', Validators.required],
    durationMinutes: [30, [Validators.required, Validators.min(15)]],
    type: ['TECHNICAL' as InterviewType, Validators.required],
    meetingLink: [''],
    ccUserIds: [[] as number[]],
    schedulingNotes: [''],
  });

  ngOnInit() {
    this.loadPotentialCcUsers();
    if (!this.data?.applicationId) {
      this.loadApplications();
    }
  }

  loadApplications() {
    this.applicationService.getApplications(undefined, 0, 100, 'INBOUND').subscribe({
      next: (res) => this.applications.set(res.content || []),
      error: (err) => console.error('Failed to load applications', err)
    });
  }

  loadPotentialCcUsers() {
    const internalUsers$ = this.userService.getUsers().pipe(
      map((res: any) => res.data || res),
      catchError(() => of([])),
    );

    forkJoin([internalUsers$]).subscribe(([internal]) => {
      const unique = Array.from(new Map(internal.map((u: any) => [u.id, u])).values());
      this.potentialCcUsers.set(unique);
    });
  }

  scheduleInterview() {
    if (this.scheduleForm.invalid) return;

    const formValue = this.scheduleForm.value;
    const request = {
      ...formValue,
      applicationId: Number(formValue.applicationId),
      interviewerId: this.authStore.user()?.id || 1,
    };

    this.interviewService.scheduleInterview(request).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        // We could use a global error snackbar or similar
        console.error('Failed to schedule interview');
      }
    });
  }
}
