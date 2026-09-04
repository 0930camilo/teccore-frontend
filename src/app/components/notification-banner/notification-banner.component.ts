import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification" *ngIf="notification() as current" [ngClass]="current.type" role="alert" aria-live="assertive">
      <span>{{ current.message }}</span>
      <button type="button" (click)="close()" aria-label="Cerrar notificación">×</button>
    </div>
  `,
  styles: [`
    .notification {
      position: fixed;
      top: 1rem;
      right: 1rem;
      left: 1rem;
      z-index: 60;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.1rem;
      border-radius: 1rem;
      color: #0f172a;
      box-shadow: 0 16px 30px rgba(15, 23, 42, 0.14);
      border: 1px solid transparent;
    }

    .success { background: #dcfce7; border-color: #86efac; }
    .error { background: #fee2e2; border-color: #fca5a5; }
    .info { background: #dbeafe; border-color: #93c5fd; }
    .warning { background: #fef3c7; border-color: #fcd34d; }

    button {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 1.2rem;
      line-height: 1;
    }
  `]
})
export class NotificationBannerComponent {
  private readonly notificationService = inject(NotificationService);
  readonly notification = this.notificationService.notification;

  close(): void {
    this.notificationService.clear();
  }
}


