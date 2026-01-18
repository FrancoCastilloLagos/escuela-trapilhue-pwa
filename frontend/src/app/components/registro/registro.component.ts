import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  rut = '';
  password = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(event: Event) {
    event.preventDefault();
    
    if (!this.rut || !this.password) {
      alert('Por favor complete todos los campos.');
      return;
    }

    this.isLoading = true;
    
    const registroData = { 
      rut: this.rut, 
      password: this.password
    };

    this.authService.register(registroData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error detallado en registro:', err);
        const mensajeError = err.error?.message || 'Error al registrar. Verifique si el RUT ya existe o los datos son correctos.';
        alert(mensajeError);
      }
    });
  }
}