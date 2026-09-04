import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <p>{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading {
      display: grid;
      gap: 0.75rem;
      place-items: center;
      padding: 2rem;
      color: #475569;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      border: 3px solid #cbd5e1;
      border-top-color: #2563eb;
      animation: spin 0.9s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingComponent {
  @Input() message = 'Cargando información...';
}

