import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService, AllocateUserRequest } from '../../../services/project.service';
import { User } from '../../../models/auth.model';
import { DialogService } from '../../../services/dialog.service';
import { ModalComponent } from '../../../layout/components/modal/modal.component';

@Component({
  selector: 'app-allocate-resource-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Allocate Resource" (isOpenChange)="onClose()">
      <form [formGroup]="allocateForm" (ngSubmit)="allocateUser()" class="space-y-5">


        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Candidate</label>
          <div class="relative">
            <select
              formControlName="candidateId"
              class="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white"
            >
              <option value="">Choose a candidate...</option>
              <option *ngFor="let candidate of candidates" [value]="candidate.id">
                {{ candidate.firstName }} {{ candidate.lastName }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Billing Role</label>
          <input
            formControlName="billingRole"
            placeholder="e.g. Senior Frontend Developer"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              formControlName="startDate"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-gray-700">Allocation %</label>
              <!-- Info Icon ... -->
            </div>
            <div class="relative rounded-md shadow-sm">
              <input
                type="number"
                formControlName="percentage"
                min="0"
                max="100"
                class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3">
          <button
            type="button"
            (click)="onClose()"
            class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="allocateForm.invalid"
            class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
          >
            <span>Confirm Allocation</span>
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [],
})
export class AllocateResourceModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() projectId: number | null = null;
  @Input() users: User[] = [];
  @Input() candidates: any[] = []; // Type should be Candidate[]
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private dialogService = inject(DialogService);


  allocateForm = this.fb.group({
    candidateId: ['', Validators.required],
    startDate: ['', Validators.required],
    percentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    billingRole: [''],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.allocateForm.reset({ percentage: 100 });
    }
  }

  allocateUser() {
    if (this.allocateForm.valid && this.projectId) {
      const val = this.allocateForm.value;

      const candidateIdVal = Number(val.candidateId);

      const req: AllocateUserRequest = {
        candidateId: candidateIdVal,
        startDate: val.startDate!,
        percentage: val.percentage!,
        billingRole: val.billingRole || undefined,
      };

      this.projectService.allocateUser(this.projectId, req).subscribe({
        next: () => {
          this.saved.emit();
          this.onClose();
        },
        error: () => {
          this.dialogService.open('Error', 'Failed to allocate resource');
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
