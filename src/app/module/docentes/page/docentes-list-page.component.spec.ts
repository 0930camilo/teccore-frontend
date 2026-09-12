import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Rol } from '../../../shared/enums/rol.enum';
import { Docente, DocenteRequest } from '../model/docente.model';
import { DocenteListPageComponent } from './docentes-list-page.component';
import { DocenteService } from '../service/docente.service';

describe('DocenteListPageComponent', () => {
  let component: DocenteListPageComponent;
  let fixture: ComponentFixture<DocenteListPageComponent>;
  let docenteServiceSpy: jasmine.SpyObj<DocenteService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockDocentes: Docente[] = [
    {
      id: 1,
      nombres: 'Carlos',
      apellidos: 'Gómez',
      documento: '12345678',
      correo: 'carlos@institucion.edu.co',
      cargaHorariaSemanal: 20,
      institucionId: 10
    }
  ];

  beforeEach(async () => {
    docenteServiceSpy = jasmine.createSpyObj<DocenteService>('DocenteService', ['listar', 'crear']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getRol', 'getInstitucionId']);
    notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);

    docenteServiceSpy.listar.and.returnValue(
      of({
        status: 200,
        message: 'Listado de docentes',
        data: {
          content: mockDocentes,
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

    authServiceSpy.getRol.and.returnValue(Rol.ADMIN_INSTITUCION);
    authServiceSpy.getInstitucionId.and.returnValue(10);

    await TestBed.configureTestingModule({
      imports: [DocenteListPageComponent],
      providers: [
        { provide: DocenteService, useValue: docenteServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocenteListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load docentes initially', () => {
    expect(component).toBeTruthy();
    expect(docenteServiceSpy.listar).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
    expect(component.totalElements).toBe(1);
  });

  it('should open modal and reset form', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.docenteForm.get('nombres')?.value).toBe('');
  });

  it('should create a new docente successfully', () => {
    docenteServiceSpy.crear.and.returnValue(
      of({
        status: 201,
        message: 'Docente creado',
        data: {
          id: 2,
          nombres: 'Ana',
          apellidos: 'Martínez',
          documento: '87654321',
          correo: 'ana@institucion.edu.co',
          cargaHorariaSemanal: 15,
          institucionId: 10
        }
      })
    );

    component.openCreateModal();
    component.docenteForm.setValue({
      nombres: 'Ana',
      apellidos: 'Martínez',
      documento: '87654321',
      correo: 'ana@institucion.edu.co',
      cargaHorariaSemanal: 15
    });

    component.submitForm();

    const expectedPayload: DocenteRequest = {
      nombres: 'Ana',
      apellidos: 'Martínez',
      documento: '87654321',
      correo: 'ana@institucion.edu.co',
      cargaHorariaSemanal: 15,
      institucionId: 10
    };

    expect(docenteServiceSpy.crear).toHaveBeenCalledWith(expectedPayload);
    expect(notificationServiceSpy.success).toHaveBeenCalledWith('Docente registrado exitosamente.');
    expect(component.showModal).toBeFalse();
  });

  it('should handle error when creating docente', () => {
    docenteServiceSpy.crear.and.returnValue(throwError(() => new Error('Error al registrar')));

    component.openCreateModal();
    component.docenteForm.setValue({
      nombres: 'Ana',
      apellidos: 'Martínez',
      documento: '87654321',
      correo: 'ana@institucion.edu.co',
      cargaHorariaSemanal: 15
    });

    component.submitForm();

    expect(notificationServiceSpy.error).toHaveBeenCalledWith('Error al registrar');
    expect(component.submitting).toBeFalse();
  });
});
