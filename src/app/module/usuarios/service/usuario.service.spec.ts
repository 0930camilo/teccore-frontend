import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuarioService, provideHttpClient(), provideHttpClientTesting(), provideZonelessChangeDetection()]
    });

    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should build the users list request with filters and pagination', () => {
    service.listar({
      q: 'ana',
      rol: 'ADMIN_INSTITUCION',
      nombre: 'Ana',
      institucionId: 1,
      page: 2,
      size: 10
    }).subscribe();

    const req = httpMock.expectOne((request) => request.url === environment.usersApi);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('ana');
    expect(req.request.params.get('rol')).toBe('ADMIN_INSTITUCION');
    expect(req.request.params.get('nombre')).toBe('Ana');
    expect(req.request.params.get('institucionId')).toBe('1');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');

    req.flush({
      success: true,
      status: 200,
      message: 'Listado de usuarios',
      data: { content: [], page: 2, size: 10, totalElements: 0, totalPages: 0 }
    });
  });

  it('should send PUT request to update a user', () => {
    service.actualizar(5, {
      nombre: 'Ana Admin Editada',
      email: 'ana.editada@test.com',
      rol: 'ADMIN_INSTITUCION',
      institucionId: 2,
      estado: EstadoRegistro.ACTIVO
    }).subscribe();

    const req = httpMock.expectOne((request) => request.url === `${environment.usersApi}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      nombre: 'Ana Admin Editada',
      email: 'ana.editada@test.com',
      rol: 'ADMIN_INSTITUCION',
      institucionId: 2,
      estado: EstadoRegistro.ACTIVO
    });

    req.flush({
      success: true,
      status: 200,
      message: 'Usuario actualizado',
      data: {
        id: 5,
        nombre: 'Ana Admin Editada',
        email: 'ana.editada@test.com',
        rol: 'ADMIN_INSTITUCION',
        institucionId: 2,
        institucionNombre: 'Institucion Norte',
        estado: EstadoRegistro.ACTIVO
      }
    });
  });
});

