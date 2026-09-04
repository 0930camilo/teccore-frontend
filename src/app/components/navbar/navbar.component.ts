import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar">
      <button type="button" class="menu-button" (click)="toggleMenu.emit()" aria-label="Abrir menú">
        ☰
      </button>

      <div class="brand">
        <strong>TecCore</strong>
        <span>Sistema de gestión académica</span>
      </div>

      <div class="profile" *ngIf="email() as userEmail">
        <div>
          <p>{{ userEmail }}</p>
          <small>{{ rol() || 'Sin rol' }}</small>
        </div>
        <button type="button" class="logout" (click)="logout()">Cerrar sesión</button>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
    }

    .menu-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 1.15rem;
    }

    .brand {
      flex: 1;
      display: grid;
      gap: 0.1rem;
      color: #0f172a;
    }

    .brand span,
    .profile small {
      color: #64748b;
    }

    .profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .profile p {
      margin: 0;
      font-weight: 700;
      color: #0f172a;
    }

    .logout {
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      border: 0;
      background: #1d4ed8;
      color: #fff;
      font-weight: 700;
    }

    @media (min-width: 1024px) {
      .menu-button {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  @Output() toggleMenu = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  readonly email = computed(() => this.authService.getEmail());
  readonly rol = computed(() => this.authService.getRol());

  logout(): void {
    this.authService.logout();
  }
}


