import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  login(credentials: { rut: string; password: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.success && res.user) {
          localStorage.clear();
          
          localStorage.setItem('token', res.token);
          localStorage.setItem('rol', res.user.rol.toUpperCase());
          localStorage.setItem('rut', res.user.rut);
          
          if (res.user.id) {
            localStorage.setItem('id_usuario', res.user.id.toString());
          }

          if (res.user.id_estudiante) {
            localStorage.setItem('id_estudiante', res.user.id_estudiante.toString());
          }

          if (res.user.id_curso) {
            localStorage.setItem('id_curso', res.user.id_curso.toString());
          }
          if (res.user.nombre_curso) {
            localStorage.setItem('nombre_curso', res.user.nombre_curso);
          }
          if (res.user.nombre) {
            localStorage.setItem('nombre_estudiante', res.user.nombre);
          }
          
          console.log("💾 Sesión iniciada y datos de curso guardados:", res.user);
        }
      })
    );
  }

  register(userData: { rut: string; password: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  logout() {
    localStorage.clear();
  }
}