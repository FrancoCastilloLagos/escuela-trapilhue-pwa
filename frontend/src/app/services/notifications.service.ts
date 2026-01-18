import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, timer, of, Observable, Subscription, Subject } from 'rxjs';
import { switchMap, catchError, map, distinctUntilChanged, tap } from 'rxjs/operators';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'nota' | 'comunicacion' | 'fecha' | 'anotacion' | 'riesgo';
  fecha: Date;
  leida: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private API_URL = 'http://localhost:3000/api/notificaciones';
  
  private notificationsSource = new BehaviorSubject<Notificacion[]>([]);
  notifications$ = this.notificationsSource.asObservable();
  
  private _refreshNeeded$ = new Subject<void>();
  get refreshNeeded$() {
    return this._refreshNeeded$.asObservable();
  }

  private syncSubscription?: Subscription;

  constructor(private http: HttpClient) {
    this.iniciarSincronizacion();
  }

  private iniciarSincronizacion() {
    if (this.syncSubscription) this.syncSubscription.unsubscribe();

    this.syncSubscription = timer(0, 5000).pipe(
      switchMap(() => this.fetchNotificaciones()),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => {
        console.log('🔔 Cambio detectado en notificaciones, disparando refresco de componentes...');
        this._refreshNeeded$.next(); 
      })
    ).subscribe(procesadas => {
      this.notificationsSource.next(procesadas);
    });
  }

  private fetchNotificaciones(): Observable<Notificacion[]> {
    const idUsuario = localStorage.getItem('id_usuario');
    if (!idUsuario) return of([]);

    return this.http.get<any[]>(`${this.API_URL}/${idUsuario}`).pipe(
      map(data => (data || []).map(n => ({
        ...n,
        fecha: new Date(n.fecha),
        leida: n.leida === 1 || n.leida === true
      }))),
      catchError(() => of([]))
    );
  }

  forzarActualizacion() {
    this.fetchNotificaciones().subscribe(data => {
      this.notificationsSource.next(data);
      this._refreshNeeded$.next(); 
    });
  }

  agregarNotificacion(titulo: string, mensaje: string, tipo: string, idEstudiante?: number | null, idAsignatura?: number | null) {
    const payload = { 
      titulo, 
      mensaje, 
      tipo: tipo.toLowerCase(), 
      id_estudiante: idEstudiante || null,
      id_asignatura: idAsignatura || null 
    };

    this.http.post(this.API_URL, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.forzarActualizacion();
        }, 500);
      },
      error: (err) => console.error('Error al notificar:', err)
    });
  }

  marcarTodasComoLeidas() {
    const idUsuario = localStorage.getItem('id_usuario');
    if (!idUsuario) return;

    this.http.put(`${this.API_URL}/leer/${idUsuario}`, {}).subscribe({
      next: () => this.forzarActualizacion(),
      error: (err) => console.error('Error al marcar como leídas:', err)
    });
  }

  get totalNoLeidas(): number {
    return this.notificationsSource.value.filter(n => !n.leida).length;
  }
}