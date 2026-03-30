import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4">
      <div class="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-2xl w-full text-center">
        <div class="w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <i class="bi bi-rocket-takeoff text-4xl text-white"></i>
        </div>
        
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Welcome to <span class="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">Solventek VMS</span>
        </h1>
        
        <p class="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          The ultimate Vendor Management System. Streamline your procurement process, manage workforce seamlessly, and accelerate your organizational growth securely.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/login" class="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
            Log In
          </a>
        </div>
      </div>

      <div class="mt-12 text-center text-sm text-gray-500">
        &copy; 2026 Solventek Technologies. All rights reserved.
      </div>
    </div>
  `
})
export class LandingComponent {}
