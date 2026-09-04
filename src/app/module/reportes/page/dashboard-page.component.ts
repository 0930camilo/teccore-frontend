import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { ResumenInstitucionResponse } from '../model/reporte.model';
import { ReporteService } from '../service/reporte.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingComponent } from '../../../components/loading/loading.component';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, EmptyStateComponent],
  template: `
    <section class="dashboard">
      <header class="dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen institucional basado en los datos reales enviados por el backend.</p>
        </div>

        <a routerLink="/reportes" class="link">Ver reportes</a>
      </header>

      <app-loading *ngIf="loading"></app-loading>

      <app-empty-state
        *ngIf="!loading && !error && cards.length === 0"
        title="Sin datos disponibles"
        message="El backend no devolvió métricas para esta institución."
      ></app-empty-state>

      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="cards" *ngIf="!loading && !error && cards.length > 0">
        <article class="card" *ngFor="let card of cards">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .dashboard {
      display: grid;
      gap: 1rem;
    }

    .dashboard__header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
    }

    h1 {
      margin: 0;
      font-size: 1.75rem;
    }

    p {
      margin: 0.35rem 0 0;
      color: #64748b;
    }

    .link {
      padding: 0.8rem 1rem;
      border-radius: 0.85rem;
      background: #1d4ed8;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
    }

    .cards {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    }

    .card {
      padding: 1.25rem;
      border-radius: 1.1rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    }

    .card span {
      display: block;
      margin-bottom: 0.5rem;
      color: #64748b;
      text-transform: capitalize;
    }

    .card strong {
      color: #0f172a;
      font-size: 1.5rem;
    }

    .error {
      padding: 1rem;
      border-radius: 0.9rem;
      background: #fee2e2;
      color: #991b1b;
    }
  `]
})
export class DashboardPageComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;
  cards: Array<{ label: string; value: string | number | boolean | null | undefined }> = [];

  constructor() {
    this.cargar();
  }

  cargar(): void {
    const institucionId = this.authService.getInstitucionId();
    if (!institucionId) {
      this.error = 'La sesión no tiene una institución asociada.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.reporteService.obtenerResumenInstitucion(institucionId).subscribe({
      next: (response: ApiResponse<ResumenInstitucionResponse>) => {
        this.cards = Object.entries(response.data ?? {})
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([label, value]) => ({ label, value }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No fue posible cargar el dashboard.';
        this.notificationService.error(this.error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}

