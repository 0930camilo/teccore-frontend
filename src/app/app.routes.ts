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
		loadComponent: () => import('./module/reportes/page/dashboard-page.component').then((m) => m.DashboardPageComponent)
	  },
	  {
		path: 'instituciones',
		loadComponent: () => import('./module/instituciones/page/instituciones-list-page.component').then((m) => m.InstitucionListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION] }
	  },
	  {
		path: 'docentes',
		loadComponent: () => import('./module/docentes/page/docentes-list-page.component').then((m) => m.DocenteListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION] }
	  },
	  {
		path: 'alumnos',
		loadComponent: () => import('./module/alumnos/page/alumnos-list-page.component').then((m) => m.AlumnoListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE] }
	  },
	  {
		path: 'cursos',
		loadComponent: () => import('./module/cursos/page/cursos-list-page.component').then((m) => m.CursoListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE] }
	  },
	  {
		path: 'materias',
		loadComponent: () => import('./module/materias/page/materias-list-page.component').then((m) => m.MateriaListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE] }
	  },
	  {
		path: 'notas',
		loadComponent: () => import('./module/notas/page/notas-list-page.component').then((m) => m.NotaListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE, Rol.ESTUDIANTE] }
	  },
	  {
		path: 'actividades',
		loadComponent: () => import('./module/actividades/page/actividades-list-page.component').then((m) => m.ActividadListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.DOCENTE, Rol.ESTUDIANTE] }
	  },
	  {
		path: 'pagos',
		loadComponent: () => import('./module/pagos/page/pagos-list-page.component').then((m) => m.PagoListPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.AUXILIAR_CONTABLE] }
	  },
	  {
		path: 'reportes',
		loadComponent: () => import('./module/reportes/page/dashboard-page.component').then((m) => m.DashboardPageComponent),
		canActivate: [roleGuard],
		data: { roles: [Rol.SUPER_ADMIN, Rol.ADMIN_INSTITUCION, Rol.AUXILIAR_CONTABLE] }
	  }
	]
  },
  {
	path: '**',
	redirectTo: ''
  }
];
