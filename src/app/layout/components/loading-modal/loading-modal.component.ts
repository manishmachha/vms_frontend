import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm">
        <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p class="text-gray-700 font-medium text-center">{{ message || 'Processing...' }}</p>
      </div>
    </div>
  `,
})
export class LoadingModalComponent {
  @Input() isOpen = false;
  @Input() message = 'Processing...';
}
