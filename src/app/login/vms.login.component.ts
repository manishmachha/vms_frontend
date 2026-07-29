import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { MfeNavigationService } from '../services/mfe-navigation.service';

@Component({
  selector: 'app-vms-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vms.login.component.html',
  styleUrls: ['./vms.login.component.css', '../../styles.css'],
  encapsulation: ViewEncapsulation.None,
})
export default class VMSLoginComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  private mfeNav = inject(MfeNavigationService);

  error = signal<string | null>(null);
  hidePassword = signal(true);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.maxLength(100)]],
  });

  togglePasswordVisibility(event: Event) {
    event.preventDefault();
    this.hidePassword.update((value) => !value);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.error.set(null);
      const { email, password } = this.loginForm.value;

      this.authService.login({ email: email!, password: password! }).subscribe({
        next: (response: any) => {
          const authData = response.data;
          const userRole = authData?.role;
          console.log('userRole', userRole);

          this.mfeNav.navigate('/dashboard');
        },
        error: (err: any) => {
          this.error.set('Invalid credentials. Please check your email and password.');
        },
      });
    }
  }
}
