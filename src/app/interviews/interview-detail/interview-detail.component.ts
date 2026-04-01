import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { Interview } from '../../models/interview.model';
import { MatIconModule } from '@angular/material/icon';
import { HeaderService } from '../../services/header.service';

@Component({
  selector: 'app-interview-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './interview-detail.component.html',
  styleUrls: ['./interview-detail.component.css'],
})
export class InterviewDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private interviewService = inject(InterviewService);
  private headerService = inject(HeaderService);
  interview = signal<Interview | null>(null);

  ngOnInit() {
    this.headerService.setTitle(
      'Interview Details',
      'Review interview details',
      'bi bi-calendar-check',
    );
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadInterview(params['id']);
      }
    });
  }

  loadInterview(id: number) {
    this.interviewService.getInterviewById(id).subscribe({
      next: (res) => {
        this.interview.set(res || null);
      },
      error: () => this.interview.set(null)
    });
  }

  getStatusClass(interview: Interview): string {
    switch (interview.status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }
}
