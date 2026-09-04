import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationMessage {
  type: NotificationType;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly current = signal<NotificationMessage | null>(null);
  readonly notification = this.current.asReadonly();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(type: NotificationType, message: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.current.set({ type, message });
    this.timeoutId = setTimeout(() => this.current.set(null), 4500);
  }

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.current.set(null);
  }
}

