import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component'; // IMPORTAR AQUÍ

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent], // AGREGAR HeaderComponent AQUÍ
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRol: string = '';
  userName: string = '';
  esDocente: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.userRol = (this.authService.getRol() || '').toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Usuario';
    this.esDocente = this.userRol === 'DOCENTE';
  }

  // Rutas simples
  irANotas() { this.router.navigate([this.esDocente ? '/gestion-notas' : '/consulta-notas']); }
  irAAnotaciones() { this.router.navigate([this.esDocente ? '/gestion-anotaciones' : '/consulta-anotaciones']); }
  irAFechas() { this.router.navigate([this.esDocente ? '/gestion-fechas' : '/consulta-fechas']); }
  irARendimiento() { this.router.navigate(['/rendimiento']); }
}