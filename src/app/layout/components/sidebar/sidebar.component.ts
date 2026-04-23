import {
  Component,
  inject,
  Output,
  EventEmitter,
  OnInit,
  signal,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OrganizationLogoComponent } from '../organization-logo/organization-logo.component';
import { NotificationCounts, NotificationService } from '../../../services/notification.service';
import { AuthStore } from '../../../services/auth.store';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'MANAGER'
  | 'TALENT_ACQUISITION'
  | 'EMPLOYEE'
  | 'VENDOR';
export type OrganizationType = 'SOLVENTEK' | 'VENDOR';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  roles: UserRole[];
  orgTypes: OrganizationType[];
  notificationCategory?: string;
}

interface MenuSection {
  title: string;
  icon?: string;
  items: MenuItem[];
  collapsed?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, OrganizationLogoComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @Output() menuItemClick = new EventEmitter<void>();
  authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private mfeNav = inject(MfeNavigationService);

  notificationCounts = signal<NotificationCounts | null>(null);

  // State for visible sections
  visibleSections = signal<MenuSection[]>([]);

  // Base config - Updated for Solventek + Vendor only
  private readonly menuSectionsConfig: MenuSection[] = [
    {
      title: 'Dashboard',
      icon: 'bi bi-grid',
      items: [
        {
          label: 'Overview',
          route: '/dashboard',
          icon: 'bi bi-speedometer2',
          roles: ['SUPER_ADMIN', 'MANAGER',  'TALENT_ACQUISITION', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
        {
          label: 'Users',
          route: '/users/',
          icon: 'bi bi-building',
          roles: ['SUPER_ADMIN', 'MANAGER'],
          orgTypes: ['SOLVENTEK'],
        },
      ],
    },
    {
      title: 'Administration',
      icon: 'bi bi-shield-lock',
      items: [
        {
          label: 'Vendors',
          route: '/vendors',
          icon: 'bi bi-shop',
          roles: ['SUPER_ADMIN', 'MANAGER'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'ORGANIZATION',
        }
      ],
    },
    {
      title: 'Recruitment',
      icon: 'bi bi-briefcase',
      items: [
        {
          label: 'Jobs',
          route: '/jobs',
          icon: 'bi bi-briefcase-fill',
          roles: ['SUPER_ADMIN', 'MANAGER',  'TALENT_ACQUISITION', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
          notificationCategory: 'JOB',
        },
        {
          label: 'Candidates',
          route: '/candidates',
          icon: 'bi bi-person-badge',
          roles: ['SUPER_ADMIN', 'MANAGER',  'TALENT_ACQUISITION', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
        {
          label: 'Applications',
          route: '/applications',
          icon: 'bi bi-file-earmark-text',
          roles: ['SUPER_ADMIN', 'MANAGER',  'TALENT_ACQUISITION'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'APPLICATION',
        },
        {
          label: 'Interviews',
          route: '/interviews',
          icon: 'bi bi-calendar-event',
          roles: ['SUPER_ADMIN', 'MANAGER',  'TALENT_ACQUISITION', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
        {
          label: 'Track Applications',
          route: '/track-applications',
          icon: 'bi bi-list-check',
          roles: ['VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
          notificationCategory: 'TRACKING',
        },
      ],
    },
    {
      title: 'Workforce',
      icon: 'bi bi-people',
      items: [
        {
          label: 'Clients',
          route: '/clients',
          icon: 'bi bi-briefcase',
          roles: ['SUPER_ADMIN', 'MANAGER',  'TALENT_ACQUISITION'],
          orgTypes: ['SOLVENTEK'],
        },
        {
          label: 'Projects',
          route: '/projects',
          icon: 'bi bi-kanban',
          roles: ['SUPER_ADMIN', 'MANAGER',  'TALENT_ACQUISITION'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'PROJECT',
        },
      ],
    },
  ];

  constructor() {
    // Recompute visible sections whenever user/role changes
    effect(() => {
      const role = this.authStore.userRole();
      const user = this.authStore.user();
      if (role && user) {
        this.calculateVisibleSections(
          role as UserRole,
          (this.authStore.orgType() || 'SOLVENTEK') as OrganizationType,
        );
      }
    });
  }

  ngOnInit() {
    // Service handles centralized polling
  }

  getNotificationCount(item: MenuItem): number {
    const counts = this.notificationService.notificationCounts();
    if (!counts || !item.notificationCategory) return 0;
    return (counts as any)[item.notificationCategory] || 0;
  }

  getSectionNotificationCount(section: MenuSection): number {
    return section.items.reduce((total, item) => total + this.getNotificationCount(item), 0);
  }

  toggleSection(targetSection: MenuSection) {
    this.visibleSections.update((sections) => {
      return sections.map((s) => {
        if (s === targetSection) {
          return { ...s, collapsed: !s.collapsed };
        }
        return s;
      });
    });
  }

  calculateVisibleSections(userRole: UserRole, userOrgType: OrganizationType) {
    const filtered = this.menuSectionsConfig
      .map((section) => {
        // Filter items according to role/org
        const validItems = section.items.filter((item) => {
          const roleMatch = item.roles.includes(userRole);
          const orgMatch = item.orgTypes.includes(userOrgType);
          return roleMatch && orgMatch;
        });

        return {
          ...section,
          items: validItems,
          collapsed: false,
        };
      })
      .filter((section) => section.items.length > 0);

    this.visibleSections.set(filtered);
  }

  isExactRoute(route: string): boolean {
    return ['/dashboard', '/admin'].includes(route);
  }

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  getOrgName(): string {
    const orgType = this.authStore.orgType();
    if (orgType === 'SOLVENTEK') return 'VMS';
    if (orgType === 'VENDOR') return 'Vendor Portal';
    return 'VMS';
  }

  getPortalType(): string {
    const orgType = this.authStore.orgType();
    if (orgType === 'SOLVENTEK') return 'Solventek VMS';
    if (orgType === 'VENDOR') return 'Vendor Portal';
    return 'VMS';
  }

  getOrgGradient(): string {
    const orgType = this.authStore.orgType();
    if (orgType === 'VENDOR') return 'bg-linear-to-br from-emerald-500 to-teal-600';
    return 'bg-linear-to-br from-indigo-500 to-purple-600';
  }

  getOrgTextGradient(): string {
    const orgType = this.authStore.orgType();
    if (orgType === 'VENDOR') return 'bg-linear-to-r from-emerald-600 to-teal-600';
    return 'bg-linear-to-r from-indigo-600 to-purple-600';
  }

  getOrgFooterBg(): string {
    const orgType = this.authStore.orgType();
    if (orgType === 'VENDOR') return 'bg-linear-to-r from-emerald-50 to-teal-50';
    return 'bg-linear-to-r from-indigo-50 to-purple-50';
  }

  getRoleBadgeClass(): string {
    const role = this.authStore.userRole();
    if (role === 'SUPER_ADMIN') return 'badge-danger';
    if (role === 'MANAGER') return 'badge-warning';
    if (role === 'ADMIN') return 'badge-primary';
    if (role === 'TALENT_ACQUISITION') return 'badge-info';
    if (role === 'VENDOR') return 'badge-success';
    return 'badge-primary';
  }

  formatRole(role: string | undefined | null): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  onMenuClick() {
    this.menuItemClick.emit();
  }
}
