import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full h-full flex items-center justify-center overflow-hidden bg-gray-200 relative"
    >
      <img
        [src]="avatarUrl()"
        class="w-full h-full object-cover"
        alt="User"
        (error)="onImageError()"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        border-radius: 9999px;
        overflow: hidden;
      }
    `,
  ],
})
export class UserAvatarComponent implements OnChanges {
  @Input() user: {
    id: string | number;
    firstName: string;
    lastName: string;
  } | null = null;
  @Input() fontSizeClass = 'text-xs';

  avatarUrl = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.updateAvatarUrl();
    }
  }

  private updateAvatarUrl() {
    this.setFallbackUrl();
  }

  onImageError() {
    this.setFallbackUrl();
  }

  private setFallbackUrl() {
    if (this.user) {
      const name = `${this.user.firstName}+${this.user.lastName}`;
      this.avatarUrl.set(`https://ui-avatars.com/api/?name=${name}&background=random`);
    } else {
      // Generic fallback
      this.avatarUrl.set('https://ui-avatars.com/api/?name=User&background=random');
    }
  }
}
