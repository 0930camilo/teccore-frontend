import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="pagination" *ngIf="totalPages > 1" aria-label="Paginación">
      <button type="button" (click)="changePage(page - 1)" [disabled]="page === 0">
        Anterior
      </button>

      <button
        type="button"
        *ngFor="let index of pages"
        (click)="changePage(index)"
        [class.active]="index === page"
      >
        {{ index + 1 }}
      </button>

      <button type="button" (click)="changePage(page + 1)" [disabled]="page >= totalPages - 1">
        Siguiente
      </button>
    </nav>
  `,
  styles: [`
    .pagination {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    button {
      min-width: 2.75rem;
      padding: 0.6rem 0.9rem;
      border-radius: 0.75rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-weight: 600;
    }

    button.active {
      background: #1d4ed8;
      color: #fff;
      border-color: #1d4ed8;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class PaginationComponent {
  @Input() page = 0;
  @Input() size = 10;
  @Input() total = 0;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.size));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index);
  }

  changePage(nextPage: number): void {
    if (nextPage < 0 || nextPage > this.totalPages - 1 || nextPage === this.page) {
      return;
    }

    this.pageChange.emit(nextPage);
  }
}

