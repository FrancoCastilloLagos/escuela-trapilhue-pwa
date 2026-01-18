import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotasService {
  private apiUrl = 'http://localhost:3000/api/notas';
  private notifUrl = 'http://localhost:3000/api/notificaciones';
  private anotacionesUrl = 'http://localhost:3000/api/anotaciones';
  private evaluacionUrl = 'http://localhost:3000/api/evaluaciones';
  private usuariosUrl = 'http://localhost:3000/api/usuarios';

  private notificacionSubject = new BehaviorSubject<any>(null);
  public nuevaNotificacion$ = this.notificacionSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCursos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cursos`).pipe(
      tap(data => localStorage.setItem('cache_cursos', JSON.stringify(data))),
      catchError(() => {
        const local = localStorage.getItem('cache_cursos');
        return of(local ? JSON.parse(local) : []);
      })
    );
  }

  getEstudiantesPorCurso(idCurso: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/estudiantes/curso/${idCurso}`).pipe(
      tap(data => localStorage.setItem(`cache_estudiantes_${idCurso}`, JSON.stringify(data))),
      catchError(() => {
        const local = localStorage.getItem(`cache_estudiantes_${idCurso}`);
        return of(local ? JSON.parse(local) : []);
      })
    );
  }

  getAsignaturasPorCurso(idCurso: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/asignaturas/${idCurso}`).pipe(
      tap(data => localStorage.setItem(`cache_asignaturas_curso_${idCurso}`, JSON.stringify(data))),
      catchError(() => {
        const local = localStorage.getItem(`cache_asignaturas_curso_${idCurso}`);
        return of(local ? JSON.parse(local) : []);
      })
    );
  }

  getAsignaturasPorEstudiante(idEstudiante: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/asignaturas/estudiante/${idEstudiante}`).pipe(
      tap(data => localStorage.setItem(`cache_asig_est_${idEstudiante}`, JSON.stringify(data))),
      catchError(() => {
        const local = localStorage.getItem(`cache_asig_est_${idEstudiante}`);
        return of(local ? JSON.parse(local) : []);
      })
    );
  }


  getNotificaciones(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.notifUrl}/${idUsuario}`).pipe(
      catchError(() => of([]))
    );
  }

  guardarNotificacionSQL(payload: any): Observable<any> { 
    return this.http.post(this.notifUrl, payload).pipe(
      tap(() => this.notificacionSubject.next(payload)),
      catchError(() => of({ success: false }))
    ); 
  }

  marcarComoLeidas(idUsuario: number): Observable<any> {
    return this.http.put(`${this.notifUrl}/leer/${idUsuario}`, {}).pipe(
      catchError(() => of({ success: false }))
    );
  }


  getNotasEstudiante(idEstudiante: number, idAsignatura: number): Observable<any> { 
    return this.http.get(`${this.apiUrl}/notas/${idEstudiante}/${idAsignatura}`).pipe(
      catchError(() => {
        const local = localStorage.getItem(`cache_notas_${idEstudiante}_${idAsignatura}`);
        return of(local ? JSON.parse(local) : []);
      }),
      tap(data => localStorage.setItem(`cache_notas_${idEstudiante}_${idAsignatura}`, JSON.stringify(data)))
    ); 
  }

  guardarNota(payload: any): Observable<any> { return this.http.post(`${this.apiUrl}/notas`, payload); }
  actualizarNota(id: number, payload: any): Observable<any> { return this.http.put(`${this.apiUrl}/notas/${id}`, payload); }
  borrarNota(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/notas/${id}`); }
  
  getConteoAnotaciones(idEstudiante: number): Observable<any> { return this.http.get<any>(`${this.anotacionesUrl}/conteo/${idEstudiante}`).pipe(catchError(() => of({ total: 0 }))); }
  getAnotacionesEstudiante(idEstudiante: number): Observable<any> { return this.http.get(`${this.anotacionesUrl}/${idEstudiante}`).pipe(catchError(() => of([]))); }
  
  guardarAnotacion(payload: any): Observable<any> { return this.http.post(`${this.anotacionesUrl}`, payload); }
  actualizarAnotacion(id: number, payload: any): Observable<any> { return this.http.put(`${this.anotacionesUrl}/${id}`, payload); }
  borrarAnotacion(id: number): Observable<any> { return this.http.delete(`${this.anotacionesUrl}/${id}`); }
  
  getEvaluacionesDB(): Observable<any> { return this.http.get(`${this.evaluacionUrl}`); }
  getEvaluacionesPorCurso(idCurso: number): Observable<any[]> { return this.http.get<any[]>(`${this.evaluacionUrl}/curso/${idCurso}`).pipe(catchError(() => of([]))); }
  guardarEvaluacionDB(payload: any): Observable<any> { return this.http.post(`${this.evaluacionUrl}`, payload); }
  actualizarEvaluacionDB(id: number, payload: any): Observable<any> { return this.http.put(`${this.evaluacionUrl}/${id}`, payload); }
  borrarEvaluacionDB(id: number): Observable<any> { return this.http.delete(`${this.evaluacionUrl}/${id}`); }
  
  cambiarPasswordDB(id_usuario: number, actual: string, nueva: string): Observable<any> { return this.http.put(`${this.usuariosUrl}/cambiar-password/${id_usuario}`, { actual, nueva }); }
}