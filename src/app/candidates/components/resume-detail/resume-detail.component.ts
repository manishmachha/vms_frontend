import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';
import { BrandedResumeService } from '../../services/branded-resume.service';
import { BrandedResume } from '../../models/branded-resume.model';
import { HeaderService } from '../../../services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-resume-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resume-detail.component.html',
  styleUrls: ['./resume-detail.component.css'],
})
export class ResumeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private brandedResumeService = inject(BrandedResumeService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  resume = signal<BrandedResume | null>(null);
  versions = signal<BrandedResume[]>([]);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit() {
    this.headerService.setTitle(
      'Resume Detail',
      'Branded resume preview',
      'bi bi-file-earmark-pdf-fill',
    );
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadResume(id);
  }

  loadResume(id: string) {
    this.brandedResumeService.getById(id).subscribe({
      next: (r) => {
        this.resume.set(r);

        // Load PDF preview
        if (r.status === 'COMPLETED') {
          this.brandedResumeService.download(r.id).subscribe({
            next: (blob) => {
              const url = window.URL.createObjectURL(blob);
              this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            },
          });
        }

        // Load version history
        if (r.candidate?.id) {
          this.brandedResumeService.getForCandidate(r.candidate.id).subscribe({
            next: (versions) => this.versions.set(versions),
          });
        }
      },
      error: () => {
        this.snackBar.open('Failed to load resume', 'Close', { duration: 3000 });
      },
    });
  }

  downloadResume() {
    const r = this.resume();
    if (!r) return;
    this.brandedResumeService.download(r.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = r.originalFileName || 'branded-resume.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Close', { duration: 3000 }),
    });
  }

  regenerate() {
    const r = this.resume();
    if (!r?.candidate?.id) return;
    this.brandedResumeService.regenerate(r.candidate.id).subscribe({
      next: () => {
        this.snackBar.open('Regeneration started! Refresh in ~30s.', 'OK', { duration: 5000 });
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
