import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotasService } from '../../services/notas.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {
  // Variables para saber quién está conectado y manejar el menú desplegable.
  userRol: string = '';
  userName: string = ''; 
  menuOpen: boolean = false;
  // Objeto para capturar lo que el usuario escribe en el formulario de cambio de clave.
  passData = { actual: '', nueva: '', confirmar: '' };

  constructor(
    private router: Router,
    private authService: AuthService,
    private notasService: NotasService,
    private cdr: ChangeDetectorRef
  ) {}

  // Al cargar, rescato el rol y el RUT del storage para personalizar la vista.
  ngOnInit() {
    this.userRol = localStorage.getItem('tipo_usuario') || 'DOCENTE';
    this.userName = localStorage.getItem('rut') || 'Usuario';
  }

  // Lógica para validar y enviar la nueva contraseña a la base de datos.
  actualizarContrasena() {
    const { actual, nueva, confirmar } = this.passData;

    // Primero validamos que no haya campos vacíos.
    if (!actual || !nueva || !confirmar) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    // Chequeamos que la nueva clave esté bien escrita en ambos cuadros.
    if (nueva !== confirmar) {
      alert('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    const idUsuario = localStorage.getItem('id_usuario');
    
    // Si por alguna razón se perdió el ID de la sesión, no dejamos continuar.
    if (!idUsuario) {
      alert('Error: ID de usuario no encontrado en la sesión.');
      return;
    }

    // Llamamos al servicio de notas (donde está el cambio de pass) y enviamos los datos.
    this.notasService.cambiarPasswordDB(Number(idUsuario), actual, nueva).subscribe({
      next: (res) => {
        alert('✅ ¡Contraseña actualizada con éxito en el sistema!');
        // Limpiamos los campos del formulario después del éxito.
        this.passData = { actual: '', nueva: '', confirmar: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error en la petición:', err);
        alert(err.error?.message || 'Error de conexión con el servidor');
      }
    });
  }

  // Abre y cierra el menú de usuario sin que el click se propague a otros elementos.
  toggleMenu(event: Event) { 
    event.stopPropagation(); 
    this.menuOpen = !this.menuOpen; 
  }

  // Dependiendo de si es Profe o Apoderado, lo mando a su dashboard correspondiente.
  volverDashboard() { 
    if (this.userRol === 'APODERADO') {
      this.router.navigate(['/dashboard-apoderado']);
    } else {
      this.router.navigate(['/dashboard-docente']);
    }
  }

  // Limpio el token y devuelvo al usuario a la pantalla de entrada.
  cerrarSesion() { 
    this.authService.logout(); 
    this.router.navigate(['/login']); 
  }
}