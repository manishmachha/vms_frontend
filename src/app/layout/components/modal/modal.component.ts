import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" (click)="close.emit()"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 p-6">
        <div class="flex items-center justify-between mb-4" *ngIf="title">
          <h2 class="text-xl font-bold text-gray-900">{{ title }}</h2>
          <button (click)="close.emit()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <i class="bi bi-x-lg text-gray-500"></i>
          </button>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}
