import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../services/organization.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-vendor-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './vendor-create.component.html',
  styleUrl: './vendor-create.component.css'
})
export class VendorCreateComponent {
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  vendorForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
    website: ['']
  });

  loading = false;

  onSubmit() {
    if (this.vendorForm.invalid) return;

    this.loading = true;
    const vendorData = { ...this.vendorForm.value, orgType: 'VENDOR' };

    this.organizationService.createOrganization(vendorData).subscribe({
      next: (vendor) => {
        this.loading = false;
        this.snackBar.open('Vendor created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/vendors']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Error creating vendor', 'Close', { duration: 3000 });
      }
    });
  }
}
