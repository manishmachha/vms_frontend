import { Component, OnInit, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatSnackBarModule, OrganizationLogoComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);
  public authStore = inject(AuthStore);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  searchQuery = signal('');

  ngOnInit() {
    this.headerService.setTitle(
      'User Management',
      'Manage system users and their roles',
      'bi bi-person-badge-fill'
    );
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.filterUsers();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
      }
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.filterUsers();
  }

  filterUsers() {
    const q = this.searchQuery().toLowerCase();
    this.filteredUsers.set(
      this.users().filter(
        (u) =>
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
      )
    );
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
      }
    });
  }

  formatRole(role: string | undefined): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
