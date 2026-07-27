import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TimesheetService } from '../../services/timesheet.service';
import { ProjectService } from '../../../services/project.service';
import { CreateTimesheetRequest } from '../../models/timesheet.model';
import { HeaderService } from '../../../services/header.service';
import { AuthStore } from '../../../services/auth.store';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-timesheet-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './timesheet-form.component.html',
})
export class TimesheetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private timesheetService = inject(TimesheetService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private headerService = inject(HeaderService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEdit = signal(false);
  timesheetId = signal<string | null>(null);
  
  projectName = signal('Loading...');
  requestId = signal('Loading...');
  projectAllocationId = signal<number | null>(null);
  
  selectedFile = signal<File | null>(null);
  submitting = signal(false);

  ngOnInit() {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.timesheetId.set(id);
      this.headerService.setTitle('Edit Timesheet', 'Update your timesheet', 'bi bi-pencil-square');
      this.loadTimesheet(id);
    } else {
      this.headerService.setTitle('New Timesheet', 'Submit a new timesheet', 'bi bi-plus-circle');
      this.loadActiveProject();
      this.prefillCurrentWeek();
    }
  }

  initForm() {
    this.form = this.fb.group({
      weekStartDate: ['', Validators.required],
      weekEndDate: ['', Validators.required],
      employeeNotes: [''],
      entries: this.fb.array([])
    });
  }

  get entries() {
    return this.form.get('entries') as FormArray;
  }

  addEntry(date = '', hours = 0, desc = '') {
    this.entries.push(this.fb.group({
      entryDate: [date, Validators.required],
      hours: [hours, [Validators.required, Validators.min(0), Validators.max(24)]],
      taskDescription: [desc, Validators.required]
    }));
  }

  removeEntry(index: number) {
    this.entries.removeAt(index);
  }

  prefillCurrentWeek() {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));
    const sunday = new Date(today.setDate(diffToMonday + 6));
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    this.form.patchValue({
      weekStartDate: formatDate(monday),
      weekEndDate: formatDate(sunday)
    });
    
    // Add 5 empty days for Mon-Fri
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      this.addEntry(formatDate(d), 0, '');
    }
  }

  loadActiveProject() {
    this.projectService.getProjects(0, 10, undefined, undefined, 'ACTIVE').subscribe({
      next: (res) => {
        if (res.content && res.content.length > 0) {
          const project = res.content[0];
          this.projectName.set(project.name);
          this.requestId.set(project.requestId || 'N/A');
          
          if (project.allocations && project.allocations.length > 0) {
            // Assume the first allocation is the current user's allocation for this employee
            this.projectAllocationId.set(project.allocations[0].id!);
          } else {
            this.snackBar.open('No allocation found in the active project.', 'Close', { duration: 5000 });
          }
        } else {
          this.projectName.set('No active project found');
          this.requestId.set('N/A');
          this.snackBar.open('You do not have any active projects.', 'Close', { duration: 5000 });
        }
      },
      error: () => this.snackBar.open('Failed to load project details', 'Close', { duration: 3000 })
    });
  }

  loadTimesheet(id: string) {
    this.timesheetService.getTimesheetById(id).subscribe({
      next: (ts) => {
        this.projectName.set(ts.projectName);
        this.requestId.set(ts.projectRequestId || 'N/A');
        this.projectAllocationId.set(ts.projectAllocationId);
        
        this.form.patchValue({
          weekStartDate: ts.weekStartDate,
          weekEndDate: ts.weekEndDate,
          employeeNotes: ts.employeeNotes
        });
        
        // Clear and add entries
        this.entries.clear();
        ts.entries.forEach(e => {
          this.addEntry(e.entryDate, e.hours, e.taskDescription);
        });
      },
      error: () => this.snackBar.open('Failed to load timesheet', 'Close', { duration: 3000 })
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowed.includes(file.type)) {
        this.snackBar.open('Invalid file type. Only PDF, DOCX, JPG, PNG allowed.', 'Close', { duration: 3000 });
        event.target.value = null;
        return;
      }
      this.selectedFile.set(file);
    }
  }

  onSubmit(submit: boolean) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    if (!this.projectAllocationId()) {
      this.snackBar.open('Missing project allocation. Cannot save timesheet.', 'Close', { duration: 3000 });
      return;
    }

    this.submitting.set(true);
    const data: CreateTimesheetRequest = {
      ...this.form.value,
      projectAllocationId: this.projectAllocationId()!,
      submit
    };

    const req$ = this.isEdit() 
      ? this.timesheetService.updateTimesheet(this.timesheetId()!, data)
      : this.timesheetService.createTimesheet(data);

    req$.subscribe({
      next: (res) => {
        if (this.selectedFile()) {
          this.timesheetService.uploadInvoice(res.id, this.selectedFile()!).subscribe({
            next: () => this.finalizeSubmit(submit),
            error: () => {
              this.submitting.set(false);
              this.snackBar.open('Timesheet saved, but failed to upload invoice.', 'Close', { duration: 3000 });
              this.router.navigate(['/timesheets']);
            }
          });
        } else {
          this.finalizeSubmit(submit);
        }
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Failed to save timesheet', 'Close', { duration: 3000 });
      }
    });
  }
  
  finalizeSubmit(submit: boolean) {
    this.submitting.set(false);
    this.snackBar.open(`Timesheet ${submit ? 'submitted' : 'saved as draft'} successfully`, 'OK', { duration: 3000 });
    this.router.navigate(['/timesheets']);
  }
  
  getTotalHours(): number {
    return this.entries.controls.reduce((acc, curr) => acc + (Number(curr.get('hours')?.value) || 0), 0);
  }
}
