import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { InterviewService } from '../../../services/interview.service';
import { Interview } from '../../../models/interview.model';

@Component({
  selector: 'app-interview-calendar',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatNativeDateModule, MatCardModule, MatIconModule],
  template: `
    <div
      class="calendar-container h-full flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 class="text-sm font-bold text-gray-900 flex items-center gap-2">
          <mat-icon class="text-indigo-600! icon-sm">calendar_today</mat-icon>
          Interview Schedule
        </h3>
      </div>

      <div class="flex-1 overflow-auto p-4">
        <mat-calendar
          [dateClass]="dateClass"
          [(selected)]="selectedDate"
          (selectedChange)="onDateSelected($event)"
          class="modern-calendar"
        >
        </mat-calendar>

        <div class="mt-6 space-y-4" *ngIf="selectedInterviews().length > 0; else noInterviews">
          <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
            {{ selectedDate | date: 'mediumDate' }}
          </h4>
          <div class="space-y-3">
            <div
              *ngFor="let interview of selectedInterviews()"
              class="group p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all"
            >
              <div class="flex justify-between items-start mb-1">
                <div>
                  <p class="text-xs font-bold text-gray-900 capitalize">
                    {{ interview.type.toLowerCase().replace('_', ' ') }}
                  </p>
                  <p class="text-[10px] text-gray-500">
                    {{ interview.scheduledAt | date: 'shortTime' }} ({{
                      interview.durationMinutes
                    }}m)
                  </p>
                </div>
                <span
                  class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {{ interview.status }}
                </span>
              </div>
              <div
                class="flex items-center gap-1.5 text-xs text-gray-600"
                *ngIf="interview.application?.candidate"
              >
                <mat-icon class="text-[14px] w-[14px] h-[14px] leading-none text-gray-400"
                  >person</mat-icon
                >
                <span class="font-medium"
                  >{{ interview.application!.candidate?.firstName }}
                  {{ interview.application!.candidate?.lastName }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <ng-template #noInterviews>
          <div class="mt-8 text-center py-6 opacity-30">
            <mat-icon class="text-2xl mb-1">event_busy</mat-icon>
            <p class="text-[10px] font-medium">No interviews</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .modern-calendar {
        width: 100% !important;
      }
      ::ng-deep .modern-calendar .mat-calendar-header {
        padding: 0 0 8px 0 !important;
      }
      ::ng-deep .modern-calendar .mat-calendar-content {
        padding: 0 !important;
      }
      ::ng-deep .modern-calendar .mat-calendar-table-header th {
        color: #9ca3af !important;
        font-weight: 700 !important;
        font-size: 10px !important;
        text-transform: uppercase !important;
      }
      ::ng-deep .modern-calendar .mat-calendar-body-cell-content {
        border-radius: 8px !important;
        font-size: 12px !important;
      }
      ::ng-deep .modern-calendar .mat-calendar-body-selected {
        background-color: #6366f1 !important;
        color: white !important;
      }
      ::ng-deep .has-interview .mat-calendar-body-cell-content {
        background-color: #fef2f2 !important;
        color: #ef4444 !important;
        font-weight: 700 !important;
        position: relative;
      }
      ::ng-deep .has-interview .mat-calendar-body-cell-content::after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background-color: #ef4444;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class InterviewCalendarComponent implements OnInit {
  interviewService = inject(InterviewService);
  interviews = signal<Interview[]>([]);
  selectedDate = new Date();
  selectedInterviews = signal<Interview[]>([]);

  ngOnInit() {
    this.loadInterviews();
  }

  loadInterviews() {
    this.interviewService.getAllInterviews().subscribe((res) => {
      this.interviews.set(res || []);
      this.updateSelectedInterviews();
    });
  }

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const dateStr = this.formatDate(cellDate);
      const hasInterview = this.interviews().some(
        (i) => this.formatDate(new Date(i.scheduledAt)) === dateStr,
      );
      return hasInterview ? 'has-interview' : '';
    }
    return '';
  };

  onDateSelected(date: Date | null) {
    if (date) {
      this.selectedDate = date;
      this.updateSelectedInterviews();
    }
  }

  updateSelectedInterviews() {
    const dateStr = this.formatDate(this.selectedDate);
    this.selectedInterviews.set(
      this.interviews().filter((i) => this.formatDate(new Date(i.scheduledAt)) === dateStr),
    );
  }

  private formatDate(date: Date): string {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  }
}
