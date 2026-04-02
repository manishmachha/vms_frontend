import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './job-create.component.html',
  styleUrls: ['./job-create.component.css'],
})
export class JobCreateComponent implements OnInit {
  fb = inject(FormBuilder);
  jobService = inject(JobService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isEditing = signal(false);
  jobId = signal<string | null>(null);

  jobForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    requirements: [''],
    rolesAndResponsibilities: [''],
    experience: [''],
    skills: [''],
    employmentType: ['C2H', Validators.required],
    billRate: [null as number | null],
    payRate: [null as number | null],
    requestId: [''],
    status: ['SUBMITTED'],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.jobId.set(id);
      this.loadJob(id);
    }
  }

  loadJob(id: string) {
    this.jobService.getJob(id).subscribe((job) => {
      this.jobForm.patchValue({
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        rolesAndResponsibilities: job.rolesAndResponsibilities,
        experience: job.experience,
        skills: job.skills,
        employmentType: job.employmentType,
        billRate: job.billRate,
        payRate: job.payRate,
        requestId: job.requestId,
        status: job.status,
      } as any);
    });
  }

  onSubmit() {
    if (this.jobForm.valid) {
      const formValue = this.jobForm.value;

      if (this.isEditing() && this.jobId()) {
        this.jobService.updateJob(this.jobId()!, formValue as any).subscribe({
          next: () => {
            this.router.navigate(['/jobs', this.jobId()]);
          },
        });
      } else {
        // Ensure status is SUBMITTED for new jobs
        formValue.status = 'SUBMITTED';
        this.jobService.createJob(formValue as any).subscribe({
          next: () => {
            this.router.navigate(['/jobs']);
          },
        });
      }
    }
  }

  saveDraft() {
    const formValue = this.jobForm.value;
    formValue.status = 'DRAFT';

    if (this.isEditing() && this.jobId()) {
      this.jobService.updateJob(this.jobId()!, formValue as any).subscribe({
        next: () => {
          this.router.navigate(['/jobs', this.jobId()]);
        },
      });
    } else {
      this.jobService.createJob(formValue as any).subscribe({
        next: () => {
          this.router.navigate(['/jobs']);
        },
      });
    }
  }
}
