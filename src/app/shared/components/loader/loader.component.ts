import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingService.isLoading()" class="loader-overlay">
      <div class="loader-container">
        <div class="spinner"></div>
        <div class="loader-text">Loading...</div>
      </div>
    </div>
  `,
  styleUrls: ['./loader.component.css'],
})
export class LoaderComponent {
  public loadingService = inject(LoadingService);
}
