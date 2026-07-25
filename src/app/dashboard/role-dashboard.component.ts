import { Component, inject, OnInit, ViewContainerRef, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { VendorDashboardComponent } from './vendor-dashboard/vendor-dashboard.component';
import { AuthStore } from '../services/auth.store';
import { SuperAdminDashboardComponent } from './super-admin-dashboard/super-admin-dashboard.component';

@Component({
  selector: 'app-role-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-dashboard.component.html',
  styleUrls: ['./role-dashboard.component.css'],
})
export class RoleDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  vcr = inject(ViewContainerRef);

  ngOnInit() {
    this.loadDashboardComponent();
  }

  private loadDashboardComponent() {
    const role = this.authStore.userRole();
    let component: Type<any>;

    switch (role) {
      case 'SUPER_ADMIN':
        component = SuperAdminDashboardComponent;
        break;
      case 'MANAGER':
      case 'TALENT_ACQUISITION':
        component = ManagerDashboardComponent;
        break;
      case 'VENDOR':
        component = VendorDashboardComponent;
        break;
      default:
        component = VendorDashboardComponent;
        break;
    }

    this.vcr.clear();
    this.vcr.createComponent(component);
  }
}
