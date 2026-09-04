import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationBannerComponent } from './components/notification-banner/notification-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationBannerComponent],
  template: `<app-notification-banner></app-notification-banner><router-outlet></router-outlet>`,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = 'TecCore';
}
