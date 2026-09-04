import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-card">
        <h1>Iniciar sesión</h1>
        <p>Accede al sistema académico con tus credenciales.</p>

        <label>
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="admin@demo.com" />
        </label>
        <small class="error" *ngIf="campoInvalido('email')">Este campo es obligatorio y debe ser un email válido.</small>

        <label>
          <span>Contraseña</span>
          <input type="password" formControlName="password" placeholder="••••••••" />
        </label>
        <small class="error" *ngIf="campoInvalido('password')">Este campo es obligatorio y debe tener al menos 6 caracteres.</small>

        <button type="submit" [disabled]="loading() || form.invalid">
          {{ loading() ? 'Ingresando...' : 'Ingresar' }}
        </button>

        <p class="footer">
          ¿No tienes acceso?
          <a routerLink="/registro">Crear usuario</a>
        </p>
      </form>
    </section>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #e2e8f0 100%);
    }

    .auth-card {
      width: min(100%, 28rem);
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 1.25rem;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid #e2e8f0;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
    }

    h1 {
      margin: 0;
      font-size: 1.8rem;
    }

    p {
      margin: 0;
      color: #64748b;
    }

    label {
      display: grid;
      gap: 0.35rem;
      color: #0f172a;
      font-weight: 600;
    }

    input,
    select {
      padding: 0.85rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      background: #fff;
    }

    button {
      padding: 0.9rem 1rem;
      border-radius: 0.85rem;
      border: 0;
      background: #1d4ed8;
      color: #fff;
      font-weight: 700;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .error {
      color: #b91c1c;
      margin-top: -0.35rem;
    }

    .footer {
      text-align: center;
    }
  `]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.notificationService.success('Sesión iniciada correctamente.');
        void this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.notificationService.error('No fue posible iniciar sesión.');
      }
    });
  }

  campoInvalido(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }
}

