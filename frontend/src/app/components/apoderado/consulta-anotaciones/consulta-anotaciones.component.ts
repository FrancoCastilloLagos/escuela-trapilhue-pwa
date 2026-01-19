import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotasService } from '../../../services/notas.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-consulta-anotaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consulta-anotaciones.component.html',
  styleUrls: ['./consulta-anotaciones.component.css']
})
export class ConsultaAnotacionesComponent implements OnInit {
  anotaciones: any[] = [];
  userName: string = '';
  menuOpen: boolean = false;
  notifOpen: boolean = false;
  listaNotificaciones: any[] = [];
  unreadCount: number = 0;

  constructor(
    private notasService: NotasService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarAnotaciones();
    this.userName = localStorage.getItem('rut') || 'Usuario';
    this.actualizarNotificaciones();
    // Polling cada 15 segundos
    setInterval(() => this.actualizarNotificaciones(), 15000);
  }

  cargarAnotaciones() {
    const id = localStorage.getItem('id_estudiante');
    if (id) {
      this.notasService.getAnotacionesEstudiante(Number(id)).subscribe(data => {
        this.anotaciones = data;
        this.cdr.detectChanges();
      });
    }
  }

  actualizarNotificaciones() {
    const idUsu = localStorage.getItem('id_usuario');
    if (!idUsu) return;
    fetch(`http://localhost:3000/api/notificaciones/${idUsu}`)
      .then(res => res.json())
      .then(data => {
        this.listaNotificaciones = data;
        this.unreadCount = data.filter((n: any) => n.leida === 0).length;
        this.cdr.detectChanges();
      });
  }

  toggleNotifications(e: Event) {
    e.stopPropagation();
    this.notifOpen = !this.notifOpen;
    this.menuOpen = false;
    if (this.notifOpen && this.unreadCount > 0) this.marcarLeidas();
  }

  marcarLeidas() {
    const idUsu = localStorage.getItem('id_usuario');
    fetch(`http://localhost:3000/api/notificaciones/leer/${idUsu}`, { method: 'PUT' })
      .then(() => {
        this.unreadCount = 0;
        this.cdr.detectChanges();
      });
  }

  toggleMenu(e: Event) {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
    this.notifOpen = false;
  }

  volverDashboard() {
    const rol = this.authService.getRol()?.toUpperCase();
    this.router.navigate([rol === 'DOCENTE' ? '/dashboard-docente' : '/dashboard-apoderado']);
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}