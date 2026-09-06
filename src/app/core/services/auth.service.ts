import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from '../../module/auth/service/auth-api.service';
import { AuthResponse } from '../../shared/interface/auth-response.interface';
import { SessionUsuario } from '../../shared/interface/session.interface';
import { Rol } from '../../shared/enums/rol.enum';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionState = signal<SessionUsuario | null>(this.storage.readSession());

  readonly session = this.sessionState.asReadonly();
  readonly authenticated = computed(() => Boolean(this.sessionState()?.token));

  login(email: string, password: string): Observable<AuthResponse> {
    return this.authApi.login({ email, password }).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  logout(): void {
    this.storage.clearSession();
    this.sessionState.set(null);

    if (isPlatformBrowser(this.platformId)) {
      void this.router.navigateByUrl('/login');
    }
  }

  getToken(): string | null {
    return this.sessionState()?.token ?? null;
  }

  getEmail(): string | null {
    return this.sessionState()?.email ?? null;
  }

  getRol(): string | null {
    return this.sessionState()?.rol ?? null;
  }

  getInstitucionId(): number | null {
    return this.sessionState()?.institucionId ?? null;
  }

  isAuthenticated(): boolean {
    return Boolean(this.sessionState()?.token);
  }

  isSuperAdmin(): boolean {
    return this.getRol() === Rol.SUPER_ADMIN;
  }

  isAdminInstitucion(): boolean {
    return this.getRol() === Rol.ADMIN_INSTITUCION;
  }

  canManageInstitutions(): boolean {
    return this.isSuperAdmin();
  }

  canCreateInstitutionAdmins(): boolean {
    return this.isSuperAdmin();
  }

  canAccessAcademicModules(): boolean {
    return this.isAdminInstitucion();
  }

  getDefaultRoute(): string {
    if (this.isSuperAdmin()) {
      return '/instituciones';
    }

    return '/dashboard';
  }

  hasRole(roles: string[]): boolean {
    const currentRole = this.getRol();
    return Boolean(currentRole && roles.includes(currentRole));
  }

  private saveSession(response: AuthResponse): void {
    const session: SessionUsuario = {
      token: response.token,
      tipo: response.tipo,
      email: response.email,
      rol: response.rol as Rol,
      institucionId: response.institucionId
    };

    this.storage.saveSession(session);
    this.sessionState.set(session);
  }
}

