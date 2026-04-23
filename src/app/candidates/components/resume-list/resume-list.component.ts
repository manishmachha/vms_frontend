import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';
import { FormsModule } from '@angular/forms';
import { BrandedResumeService } from '../../services/branded-resume.service';
import { BrandedResume } from '../../models/branded-resume.model';
import { HeaderService } from '../../../services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-resume-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './resume-list.component.html',
  styleUrls: ['./resume-list.component.css'],
})
export class ResumeListComponent implements OnInit {
  private brandedResumeService = inject(BrandedResumeService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  resumes = signal<BrandedResume[]>([]);
  searchQuery = signal('');
  statusFilter = signal('ALL');
  sortField = signal('createdAt');

  filteredResumes = computed(() => {
    let results = this.resumes();

    // Status filter
    const status = this.statusFilter();
    if (status !== 'ALL') {
      results = results.filter((r) => r.status === status);
    }

    // Search
    const q = this.searchQuery().toLowerCase();
    if (q) {
      results = results.filter(
        (r) =>
          (r.candidate?.firstName + ' ' + r.candidate?.lastName).toLowerCase().includes(q) ||
          r.candidate?.email?.toLowerCase().includes(q) ||
          r.organization?.name?.toLowerCase().includes(q),
      );
    }

    // Sort
    const sort = this.sortField();
    results = [...results].sort((a, b) => {
      if (sort === 'name') {
        return (a.candidate?.firstName ?? '').localeCompare(b.candidate?.firstName ?? '');
      }
      if (sort === 'version') {
        return b.version - a.version;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return results;
  });

  ngOnInit() {
    this.headerService.setTitle(
      'Branded Resumes',
      'AI-generated, Solventek-branded candidate resumes',
      'bi bi-file-earmark-pdf-fill',
    );
    this.loadResumes();
  }

  loadResumes() {
    this.brandedResumeService.getAll().subscribe({
      next: (data) => {
        this.resumes.set(data);
      },
      error: (err) => {
        console.error('Failed to load branded resumes', err);
      },
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
  onStatusFilter(status: string) {
    this.statusFilter.set(status);
  }
  onSort(field: string) {
    this.sortField.set(field);
  }

  downloadResume(resume: BrandedResume) {
    this.brandedResumeService.download(resume.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resume.originalFileName || 'branded-resume.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Close', { duration: 3000 }),
    });
  }

  regenerate(resume: BrandedResume) {
    if (!resume.candidate?.id) return;
    this.brandedResumeService.regenerate(resume.candidate.id).subscribe({
      next: () => {
        this.snackBar.open('Regeneration started', 'OK', { duration: 3000 });
        setTimeout(() => this.loadResumes(), 5000);
      },
      error: () => this.snackBar.open('Regeneration failed', 'Close', { duration: 3000 }),
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
