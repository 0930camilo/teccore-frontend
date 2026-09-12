import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Rol } from '../../../shared/enums/rol.enum';
import { Docente } from '../../docentes/model/docente.model';
import { DocenteService } from '../../docentes/service/docente.service';
import { Semestre } from '../../semestres/model/semestre.model';
import { SemestreService } from '../../semestres/service/semestre.service';
import { Materia, MateriaRequest } from '../model/materia.model';
import { MateriaListPageComponent } from './materias-list-page.component';
import { MateriaService } from '../service/materia.service';

describe('MateriaListPageComponent', () => {
  let component: MateriaListPageComponent;
  let fixture: ComponentFixture<MateriaListPageComponent>;
  let materiaServiceSpy: jasmine.SpyObj<MateriaService>;
  let semestreServiceSpy: jasmine.SpyObj<SemestreService>;
  let docenteServiceSpy: jasmine.SpyObj<DocenteService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockMaterias: Materia[] = [
    {
      id: 1,
      nombre: 'Programación I',
      intensidadHoraria: 64,
      semestreId: 5,
      semestreNombre: 'Semestre 1 - Sistemas',
      docenteId: 3,
      docenteNombre: 'Carlos Pérez',
      institucionId: 10
    }
  ];

  const mockSemestres: Semestre[] = [
    {
      id: 5,
      nombre: 'Semestre 1',
      numero: 1,
      anio: 2026,
      programaNombre: 'Ingeniería de Sistemas'
    }
  ];

  const mockDocentes: Docente[] = [
    {
      id: 3,
      nombres: 'Carlos',
      apellidos: 'Pérez',
      documento: '12345678',
      correo: 'carlos@mail.com',
      cargaHorariaSemanal: 20,
      institucionId: 10
    }
  ];

  beforeEach(async () => {
    materiaServiceSpy = jasmine.createSpyObj<MateriaService>('MateriaService', ['listar', 'crear', 'actualizar', 'eliminar', 'obtenerPorId']);
    semestreServiceSpy = jasmine.createSpyObj<SemestreService>('SemestreService', ['listar']);
    docenteServiceSpy = jasmine.createSpyObj<DocenteService>('DocenteService', ['listar', 'crear']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getRol', 'getInstitucionId', 'getSedeId']);
    notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);

    materiaServiceSpy.listar.and.returnValue(
      of({
        status: 200,
        message: 'Listado de materias',
        data: {
          content: mockMaterias,
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
          numberOfElements: 1,
          first: true,
          last: true,
          empty: false
        }
      })
    );

    semestreServiceSpy.listar.and.returnValue(
      of({
        status: 200,
        message: 'Listado de semestres',
        data: {
          content: mockSemestres,
          totalElements: 1,
          totalPages: 1,
          size: 100,
          number: 0,
          numberOfElements: 1,
          first: true,
          last: true,
          empty: false
        }
      })
    );

    docenteServiceSpy.listar.and.returnValue(
      of({
        status: 200,
        message: 'Listado de docentes',
        data: {
          content: mockDocentes,
          totalElements: 1,
          totalPages: 1,
          size: 100,
          number: 0,
          numberOfElements: 1,
          first: true,
          last: true,
          empty: false
        }
      })
    );

    authServiceSpy.getRol.and.returnValue(Rol.ADMIN_INSTITUCION);
    authServiceSpy.getInstitucionId.and.returnValue(10);
    authServiceSpy.getSedeId.and.returnValue(2);

    await TestBed.configureTestingModule({
      imports: [MateriaListPageComponent],
      providers: [
        { provide: MateriaService, useValue: materiaServiceSpy },
        { provide: SemestreService, useValue: semestreServiceSpy },
        { provide: DocenteService, useValue: docenteServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MateriaListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load materias, semestres and docentes initially', () => {
    expect(component).toBeTruthy();
    expect(materiaServiceSpy.listar).toHaveBeenCalled();
    expect(semestreServiceSpy.listar).toHaveBeenCalled();
    expect(docenteServiceSpy.listar).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
    expect(component.totalElements).toBe(1);
    expect(component.semestres.length).toBe(1);
    expect(component.docentes.length).toBe(1);
  });

  it('should resolve docente name correctly', () => {
    expect(component.getDocenteNombre(mockMaterias[0])).toBe('Carlos Pérez');

    const materiaConDocenteId: Materia = {
      id: 2,
      nombre: 'Bases de Datos',
      semestreId: 5,
      docenteId: 3
    };
    expect(component.getDocenteNombre(materiaConDocenteId)).toBe('Carlos Pérez');

    const materiaSinDocente: Materia = {
      id: 3,
      nombre: 'Cálculo',
      semestreId: 5
    };
    expect(component.getDocenteNombre(materiaSinDocente)).toBe('—');
  });

  it('should resolve semestre name correctly', () => {
    expect(component.getSemestreNombre(mockMaterias[0])).toBe('Semestre 1 - Sistemas');

    const materiaSinNombreDirecto: Materia = {
      id: 2,
      nombre: 'Bases de Datos',
      semestreId: 5
    };
    expect(component.getSemestreNombre(materiaSinNombreDirecto)).toBe('Semestre 1');

    const materiaConSemestreDesconocido: Materia = {
      id: 3,
      nombre: 'Cálculo',
      semestreId: 99
    };
    expect(component.getSemestreNombre(materiaConSemestreDesconocido)).toBe('Semestre #99');
  });

  it('should open modal and reset form', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.materiaForm.get('nombre')?.value).toBe('');
    expect(component.materiaForm.get('semestreId')?.value).toBeNull();
    expect(component.materiaForm.get('docenteId')?.value).toBeNull();
  });

  it('should create a new materia successfully', () => {
    materiaServiceSpy.crear.and.returnValue(
      of({
        status: 201,
        message: 'Materia creada',
        data: {
          id: 2,
          nombre: 'Estructura de Datos',
          intensidadHoraria: 48,
          semestreId: 5,
          docenteId: 3,
          institucionId: 10
        }
      })
    );

    component.openCreateModal();
    component.materiaForm.setValue({
      nombre: 'Estructura de Datos',
      semestreId: 5,
      docenteId: 3,
      intensidadHoraria: 48
    });

    component.submitForm();

    const expectedPayload: MateriaRequest = {
      nombre: 'Estructura de Datos',
      semestreId: 5,
      docenteId: 3,
      intensidadHoraria: 48,
      institucionId: 10,
      sedeId: 2
    };

    expect(materiaServiceSpy.crear).toHaveBeenCalledWith(expectedPayload);
    expect(notificationServiceSpy.success).toHaveBeenCalledWith('Materia creada exitosamente.');
    expect(component.showModal).toBeFalse();
  });

  it('should open edit modal and update materia successfully', () => {
    materiaServiceSpy.actualizar.and.returnValue(
      of({
        status: 200,
        message: 'Materia actualizada',
        data: {
          id: 1,
          nombre: 'Programación I (Avanzada)',
          intensidadHoraria: 80,
          semestreId: 5,
          docenteId: 3,
          institucionId: 10
        }
      })
    );

    component.openEditModal(mockMaterias[0]);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.editingId).toBe(1);
    expect(component.materiaForm.get('nombre')?.value).toBe('Programación I');
    expect(component.materiaForm.get('docenteId')?.value).toBe(3);

    component.materiaForm.patchValue({
      nombre: 'Programación I (Avanzada)',
      intensidadHoraria: 80
    });

    component.submitForm();

    expect(materiaServiceSpy.actualizar).toHaveBeenCalledWith(1, {
      nombre: 'Programación I (Avanzada)',
      semestreId: 5,
      docenteId: 3,
      intensidadHoraria: 80,
      institucionId: 10,
      sedeId: 2
    });
    expect(notificationServiceSpy.success).toHaveBeenCalledWith('Materia actualizada exitosamente.');
    expect(component.showModal).toBeFalse();
  });

  it('should open delete confirmation and delete materia successfully', () => {
    materiaServiceSpy.eliminar.and.returnValue(
      of({
        status: 200,
        message: 'Materia eliminada',
        data: undefined as unknown as void
      })
    );

    component.openDeleteConfirm(mockMaterias[0]);
    expect(component.showDeleteModal).toBeTrue();
    expect(component.deletingItem).toEqual(mockMaterias[0]);

    component.confirmDelete();

    expect(materiaServiceSpy.eliminar).toHaveBeenCalledWith(1);
    expect(notificationServiceSpy.success).toHaveBeenCalledWith('Materia eliminada exitosamente.');
    expect(component.showDeleteModal).toBeFalse();
  });

  it('should handle error when creating materia', () => {
    materiaServiceSpy.crear.and.returnValue(throwError(() => new Error('Error al registrar materia')));

    component.openCreateModal();
    component.materiaForm.setValue({
      nombre: 'Redes',
      semestreId: 5,
      intensidadHoraria: 32
    });

    component.submitForm();

    expect(notificationServiceSpy.error).toHaveBeenCalledWith('Error al registrar materia');
    expect(component.submitting).toBeFalse();
  });
});
