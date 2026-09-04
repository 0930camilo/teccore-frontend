import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Rol } from '../../shared/enums/rol.enum';

interface MenuItem {
  label: string;
  route: string;
  roles: Rol[];
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', route: '/dashboard', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE, Rol.ESTUDIANTE, Rol.AUXILIAR_CONTABLE] },
  { label: 'Instituciones', route: '/instituciones', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION] },
  { label: 'Docentes', route: '/docentes', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION] },
  { label: 'Alumnos', route: '/alumnos', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE] },
  { label: 'Cursos', route: '/cursos', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE] },
  { label: 'Materias', route: '/materias', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE] },
  { label: 'Notas', route: '/notas', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE, Rol.ESTUDIANTE] },
  { label: 'Actividades', route: '/actividades', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE, Rol.ESTUDIANTE] },
  { label: 'Pagos', route: '/pagos', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.AUXILIAR_CONTABLE] },
  { label: 'Reportes', route: '/reportes', roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.AUXILIAR_CONTABLE] }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.open]="open">
      <div class="sidebar__header">
        <strong>Menú</strong>
        <button type="button" class="close" (click)="close.emit()" aria-label="Cerrar menú">×</button>
      </div>

      <nav>
        <a
          *ngFor="let item of visibleMenu()"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          (click)="close.emit()"
        >
          {{ item.label }}
        </a>
      </nav>
    </aside>

    <button type="button" class="overlay" *ngIf="open" (click)="close.emit()" aria-label="Cerrar menú lateral"></button>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      width: min(18rem, 86vw);
      padding: 1rem;
      background: #0f172a;
      color: #fff;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      z-index: 40;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .sidebar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .close {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 1.5rem;
    }

    nav {
      display: grid;
      gap: 0.45rem;
    }

    a {
      padding: 0.85rem 1rem;
      border-radius: 0.85rem;
      color: #cbd5e1;
      text-decoration: none;
    }

    a.active,
    a:hover {
      background: rgba(59, 130, 246, 0.18);
      color: #fff;
    }

    .overlay {
      position: fixed;
      inset: 0;
      z-index: 35;
      border: 0;
      background: rgba(15, 23, 42, 0.45);
    }

    @media (min-width: 1024px) {
      .sidebar {
        position: sticky;
        transform: none;
        width: 18rem;
        min-height: 100vh;
        border-right: 1px solid #1e293b;
      }

      .close,
      .overlay {
        display: none;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly visibleMenu = computed(() => {
    const role = this.authService.getRol() as Rol | null;
    return MENU_ITEMS.filter((item) => Boolean(role && item.roles.includes(role)));
  });

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.close.emit());
  }
}

