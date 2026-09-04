import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label class="search">
      <span class="sr-only">{{ label }}</span>
      <input
        [formControl]="control"
        type="search"
        [placeholder]="placeholder"
        autocomplete="off"
      />
      <button type="button" class="clear" (click)="clear()" [disabled]="!control.value">
        Limpiar
      </button>
    </label>
  `,
  styles: [`
    .search {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      width: 100%;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 0.8rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
    }

    input:focus {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    .clear {
      padding: 0.8rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-weight: 600;
    }

    .clear:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Buscar...';
  @Input() label = 'Buscar registros';
  @Input() initialValue = '';
  @Output() searchChange = new EventEmitter<string>();

  readonly control = new FormControl('', { nonNullable: true });
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.control.setValue(this.initialValue, { emitEvent: false });

    this.control.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((value) => this.searchChange.emit(value.trim()));
  }

  clear(): void {
    this.control.setValue('');
    this.searchChange.emit('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

