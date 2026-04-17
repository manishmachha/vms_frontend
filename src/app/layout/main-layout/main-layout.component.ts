import { Component, signal, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css', '../../../styles.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
}
