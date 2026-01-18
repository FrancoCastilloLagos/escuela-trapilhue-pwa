export interface Asignatura {
  id: number;
  nombre: string;
}

export interface Curso {
  id: number;
  nombre: string;
}

export interface Estudiante {
  id: number;
  nombre: string;
  rut: string;
}

export interface Nota {
  id?: number;
  estudianteId: number;
  asignaturaId: number;
  valor: number;
  tipo: 'sumativa' | 'formativa';
  evaluacionNum: number;
}