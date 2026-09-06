import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Institucion } from '../../../module/instituciones/model/institucion.model';
import { InstitucionService } from '../../../module/instituciones/service/institucion.service';
import { Rol } from '../../../shared/enums/rol.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthApiService } from '../service/auth-api.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-card">
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>

        <label>
          <span>Nombre</span>
          <input type="text" formControlName="nombre" placeholder="Admin Sede Norte" />
        </label>
        <small class="error" *ngIf="campoInvalido('nombre')">Este campo es obligatorio.</small>

        <label>
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="admin.norte@demo.com" />
        </label>
        <small class="error" *ngIf="campoInvalido('email')">Este campo es obligatorio y debe ser un email válido.</small>

        <label>
          <span>Contraseña</span>
          <input type="password" formControlName="password" placeholder="••••••••" />
        </label>
        <small class="error" *ngIf="campoInvalido('password')">Este campo es obligatorio y debe tener al menos 6 caracteres.</small>

        <label *ngIf="showInstitutionField">
          <span>Institución</span>
          <input
            type="text"
            [value]="institutionName()"
            (input)="onInstitutionInput($event)"
            [attr.list]="loadingInstituciones() ? null : 'instituciones-list'"
            [placeholder]="loadingInstituciones() ? 'Cargando instituciones...' : 'Escribe y selecciona una institución'"
          />
          <datalist id="instituciones-list">
            <option *ngFor="let institucion of filteredInstituciones()" [value]="institucion.nombre"></option>
          </datalist>
        </label>
        <small class="error" *ngIf="showInstitutionField && campoInvalido('institucionId')">Debes seleccionar una institución.</small>
        <small class="hint" *ngIf="showInstitutionField && !loadingInstituciones() && instituciones().length === 0">No hay instituciones disponibles para asignar.</small>
        <small class="hint" *ngIf="showInstitutionField && !loadingInstituciones() && instituciones().length > 0 && institutionName().trim() && filteredInstituciones().length === 0">No se encontraron instituciones con ese nombre.</small>

        <label>
          <span>Rol</span>
          <select formControlName="rol">
            <option *ngFor="let rol of availableRoles" [value]="rol">{{ rol }}</option>
          </select>
        </label>
        <small class="error" *ngIf="campoInvalido('rol')">Seleccione un rol válido.</small>

        <small class="hint" *ngIf="isSuperAdminMode">Solo puedes registrar usuarios con rol ADMIN_INSTITUCION.</small>

        <button type="submit" [disabled]="loading() || form.invalid">
          {{ loading() ? 'Registrando...' : 'Registrar' }}
        </button>

        <p class="footer">
          ¿Ya tienes cuenta?
          <a routerLink="/login">Volver al login</a>
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
      width: min(100%, 32rem);
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

    .hint {
      color: #475569;
      margin-top: -0.35rem;
    }
  `]
})
export class RegisterPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly institucionService = inject(InstitucionService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  loading = signal(false);
  loadingInstituciones = signal(false);
  institutionName = signal('');
  instituciones = signal<Array<{ id: number; nombre: string }>>([]);
  filteredInstituciones = computed(() => {
    const query = this.institutionName().trim().toLowerCase();
    if (!query) {
      return this.instituciones();
    }

    return this.instituciones().filter((item) => item.nombre.toLowerCase().includes(query));
  });
  readonly availableRoles: Rol[] = [];

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    institucionId: this.fb.control<number | null>(null),
    rol: this.fb.control<Rol>(Rol.SUPER_ADMIN, { validators: [Validators.required], nonNullable: true })
  });

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isSuperAdminMode(): boolean {
    return this.isAuthenticated && this.authService.isSuperAdmin();
  }

  get showInstitutionField(): boolean {
    return this.isSuperAdminMode;
  }

  get pageTitle(): string {
    return this.isSuperAdminMode ? 'Crear administrador institucional' : 'Crear SUPER_ADMIN';
  }

  get pageDescription(): string {
    return this.isSuperAdminMode
      ? 'Solo el SUPER_ADMIN puede registrar administradores institucionales.'
      : 'Registro inicial del dueño global del software.';
  }

  ngOnInit(): void {
    if (this.isAuthenticated && !this.authService.isSuperAdmin()) {
      this.notificationService.error('No tienes permisos para registrar usuarios.');
      void this.router.navigateByUrl(this.authService.getDefaultRoute());
      return;
    }

    this.configureFormForContext();

    if (this.isSuperAdminMode) {
      this.loadInstitutionOptions();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const value = this.form.getRawValue();
    const request = {
      nombre: value.nombre?.trim() ?? '',
      email: value.email?.trim() ?? '',
      password: value.password ?? '',
      rol: value.rol,
      institucionId: this.showInstitutionField ? value.institucionId : undefined
    };

    this.authApi.register(request).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.notificationService.success('Usuario registrado correctamente.');
        if (this.isSuperAdminMode) {
          this.form.reset({
            nombre: '',
            email: '',
            password: '',
            institucionId: null,
            rol: Rol.ADMIN_INSTITUCION
          });
          this.institutionName.set('');
          this.form.markAsPristine();
          this.form.markAsUntouched();
          return;
        }

        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.notificationService.error('No fue posible registrar el usuario.');
      }
    });
  }

  campoInvalido(name: 'nombre' | 'email' | 'password' | 'institucionId' | 'rol'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  onInstitutionInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.institutionName.set(value);

    const selected = this.instituciones().find((item) => item.nombre.toLowerCase() === value.trim().toLowerCase());
    this.form.controls.institucionId.setValue(selected?.id ?? null);
  }

  private configureFormForContext(): void {
    this.availableRoles.splice(0, this.availableRoles.length, ...(this.isSuperAdminMode ? [Rol.ADMIN_INSTITUCION] : [Rol.SUPER_ADMIN]));

    this.form.controls.rol.setValue(this.isSuperAdminMode ? Rol.ADMIN_INSTITUCION : Rol.SUPER_ADMIN);

    if (this.isSuperAdminMode) {
      this.form.controls.institucionId.setValidators([Validators.required, Validators.min(1)]);
    } else {
      this.form.controls.institucionId.clearValidators();
      this.form.controls.institucionId.setValue(null);
    }

    this.form.controls.institucionId.updateValueAndValidity();
  }

  private loadInstitutionOptions(): void {
    this.loadingInstituciones.set(true);

    this.institucionService.listar({ page: 0, size: 200 }).pipe(
      finalize(() => this.loadingInstituciones.set(false))
    ).subscribe({
      next: (response) => {
        const records = this.extractInstituciones(response.data);
        const options = records
          .map((item) => ({ id: item.id, nombre: item.nombre?.trim() ?? '' }))
          .filter((item): item is { id: number; nombre: string } => Number.isFinite(item.id) && item.nombre.length > 0)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        this.instituciones.set(options);
        this.institutionName.set('');
      },
      error: () => {
        this.instituciones.set([]);
        this.notificationService.error('No fue posible cargar las instituciones disponibles.');
      }
    });
  }

  private extractInstituciones(data: unknown): Institucion[] {
    if (Array.isArray(data)) {
      return data as Institucion[];
    }

    const payload = data as { content?: Institucion[]; items?: Institucion[]; data?: Institucion[] } | null | undefined;
    return payload?.content ?? payload?.items ?? payload?.data ?? [];
  }
}

