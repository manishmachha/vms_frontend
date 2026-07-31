import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-access-denied-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6 relative overflow-hidden bg-white max-w-sm rounded-3xl text-center shadow-2xl">
      <!-- Background Decorations -->
      <div class="absolute -top-16 -right-16 w-32 h-32 bg-red-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
      <div class="absolute -bottom-16 -left-16 w-32 h-32 bg-rose-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style="animation-delay: 1s"></div>

      <!-- Icon -->
      <div class="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-red-100 to-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white">
        <mat-icon class="text-red-500 scale-150 drop-shadow-sm">gpp_bad</mat-icon>
      </div>

      <!-- Content -->
      <div class="relative z-10">
        <h2 class="text-2xl font-black text-gray-900 mb-2 tracking-tight">Access Denied</h2>
        <p class="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
      </div>

      <!-- Action -->
      <div class="relative z-10">
        <button mat-flat-button color="warn" class="w-full !rounded-xl !py-6 font-bold tracking-wide" (click)="close()">
          Return to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AccessDeniedDialogComponent {
  private dialogRef = inject(MatDialogRef<AccessDeniedDialogComponent>);

  close() {
    this.dialogRef.close();
  }
}
