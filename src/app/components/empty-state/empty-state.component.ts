import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state" role="status">
      <p class="title">{{ title }}</p>
      <p class="description">{{ message }}</p>
    </div>
  `,
  styles: [`
    .empty-state {
      padding: 2rem;
      text-align: center;
      border-radius: 1rem;
      border: 1px dashed #cbd5e1;
      background: #f8fafc;
      color: #475569;
    }

    .title {
      margin: 0 0 0.35rem;
      font-weight: 700;
      color: #0f172a;
    }

    .description {
      margin: 0;
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'No hay registros disponibles.';
  @Input() message = 'Intenta ajustar la búsqueda o crea un nuevo registro si corresponde.';
}

