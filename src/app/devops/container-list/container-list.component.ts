import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';
import { DevOpsService } from '../../services/devops.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-container-list',
  standalone: true,
  imports: [CommonModule, LogViewerComponent, RouterModule],
  templateUrl: './container-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerListComponent implements OnInit, OnDestroy {
  // Signals for reactive container state
  containers = signal<any[]>([]);
  loading = signal(false);
  private pollSubscription?: Subscription;

  constructor(private devOpsService: DevOpsService) {}

  ngOnInit(): void {
    this.loadContainers();
    // Poll every 5 seconds for status updates
    this.pollSubscription = interval(5000).subscribe(() => this.loadContainers(true));
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  loadContainers(silent = false): void {
    if (!silent) this.loading.set(true);
    this.devOpsService.getContainers().subscribe({
      next: (data) => {
        this.containers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load containers', err);
        this.loading.set(false);
      }
    });
  }

  performAction(containerId: string, action: string): void {
    this.devOpsService.containerAction(containerId, action).subscribe({
      next: () => {
        this.loadContainers(true);
      },
      error: (err) => alert('Action failed: ' + err.message)
    });
  }

  getStatusColor(status: string): string {
    if (status.includes('Up')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (status.includes('Exited')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}
