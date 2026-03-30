import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Organization, Vendor } from '../../models/organization.model';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css'
})
export class UserCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private orgService = inject(OrganizationService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  userId = signal<number | null>(null);

  userForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    type: ['SOLVENTEK', [Validators.required]],
    role: ['', [Validators.required]],
    organizationId: [null, [Validators.required]]
  });

  vendors: Vendor[] = [];
  organizations: Organization[] = [];
  loading = false;

  solventekRoles = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'TALENT_ACQUISITION', label: 'Talent Acquisition' },
    { value: 'EMPLOYEE', label: 'Employee' }
  ];

  ngOnInit() {
    this.loadInitialData();
    this.setupTypeListener();
    this.checkEditMode();
  }

  checkEditMode() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.userId.set(+params['id']);
        this.loadUserForEdit(+params['id']);
      }
    });
  }

  loadUserForEdit(id: number) {
    this.loading = true;
    this.userService.getUser(id).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          type: user.type,
          role: user.role,
          organizationId: user.organizationId || user.orgId
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading user:', err);
        this.snackBar.open('Error loading user data', 'Close', { duration: 3000 });
      }
    });
  }

  loadInitialData() {
    this.orgService.getAllOrganizations().subscribe(orgs => {
      this.organizations = orgs;
      this.vendors = orgs.filter(o => o.orgType === 'VENDOR');
    });
  }

  setupTypeListener() {
    this.userForm.get('type')?.valueChanges.subscribe(type => {
      const roleControl = this.userForm.get('role');
      
      if (type === 'VENDOR') {
        roleControl?.setValue('VENDOR');
        roleControl?.disable();
      } else {
        roleControl?.enable();
        roleControl?.setValue('');
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.loading = true;
    const userData = this.userForm.getRawValue();
    
    const request = this.isEditMode() 
      ? this.userService.updateUser(this.userId()!, userData)
      : this.userService.createUser(userData);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open(`User ${this.isEditMode() ? 'updated' : 'created'} successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/organization/users']);
      },
      error: (err) => {
        this.loading = false;
        console.error(`Error ${this.isEditMode() ? 'updating' : 'creating'} user:`, err);
        this.snackBar.open(`Error ${this.isEditMode() ? 'updating' : 'creating'} user`, 'Close', { duration: 3000 });
      }
    });
  }
}
