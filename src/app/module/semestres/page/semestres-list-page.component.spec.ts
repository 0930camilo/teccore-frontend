import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiResponse } from '../../../shared/interface/api-response.interface';
import { PaginacionRespuesta } from '../../../shared/interface/pagination.interface';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Programa } from '../../programas/model/programa.model';
import { ProgramaService } from '../../programas/service/programa.service';
import { Semestre } from '../model/semestre.model';
import { SemestreService } from '../service/semestre.service';
import { SemestresListPageComponent } from './semestres-list-page.component';

describe('SemestresListPageComponent', () => {
  let fixture: ComponentFixture<SemestresListPageComponent>;
  let component: SemestresListPageComponent;
  let semestreService: jasmine.SpyObj<SemestreService>;
  let programaService: jasmine.SpyObj<ProgramaService>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const semestresResponse: ApiResponse<PaginacionRespuesta<Semestre>> = {
    success: true,
    status: 200,
    message: 'Listado de semestres',
    data: {
      content: [
        {
          id: 1,
          nombre: '2026-1',
          numero: 1,
          anio: 2026,
          programaId: 10,
          institucionId: 1,
          sedeId: 2
        }
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1
    }
  };

  const programasResponse: ApiResponse<PaginacionRespuesta<Programa>> = {
    success: true,
    status: 200,
    message: 'Listado de programas',
    data: {
      content: [
        { id: 10, nombre: 'Ingeniería de Sistemas' },
        { id: 20, nombre: 'Administración' }
      ],
      page: 0,
      size: 200,
      totalElements: 2,
      totalPages: 1
    }
  };

  beforeEach(async () => {
    semestreService = jasmine.createSpyObj<SemestreService>('SemestreService', ['listar', 'crear', 'actualizar']);
    programaService = jasmine.createSpyObj<ProgramaService>('ProgramaService', ['listar']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAdminSede',
      'isSuperAdmin',
      'isAdminInstitucion',
      'getInstitucionId',
      'getSedeId'
    ]);
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['error', 'success']);

    semestreService.listar.and.returnValue(of(semestresResponse));
    semestreService.crear.and.returnValue(
      of({ success: true, status: 201, message: 'Creado', data: { id: 2, nombre: '2026-2' } })
    );
    semestreService.actualizar.and.returnValue(
      of({ success: true, status: 200, message: 'Actualizado', data: { id: 1, nombre: '2026-1 Actualizado' } })
    );

    programaService.listar.and.returnValue(of(programasResponse));

    authService.isAdminSede.and.returnValue(true);
    authService.isSuperAdmin.and.returnValue(false);
    authService.isAdminInstitucion.and.returnValue(false);
    authService.getInstitucionId.and.returnValue(1);
    authService.getSedeId.and.returnValue(2);

    await TestBed.configureTestingModule({
      imports: [CommonModule, SemestresListPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideZonelessChangeDetection(),
        { provide: SemestreService, useValue: semestreService },
        { provide: ProgramaService, useValue: programaService },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SemestresListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and load semestres and programas', () => {
    expect(component).toBeTruthy();
    expect(programaService.listar).toHaveBeenCalled();
    expect(semestreService.listar).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
    expect(component.programaOptions.length).toBe(2);
    expect(component.getProgramaNombre(10)).toBe('Ingeniería de Sistemas');
    expect(component.getProgramaNombre({ id: 1, nombre: '2026-1', programaNombre: 'Medicina' })).toBe('Medicina');
    expect(component.getProgramaNombre({ id: 1, nombre: '2026-1', programa: { id: 30, nombre: 'Derecho' } })).toBe('Derecho');
    expect(component.getProgramaNombre({ id: 1, nombre: '2026-1', programaId: 20 })).toBe('Administración');
    expect(component.getProgramaNombre(null)).toBe('—');
  });

  it('should open create modal and reset form', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.semestreForm.get('nombre')?.value).toBe('');
    expect(component.semestreForm.get('anio')?.value).toBe(new Date().getFullYear());
  });

  it('should submit new semestre when create form is valid', () => {
    component.openCreateModal();
    component.semestreForm.setValue({
      nombre: '2026-2',
      numero: 2,
      anio: 2026,
      programaId: 10
    });

    component.submit();

    expect(semestreService.crear).toHaveBeenCalledWith({
      nombre: '2026-2',
      numero: 2,
      anio: 2026,
      programaId: 10,
      institucionId: 1,
      sedeId: 2
    });
    expect(notificationService.success).toHaveBeenCalledWith('Semestre creado correctamente.');
    expect(component.showModal).toBeFalse();
  });

  it('should open edit modal with loaded item data', () => {
    const item = component.items[0];
    component.openEditModal(item);

    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.editingId).toBe(1);
    expect(component.semestreForm.get('nombre')?.value).toBe('2026-1');
    expect(component.semestreForm.get('numero')?.value).toBe(1);
    expect(component.semestreForm.get('anio')?.value).toBe(2026);
    expect(component.semestreForm.get('programaId')?.value).toBe(10);
  });

  it('should submit updated semestre when edit form is submitted', () => {
    const item = component.items[0];
    component.openEditModal(item);

    component.semestreForm.setValue({
      nombre: '2026-1 Modificado',
      numero: 1,
      anio: 2026,
      programaId: 20
    });

    component.submit();

    expect(semestreService.actualizar).toHaveBeenCalledWith(1, {
      nombre: '2026-1 Modificado',
      numero: 1,
      anio: 2026,
      programaId: 20,
      institucionId: 1,
      sedeId: 2
    });
    expect(notificationService.success).toHaveBeenCalledWith('Semestre actualizado correctamente.');
    expect(component.showModal).toBeFalse();
  });

  it('should handle update error gracefully', () => {
    semestreService.actualizar.and.returnValue(throwError(() => new Error('Error de servidor')));

    const item = component.items[0];
    component.openEditModal(item);
    component.submit();

    expect(notificationService.error).toHaveBeenCalledWith('No fue posible actualizar el semestre.');
    expect(component.saving).toBeFalse();
  });
});
