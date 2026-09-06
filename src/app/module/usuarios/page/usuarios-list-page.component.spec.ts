import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { AuthService } from '../../../core/services/auth.service';
import { InstitucionService } from '../../instituciones/service/institucion.service';
import { Rol } from '../../../shared/enums/rol.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { Institucion } from '../../instituciones/model/institucion.model';
import { UsuarioService } from '../service/usuario.service';
import { Usuario } from '../model/usuario.model';
import { UsuariosListPageComponent } from './usuarios-list-page.component';

describe('UsuariosListPageComponent', () => {
  let fixture: ComponentFixture<UsuariosListPageComponent>;
  let component: UsuariosListPageComponent;
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let institucionService: jasmine.SpyObj<InstitucionService>;
  let authService: jasmine.SpyObj<AuthService>;

  const usuariosResponse = {
    success: true,
    status: 200,
    message: 'Listado de usuarios',
    data: {
      content: [
        {
          id: 1,
          nombre: 'Ana Admin',
          email: 'ana.admin@test.com',
          rol: Rol.ADMIN_INSTITUCION,
          institucionId: 1,
          institucionNombre: 'Institucion Norte',
          estado: 'ACTIVO'
        }
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1
    }
  } as const;

  const institucionesResponse = {
    success: true,
    status: 200,
    message: 'Listado de instituciones',
    data: {
      content: [
        { id: 1, nombre: 'Institucion Norte' },
        { id: 2, nombre: 'Institucion Sur' }
      ],
      page: 0,
      size: 200,
      totalElements: 2,
      totalPages: 1
    }
  } as const;

  beforeEach(async () => {
    usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['listar', 'actualizar']);
    institucionService = jasmine.createSpyObj<InstitucionService>('InstitucionService', ['listar']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isSuperAdmin']);

    usuarioService.listar.and.returnValue(of(usuariosResponse as unknown as ApiResponse<PaginacionRespuesta<Usuario>>));
    usuarioService.actualizar.and.returnValue(of({
      success: true,
      status: 200,
      message: 'Usuario actualizado',
      data: {
        id: 1,
        nombre: 'Ana Admin Editada',
        email: 'ana.editada@test.com',
        rol: Rol.ADMIN_INSTITUCION,
        institucionId: 1,
        institucionNombre: 'Institucion Norte',
        estado: 'ACTIVO'
      }
    } as unknown as ApiResponse<Usuario>));
    institucionService.listar.and.returnValue(of(institucionesResponse as unknown as ApiResponse<PaginacionRespuesta<Institucion>>));
    authService.isSuperAdmin.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [CommonModule, UsuariosListPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideZonelessChangeDetection(),
        { provide: UsuarioService, useValue: usuarioService },
        { provide: InstitucionService, useValue: institucionService },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: { error: jasmine.createSpy('error'), success: jasmine.createSpy('success') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load usuarios and institutions for SUPER_ADMIN', () => {
    expect(authService.isSuperAdmin).toHaveBeenCalled();
    expect(institucionService.listar).toHaveBeenCalled();
    expect(usuarioService.listar).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
    expect(component.total).toBe(1);
  });

  it('should build filters for q, name, rol and institution', () => {
    component.onQueryChange('  ana ');
    component['nombreFilter'].set('Ana');
    component['rolFilter'].set(Rol.ADMIN_INSTITUCION);
    component['institucionNombre'].set('Institucion Norte');
    component.changePage(2);

    const lastCall = usuarioService.listar.calls.mostRecent().args[0];
    expect(lastCall).toEqual({
      q: 'ana',
      nombre: 'Ana',
      rol: Rol.ADMIN_INSTITUCION,
      institucionId: 1,
      page: 2,
      size: 10
    });
  });

  it('should block non SUPER_ADMIN access', () => {
    authService.isSuperAdmin.and.returnValue(false);
    usuarioService.listar.calls.reset();
    institucionService.listar.calls.reset();

    fixture = TestBed.createComponent(UsuariosListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toContain('No tienes permisos');
    expect(usuarioService.listar).not.toHaveBeenCalled();
    expect(institucionService.listar).not.toHaveBeenCalled();
  });

  it('should open edit modal and submit updated data', () => {
    component.openEditModal(component.items[0]);
    component.editForm.controls.nombre.setValue('Ana Admin Editada');
    component.editForm.controls.email.setValue('ana.editada@test.com');
    component.editForm.controls.rol.setValue(Rol.ADMIN_INSTITUCION);
    component.editInstitucionNombre.set('Institucion Norte');

    component.submitEdit();

    expect(usuarioService.actualizar).toHaveBeenCalledWith(1, {
      nombre: 'Ana Admin Editada',
      email: 'ana.editada@test.com',
      rol: Rol.ADMIN_INSTITUCION,
      institucionId: 1,
      estado: 'ACTIVO'
    });
  });
});



