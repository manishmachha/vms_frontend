import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { Interview } from '../../models/interview.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-interview-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="space-y-6 animate-fade-in pb-10" *ngIf="interview()">
      <!-- Breadcrumb / Back -->
      <div class="flex items-center gap-2">
        <a routerLink="/interviews" class="p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 transition-all">
          <i class="bi bi-arrow-left text-lg"></i>
        </a>
        <span class="text-sm font-medium text-gray-400 tracking-wide uppercase">Pipeline / Details</span>
      </div>

      <!-- Main Header Card -->
      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
        <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <i class="bi bi-calendar-event text-9xl"></i>
        </div>
        
        <div class="p-6 lg:p-10 relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div class="flex gap-6 items-center">
            <div class="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <i class="bi bi-person-badge text-4xl"></i>
            </div>
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-3xl font-black text-gray-900 leading-none">
                  {{ interview()?.application?.candidate?.firstName }} {{ interview()?.application?.candidate?.lastName }}
                </h1>
                <span [class]="'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ' + getStatusClass(interview()!)">
                  {{ interview()?.status }}
                </span>
              </div>
              <p class="text-lg font-bold text-gray-400 mb-1">{{ interview()?.application?.job?.title }}</p>
              
              <!-- Job Detail Sub-header -->
              <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-sm">

                <div class="flex items-center gap-1.5 text-gray-500" *ngIf="interview()?.application?.job?.location">
                  <i class="bi bi-geo-alt text-gray-400"></i>
                  <span class="font-medium">{{ interview()?.application?.job?.location }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-gray-500">
                  <i class="bi bi-briefcase text-gray-400"></i>
                  <span class="font-medium">{{ interview()?.application?.job?.employmentType }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-gray-500" *ngIf="interview()?.application?.job?.experience">
                  <i class="bi bi-clock-history text-gray-400"></i>
                  <span class="font-medium">{{ interview()?.application?.job?.experience }} Exp.</span>
                </div>
              </div>
              
              <div class="flex flex-wrap gap-4">
                <div class="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50 shadow-sm transition-all hover:shadow-md">
                  <i class="bi bi-patch-check-fill text-indigo-500"></i>
                  <span class="text-xs font-bold text-indigo-700 uppercase tracking-wide">{{ interview()?.type?.replace('_', ' ') }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50 shadow-sm transition-all hover:shadow-md">
                  <i class="bi bi-calendar-check text-emerald-500"></i>
                  <span class="text-xs font-bold text-emerald-700 uppercase tracking-wide">{{ interview()?.scheduledAt | date:'medium' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 self-end lg:self-center">
            <a 
              *ngIf="interview()?.meetingLink"
              [href]="interview()?.meetingLink" 
              target="_blank"
              class="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] hover:shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <i class="bi bi-camera-video"></i>
              Join Interview
            </a>
            <button 
              class="w-12 h-12 rounded-2xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
            >
              <i class="bi bi-three-dots"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Details Bento Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Candidate / Application Info -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:border-indigo-100 transition-all">
            <h3 class="text-sm font-bold text-gray-900 border-b border-gray-50 pb-4 mb-5 flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <i class="bi bi-person"></i>
              </div>
              Candidate Info
            </h3>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="bi bi-envelope text-indigo-500"></i>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Email Address</p>
                  <p class="text-sm font-medium text-gray-900">{{ interview()?.application?.candidate?.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="bi bi-telephone text-indigo-500"></i>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Phone Number</p>
                  <p class="text-sm font-medium text-gray-900">{{ interview()?.application?.candidate?.phone }}</p>
                </div>
              </div>
            </div>
            <button routerLink="/candidates/{{interview()?.application?.candidate?.id}}" class="w-full mt-6 py-2.5 rounded-2xl bg-gray-50 text-indigo-600 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-transparent">
              View Profile
            </button>
          </div>

          <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:border-purple-100 transition-all">
            <h3 class="text-sm font-bold text-gray-900 border-b border-gray-50 pb-4 mb-5 flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <i class="bi bi-people"></i>
              </div>
              Interviewer Info
            </h3>
            <div class="flex items-center gap-4 group cursor-default">
              <div class="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                {{ interview()?.interviewer?.firstName?.charAt(0) }}
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Lead Interviewer</p>
                <h4 class="text-sm font-bold text-gray-900">{{ interview()?.interviewer?.firstName }} {{ interview()?.interviewer?.lastName }}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback & Notes -->
        <div class="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-lg font-bold text-gray-900 flex items-center gap-3">
              <div class="p-2 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <i class="bi bi-chat-left-text"></i>
              </div>
              Feedback & Evaluation
            </h3>
            <div class="flex items-center gap-1" *ngIf="interview()?.rating">
              <i *ngFor="let star of [1,2,3,4,5]" 
                 [class]="'bi text-xl ' + (star <= interview()!.rating! ? 'bi-star-fill text-amber-400 animate-pulse' : 'bi-star text-gray-200')">
              </i>
            </div>
          </div>

          <div class="flex-1 space-y-6">
            <!-- Scheduling Notes (If exists) -->
            <div *ngIf="interview()?.schedulingNotes" class="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50">
              <h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <i class="bi bi-journal-text"></i>
                Scheduling Notes
              </h4>
              <p class="text-sm text-indigo-900 leading-relaxed italic">
                "{{ interview()?.schedulingNotes }}"
              </p>
            </div>

            <!-- CC Users (If exists) -->
            <div *ngIf="interview()?.ccUsers?.length" class="bg-blue-50/30 rounded-2xl p-6 border border-blue-100/30">
              <h4 class="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <i class="bi bi-people"></i>
                CC'd on this Interview
              </h4>
              <div class="flex flex-wrap gap-2">
                <div *ngFor="let cc of interview()?.ccUsers" class="px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-blue-700 text-xs font-bold shadow-sm">
                  {{ cc.firstName }} {{ cc.lastName }}
                </div>
              </div>
            </div>

            <div class="flex-1 bg-gray-50/50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center items-center text-center group" *ngIf="!interview()?.feedback; else feedbackBody">
              <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <i class="bi bi-pencil-square text-2xl text-gray-300 group-hover:text-amber-500"></i>
              </div>
              <p class="text-gray-900 font-bold mb-1">Awaiting Evaluation</p>
              <p class="text-sm text-gray-500 max-w-xs mb-6">Feedback from the interviewer hasn't been submitted yet.</p>
              <button class="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs shadow-md hover:bg-gray-800 transition-colors">
                Request Feedback
              </button>
            </div>

            <ng-template #feedbackBody>
              <div class="space-y-6">
                <div>
                  <p class="text-sm text-gray-700 leading-relaxed italic bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                    "{{ interview()?.feedback }}"
                  </p>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InterviewDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private interviewService = inject(InterviewService);

  interview = signal<Interview | null>(null);

  ngOnInit() {
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
