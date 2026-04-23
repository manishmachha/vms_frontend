import { ChangeDetectorRef, Component, inject, OnInit, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCalendar, MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { InterviewService } from '../../../services/interview.service';
import { Interview } from '../../../models/interview.model';
import { RouterLink } from "@angular/router";
import { MfeNavigationService } from '../../../services/mfe-navigation.service';

@Component({
  selector: 'app-interview-calendar',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatNativeDateModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './interview-calendar.component.html',
  styleUrls: ['./interview-calendar.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class InterviewCalendarComponent implements OnInit {
  interviewService = inject(InterviewService);
  cdr = inject(ChangeDetectorRef);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  interviews = signal<Interview[]>([]);
  selectedDate = new Date();
  selectedInterviews = signal<Interview[]>([]);
  interviewDateSet = new Set<string>();

  @ViewChild('calendarRef') calendarRef!: MatCalendar<Date>;

  ngOnInit() {
    this.loadInterviews();
  }

  loadInterviews() {
    this.interviewService.getAllInterviews().subscribe((res) => {
      const data = res || [];
      this.interviews.set(data);

      // Build a Set of date strings for O(1) lookup
      this.interviewDateSet.clear();
      data.forEach((i) => {
        if (i.scheduledAt) {
          const date = new Date(i.scheduledAt);
          this.interviewDateSet.add(this.formatDate(date));
        }
      });

      this.updateSelectedInterviews();

      // Force calendar to re-render cell classes after data loads
      setTimeout(() => {
        if (this.calendarRef) {
          // Both approaches to trigger a re-render
          this.calendarRef.updateTodaysDate();
          this.calendarRef.stateChanges.next();
          this.cdr.detectChanges();
        }
      }, 100);
    });
  }

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const dateStr = this.formatDate(cellDate);
      return this.interviewDateSet.has(dateStr) ? 'has-interview' : '';
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
