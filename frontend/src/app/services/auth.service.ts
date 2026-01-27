import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'https://escuela-backend-vva9.onrender.com/api/auth'; 

  constructor(private http: HttpClient) { }

  login(credentials: { rut: string; password: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.success && res.user) {
       
          localStorage.clear();
          
       
          localStorage.setItem('token', res.token || 'dummy-token');
          localStorage.setItem('rol', res.user.rol.toUpperCase());
          localStorage.setItem('rut', res.user.rut);
          
          if (res.user.id) {
            localStorage.setItem('id_usuario', res.user.id.toString());
          }

          const idEstudiante = res.user.id_estudiante || res.id_estudiante;
          const idCurso = res.user.id_curso || res.id_curso;

          if (idEstudiante) {
            localStorage.setItem('id_estudiante', idEstudiante.toString());
            console.log("✅ Estudiante vinculado:", idEstudiante);
          }

          if (idCurso) {
            localStorage.setItem('id_curso', idCurso.toString());
          }

          if (res.user.nombre_curso) {
            localStorage.setItem('nombre_curso', res.user.nombre_curso);
          }
          
          if (res.user.nombre) {
            localStorage.setItem('nombre_estudiante', res.user.nombre);
          }
          
          console.log("💾 Sesión iniciada. Datos en LocalStorage:", {
            rol: res.user.rol,
            estudiante: idEstudiante,
            curso: idCurso
          });
        }
      })
    );
  }

  register(userData: { rut: string; password: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('id_usuario'); 
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  logout() {
    localStorage.clear();
  }
}