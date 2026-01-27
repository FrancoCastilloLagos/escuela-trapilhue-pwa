import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  rut = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(event: Event) {
    event.preventDefault();
    
    if (!this.rut || !this.password) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    const credentials = { rut: this.rut, password: this.password };

    this.authService.login(credentials).subscribe({
      next: (res: any) => {
        if (res.success) {
          const user = res.user;
          const rol = user.rol.toUpperCase();
          
          // --- NUEVO: GUARDAR DATOS EN LOCALSTORAGE ---
          // Esto es lo que faltaba para que el Apoderado vea su info
          localStorage.setItem('id_usuario', user.id.toString());
          localStorage.setItem('tipo_usuario', rol);
          
          if (user.id_estudiante) {
            localStorage.setItem('id_estudiante', user.id_estudiante.toString());
            console.log("✅ Estudiante vinculado guardado:", user.id_estudiante);
          }

          if (user.id_curso) {
            localStorage.setItem('id_curso', user.id_curso.toString());
          }
          // --------------------------------------------

          console.log("Login exitoso, redirigiendo según rol:", rol);
          
          if (rol === 'DOCENTE') {
            this.router.navigate(['/dashboard-docente']);
          } else {
            this.router.navigate(['/dashboard-apoderado']);
          }
        }
      },
      error: (err: any) => {
        alert('Error al conectar con el servidor o credenciales inválidas.');
        console.error('Error detallado de Login:', err);
      }
    });
  }
}