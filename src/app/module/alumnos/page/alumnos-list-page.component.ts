import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  FormField,
  ResourceListComponent
} from '../../../components/resource-list/resource-list.component';

import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../shared/interface/api-response.interface';
import {
  PaginacionRequest,
  PaginacionRespuesta
} from '../../../shared/interface/pagination.interface';

import { Materia } from '../../materias/model/materia.model';
import { MateriaService } from '../../materias/service/materia.service';

import { Semestre } from '../../semestres/model/semestre.model';
import { SemestreService } from '../../semestres/service/semestre.service';

import { AlumnoService } from '../service/alumno.service';

@Component({
  selector: 'app-alumno-list-page',
  standalone: true,
  imports: [ResourceListComponent],
  template: `
    <app-resource-list
      [title]="titulo"
      [description]="descripcion"
      [loadFn]="loadFn"
      [createFn]="createFn"
      [createFields]="createFields"
    ></app-resource-list>
  `
})
export class AlumnoListPageComponent implements OnInit {
  private readonly service = inject(AlumnoService);
  private readonly authService = inject(AuthService);
  private readonly semestreService = inject(SemestreService);
  private readonly materiaService = inject(MateriaService);

  protected readonly titulo = 'Alumnos';

  protected readonly descripcion =
    'Consulta y búsqueda de alumnos registrados.';

  protected readonly loadFn = (
    filtros: PaginacionRequest
  ) => {
    return this.service.listar(filtros);
  };

  protected readonly createFn = (
    payload: Record<string, unknown>
  ): Observable<ApiResponse<unknown>> => {
    const institucionId = this.authService.getInstitucionId();
    const sedeId = this.authService.getSedeId();

    return this.service.crear({
      ...payload,
      institucionId,
      sedeId
    });
  };

  protected createFields: FormField[] = [
    {
      key: 'nombres',
      label: 'Nombres',
      type: 'text',
      required: true
    },
    {
      key: 'apellidos',
      label: 'Apellidos',
      type: 'text',
      required: true
    },
    {
      key: 'documento',
      label: 'Documento',
      type: 'text',
      required: true
    },
    {
      key: 'correo',
      label: 'Correo',
      type: 'email',
      required: false
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      type: 'text',
      required: false
    },
    {
      key: 'semestreId',
      label: 'Semestre',
      type: 'select',
      required: false,
      options: []
    },
    {
      key: 'materiaIds',
      label: 'Materias adicionales',
      type: 'multiselect',
      required: false,
      options: []
    }
  ];

  ngOnInit(): void {
    this.loadSemestres();
    this.loadMaterias();
  }

  private loadSemestres(): void {
    this.semestreService.listar({
      page: 0,
      size: 100
    }).subscribe({
      next: (response) => {
        const semestres = this.extractRecords(response.data);

        const options = semestres
          .filter(
            (
              semestre
            ): semestre is Semestre & { id: number } =>
              semestre.id != null
          )
          .map((semestre) => ({
            value: semestre.id,
            label: this.formatSemestreOption(semestre)
          }));

        this.updateFieldOptions('semestreId', options);
      },
      error: (error) => {
        console.error('Error al cargar los semestres:', error);
      }
    });
  }

  private loadMaterias(): void {
    this.materiaService.listar({
      page: 0,
      size: 500
    }).subscribe({
      next: (response) => {
        const materias = this.extractRecords(response.data);

        const options = materias
          .filter(
            (
              materia
            ): materia is Materia & { id: number } =>
              materia.id != null
          )
          .map((materia) => ({
            value: materia.id,
            label: this.formatMateriaOption(materia)
          }));

        this.updateFieldOptions('materiaIds', options);
      },
      error: (error) => {
        console.error('Error al cargar las materias:', error);
      }
    });
  }

  private updateFieldOptions(
    key: string,
    options: { value: unknown; label: string }[]
  ): void {
    this.createFields = this.createFields.map((field) =>
      field.key === key
        ? {
          ...field,
          options
        }
        : field
    );
  }

  private extractRecords<T>(
    data: PaginacionRespuesta<T> | T[] | null | undefined
  ): T[] {
    if (Array.isArray(data)) {
      return data;
    }

    return (
      data?.content ??
      data?.items ??
      data?.data ??
      []
    ) as T[];
  }

  private formatSemestreOption(semestre: Semestre): string {
    const nombre =
      semestre.nombre ??
      `Semestre #${semestre.id}`;

    const programa =
      semestre.programaNombre ??
      (
        semestre.programa as
          | { nombre?: string }
          | undefined
      )?.nombre;

    return programa
      ? `${nombre} - ${programa}`
      : nombre;
  }

  private formatMateriaOption(materia: Materia): string {
    const nombre =
      materia.nombre ??
      `Materia #${materia.id}`;

    const semestre =
      materia.semestreNombre ??
      (
        materia.semestre as
          | { nombre?: string }
          | undefined
      )?.nombre;

    return semestre
      ? `${nombre} - ${semestre}`
      : nombre;
  }
}
