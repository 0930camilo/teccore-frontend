import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Rol } from './shared/enums/rol.enum';
import { AppShellComponent } from './components/app-shell/app-shell.component';

export const routes: Routes = [
  {
	path: 'login',
	loadComponent: () => import('./module/auth/page/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
	path: 'registro',
	loadComponent: () => import('./module/auth/page/register-page.component').then((m) => m.RegisterPageComponent)
  },
  {
	path: '',
	component: AppShellComponent,
	canActivate: [authGuard],
	canActivateChild: [authGuard],
	children: [
	  {
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard'
	  },
	  {
		path: 'dashboard',
		loadComponent: () => import('./module/reportes/page/dashboard-page.component').then((m) => m.DashboardPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_INSTITUCION, Rol.ADMIN_SEDE, Rol.DOCENTE, Rol.ESTUDIANTE, Rol.AUXILIAR_CONTABLE] }
	  },
	  {
		path: 'administradores/nuevo',
		loadComponent: () => import('./module/auth/page/register-page.component').then((m) => m.RegisterPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION] }
	  },
	  {
		path: 'usuarios',
		loadComponent: () => import('./module/usuarios/page/usuarios-list-page.component').then((m) => m.UsuariosListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN] }
	  },
	  {
		path: 'instituciones',
		loadComponent: () => import('./module/instituciones/page/instituciones-list-page.component').then((m) => m.InstitucionListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN] }
	  },
	  {
		path: 'sedes',
		loadComponent: () => import('./module/sedes/page/sedes-list-page.component').then((m) => m.SedesListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_INSTITUCION, Rol.SUPER_ADMIN] }
	  },
	  {
		path: 'programas',
		loadComponent: () => import('./module/programas/page/programas-list-page.component').then((m) => m.ProgramasListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_SEDE, Rol.DOCENTE] }
	  },
	  {
		path: 'semestres',
		loadComponent: () => import('./module/semestres/page/semestres-list-page.component').then((m) => m.SemestresListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_SEDE] }
	  },
	  {
		path: 'docentes',
		loadComponent: () => import('./module/docentes/page/docentes-list-page.component').then((m) => m.DocenteListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_INSTITUCION, Rol.ADMIN_SEDE] }
	  },
	  {
		path: 'alumnos',
		loadComponent: () => import('./module/alumnos/page/alumnos-list-page.component').then((m) => m.AlumnoListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_SEDE, Rol.DOCENTE] }
	  },
	  {
		path: 'materias',
		loadComponent: () => import('./module/materias/page/materias-list-page.component').then((m) => m.MateriaListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_INSTITUCION, Rol.ADMIN_SEDE, Rol.DOCENTE] }
	  },
	  {
		path: 'notas',
		loadComponent: () => import('./module/notas/page/notas-list-page.component').then((m) => m.NotaListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_SEDE, Rol.DOCENTE, Rol.ESTUDIANTE] }
	  },
	  {
		path: 'actividades',
		loadComponent: () => import('./module/actividades/page/actividades-list-page.component').then((m) => m.ActividadListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_SEDE, Rol.DOCENTE, Rol.ESTUDIANTE] }
	  },
	  {
		path: 'pagos',
		loadComponent: () => import('./module/pagos/page/pagos-list-page.component').then((m) => m.PagoListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_INSTITUCION, Rol.ADMIN_SEDE, Rol.AUXILIAR_CONTABLE] }
	  },
	  {
		path: 'reportes',
		loadComponent: () => import('./module/reportes/page/dashboard-page.component').then((m) => m.DashboardPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.ADMIN_INSTITUCION, Rol.ADMIN_SEDE, Rol.AUXILIAR_CONTABLE] }
	  }
	]
  },
  {
	path: '**',
	redirectTo: ''
  }
];
