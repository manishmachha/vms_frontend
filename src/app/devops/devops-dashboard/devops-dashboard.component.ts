import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';
import { DevOpsService } from '../../services/devops.service';

@Component({
  selector: 'app-devops-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LogViewerComponent],
  templateUrl: './devops-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevOpsDashboardComponent implements OnInit {
  // Signals for state management
  branches = signal<string[]>([]);
  selectedBranch = signal<string | null>(null);
  commits = signal<any[]>([]);
  loading = signal(false);
  deploying = signal(false);
  repoType = signal<'vms-backend' | 'vms-ui'>('vms-backend');

  constructor(private devOpsService: DevOpsService) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  setRepoType(type: 'vms-backend' | 'vms-ui'): void {
    this.repoType.set(type);
    this.selectedBranch.set(null);
    this.commits.set([]);
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading.set(true);
    this.devOpsService.getBranches(this.repoType()).subscribe({
      next: (data) => {
        this.branches.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(`Failed to load branches for ${this.repoType()}`, err);
        this.loading.set(false);
      }
    });
  }

  selectBranch(branch: string): void {
    this.selectedBranch.set(branch);
    this.loadCommits(branch);
  }

  loadCommits(branch: string): void {
    this.devOpsService.getCommits(branch, this.repoType()).subscribe(data => {
      this.commits.set(data);
    });
  }

  deploy(branch: string): void {
    const imageTag = `feature-${branch.replace('feature/', '')}`;
    this.deploying.set(true);
    this.devOpsService.deploy(branch, imageTag).subscribe({
      next: () => {
        this.deploying.set(false);
        alert('Deployment triggered for environment: ' + branch);
      },
      error: (err) => {
        this.deploying.set(false);
        alert('Deployment failed: ' + err.message);
      }
    });
  }

  deleteBranch(branch: string): void {
    if (confirm(`Are you sure you want to undeploy and delete ALL containers for branch ${branch}?`)) {
      this.devOpsService.undeploy(branch).subscribe({
        next: () => {
          alert('Undeployed ' + branch);
          this.loadBranches();
        },
        error: (err) => alert('Undeploy fail: ' + err.message)
      });
    }
  }
}
