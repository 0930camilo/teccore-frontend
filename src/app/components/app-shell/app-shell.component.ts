import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="shell">
      <app-sidebar [open]="menuOpen()" (close)="menuOpen.set(false)"></app-sidebar>

      <div class="shell__content">
        <app-navbar (toggleMenu)="toggleMenu()"></app-navbar>

        <main class="shell__main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
    }

    .shell__content {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr;
    }

    .shell__main {
      padding: 1rem;
    }

    @media (min-width: 1024px) {
      .shell {
        display: grid;
        grid-template-columns: 18rem 1fr;
      }

      .shell__main {
        padding: 1.5rem;
      }
    }
  `]
})
export class AppShellComponent {
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }
}


