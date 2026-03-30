import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatItem } from '../../../models/dashboard-stats.model';

@Component({
  selector: 'app-hub-dashboard-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hub-dashboard-banner.component.html',
  styleUrls: ['./hub-dashboard-banner.component.css']
})
export class HubDashboardBannerComponent {
  @Input() stats: StatItem[] = [];
  
  private router = inject(Router);

  navigateTo(route: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  getAccentClass(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('candidate')) return 'accent-indigo';
    if (l.includes('application')) return 'accent-emerald';
    if (l.includes('job')) return 'accent-blue';
    if (l.includes('interview')) return 'accent-rose';
    if (l.includes('project')) return 'accent-violet';
    if (l.includes('client')) return 'accent-cyan';
    if (l.includes('vendor')) return 'accent-slate';
    return 'accent-indigo';
  }
}
