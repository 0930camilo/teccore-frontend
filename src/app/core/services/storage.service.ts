import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SessionUsuario } from '../../shared/interface/session.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionKey = 'tec_session';

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  readSession(): SessionUsuario | null {
    if (!this.isBrowser()) {
      return null;
    }

    const raw = localStorage.getItem(this.sessionKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionUsuario;
    } catch {
      this.clearSession();
      return null;
    }
  }

  saveSession(session: SessionUsuario): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  clearSession(): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem(this.sessionKey);
  }
}

