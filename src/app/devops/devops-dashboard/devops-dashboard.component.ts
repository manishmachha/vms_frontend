import { Component, OnInit } from '@angular/core';
import { DevOpsService } from '../../services/devops.service';

@Component({
  selector: 'app-devops-dashboard',
  standalone: false,
  templateUrl: './devops-dashboard.component.html',
})
export class DevOpsDashboardComponent implements OnInit {
  branches: string[] = [];
  selectedBranch: string | null = null;
  commits: any[] = [];
  loading = false;
  deploying = false;

  constructor(private devOpsService: DevOpsService) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading = true;
    this.devOpsService.getBranches().subscribe({
      next: (data) => {
        this.branches = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load branches', err);
        this.loading = false;
      }
    });
  }

  selectBranch(branch: string): void {
    this.selectedBranch = branch;
    this.loadCommits(branch);
  }

  loadCommits(branch: string): void {
    this.devOpsService.getCommits(branch).subscribe(data => {
      this.commits = data;
    });
  }

  deploy(branch: string): void {
    const imageTag = 'latest'; // Or from commit hash
    this.deploying = true;
    this.devOpsService.deploy(branch, imageTag).subscribe({
      next: () => {
        this.deploying = false;
        alert('Deployment started for ' + branch);
      },
      error: (err) => {
        this.deploying = false;
        alert('Deployment failed: ' + err.message);
      }
    });
  }

  deleteBranch(branch: string): void {
    if (confirm(`Are you sure you want to undeploy and delete preview for branch ${branch}?`)) {
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
