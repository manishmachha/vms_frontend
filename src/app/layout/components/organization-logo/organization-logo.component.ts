import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organization-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass()" [title]="orgName()">
      <div
        class="h-full w-full flex items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold tracking-wider select-none shadow-sm"
        [ngClass]="textSize()"
      >
        {{ initials() }}
      </div>
    </div>
  `,
  styles: [],
})
export class OrganizationLogoComponent implements OnChanges {
  @Input() org?: { name?: string } | null;
  @Input() name?: string;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom' = 'md';
  @Input() rounded: boolean = true;

  initials = signal('');
  orgName = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    const name = this.org?.name || this.name || 'Organization';
    this.orgName.set(name);
    this.initials.set(this.getInitials(name));
  }

  containerClass() {
    const sizeClasses = {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-16 w-16',
      xl: 'h-24 w-24',
      '2xl': 'h-32 w-32',
      custom: 'h-full w-full',
    };

    return `${sizeClasses[this.size]} shrink-0 relative`;
  }

  textSize() {
    const textSizes = {
      xs: 'text-[10px]',
      sm: 'text-xs',
      md: 'text-base',
      lg: 'text-xl',
      xl: 'text-2xl',
      '2xl': 'text-4xl',
      custom: 'text-base',
    };
    return textSizes[this.size];
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .filter(n => n.length > 0)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
