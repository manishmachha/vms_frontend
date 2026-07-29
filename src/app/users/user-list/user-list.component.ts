import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/auth.model';
import { HeaderService } from '../../services/header.service';
import { AuthStore } from '../../services/auth.store';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { NotificationDotComponent } from '../../shared/components/notification-dot/notification-dot.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatSnackBarModule,
    OrganizationLogoComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NotificationDotComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);
  public authStore = inject(AuthStore);
  private mfeNav = inject(MfeNavigationService);
  private notificationService = inject(NotificationService);

  viewMode = signal<'table' | 'grid'>('grid');
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['user', 'contact', 'role', 'organization', 'status', 'actions'];

  totalElements = signal(0);
  users = signal<User[]>([]);
  activeUsersCount = computed(() => this.users().filter((u) => u.status).length);
  pageSize = signal(10);
  pageIndex = signal(0);
  sortField = signal('');
  sortOrder = signal('');

  searchQuery = signal('');
  statusFilter = signal('');
  roleFilter = signal('');
  availableRoles = signal<string[]>([
    'SUPER_ADMIN',
    'MANAGER',
    'TALENT_ACQUISITION',
    'VENDOR',
    'EMPLOYEE',
    'CLIENT',
  ]);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  ngOnInit() {
    this.headerService.setTitle(
      'User Management',
      'Manage system users and their roles',
      'bi bi-person-badge-fill',
    );
    this.loadUsers();
  }

  loadUsers() {
    let sortStr: string | undefined = undefined;
    if (this.sortField() && this.sortOrder()) {
      sortStr = `${this.sortField()},${this.sortOrder()}`;
    }
    this.userService
      .getUsers(
        this.pageIndex(),
        this.pageSize(),
        this.searchQuery(),
        this.roleFilter(),
        this.statusFilter(),
        sortStr,
      )
      .subscribe({
        next: (pageData) => {
          this.users.set(pageData.content || []);
          this.dataSource.data = pageData.content;
          this.totalElements.set(pageData.totalElements);
        },
        error: (err) => {
          console.error('Failed to load users', err);
          this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
        },
      });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onFilterChange() {
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onSortChange(event: Sort) {
    if (!event.active || !event.direction) {
      this.sortField.set('');
      this.sortOrder.set('');
    } else {
      this.sortField.set(event.active);
      this.sortOrder.set(event.direction);
    }
    this.pageIndex.set(0);
    this.loadUsers();
  }

  deleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to delete user', err);
        this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
      },
    });
  }

  formatRole(role: string | undefined): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  onCardClick(userId: string | number) {
    this.notificationService.markEntityAsRead('USER', userId);
  }
}
