import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotasService } from '../../../services/notas.service';
import { NotificationsService } from '../../../services/notifications.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consulta-anotaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consulta-anotaciones.component.html',
  styleUrls: ['./consulta-anotaciones.component.css']
})
export class ConsultaAnotacionesComponent implements OnInit, OnDestroy {
  // Datos de anotaciones
  anotaciones: any[] = [];
  loading: boolean = true;
  private refreshSub?: Subscription;

  // Variables Header y Notificaciones (Tu lógica funcional)
  userRol: string = '';
  userName: string = '';
  menuOpen: boolean = false;
  notifOpen: boolean = false;
  listaNotificaciones: any[] = [];
  unreadCount: number = 0;
  private intervalId: any;

  constructor(
    private notasService: NotasService,
    private notiService: NotificationsService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Carga inicial de anotaciones
    this.cargarAnotaciones();

    // Configuración Header (Respetando tu código)
    this.userRol = (this.authService.getRol() || 'Usuario').toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Usuario';
    
    this.actualizarNotificaciones();
    this.intervalId = setInterval(() => this.actualizarNotificaciones(), 10000);

    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      this.cargarAnotaciones();
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  // --- LÓGICA DE ANOTACIONES ---
  cargarAnotaciones() {
    const id = localStorage.getItem('id_estudiante');
    if (id) {
      this.notasService.getAnotacionesEstudiante(Number(id)).subscribe({
        next: (data: any) => { 
          this.anotaciones = data; 
          this.loading = false; 
          this.cdr.detectChanges(); 
        },
        error: () => { 
          this.loading = false; 
          this.cdr.detectChanges(); 
        }
      });
    }
  }

  // --- LÓGICA DEL HEADER (TU CÓDIGO FUNCIONAL) ---
  actualizarNotificaciones() {
    const idUsu = localStorage.getItem('id_usuario');
    if (!idUsu) return;

    fetch(`http://localhost:3000/api/notificaciones/${idUsu}`)
      .then(res => res.json())
      .then(data => {
        this.listaNotificaciones = data.map((n: any) => {
          let t = n.tipo ? n.tipo.toLowerCase().trim() : 'comunicacion';
          const tit = n.titulo.toLowerCase();
          
          if (tit.includes('anotaci')) {
            t = 'anotacion'; 
          } else if (tit.includes('riesgo') || tit.includes('alerta')) {
            t = 'riesgo'; 
          } else if (tit.includes('nota') || tit.includes('calificaci')) {
            t = 'nota';
          } else if (tit.includes('fecha') || tit.includes('evaluaci')) {
            t = 'fecha';
          }

          return { ...n, tipo: t, leida: Number(n.leida) };
        });

        this.unreadCount = this.listaNotificaciones.filter(n => n.leida === 0).length;
        this.cdr.detectChanges(); 
      })
      .catch(err => console.error("Error en polling:", err));
  }

  toggleNotifications(e: Event) {
    e.stopPropagation();
    this.notifOpen = !this.notifOpen;
    this.menuOpen = false;
    if (this.notifOpen && this.unreadCount > 0) {
      this.marcarComoLeidas();
    }
  }

  private marcarComoLeidas() {
    const idUsu = localStorage.getItem('id_usuario');
    fetch(`http://localhost:3000/api/notificaciones/leer/${idUsu}`, { method: 'PUT' })
      .then(() => {
        this.unreadCount = 0;
        this.listaNotificaciones.forEach(n => n.leida = 1);
        this.cdr.detectChanges();
      })
      .catch(err => console.error("Error al marcar como leídas:", err));
  }

  toggleMenu(e: Event) {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
    this.notifOpen = false;
  }

  volverDashboard() {
    const r = this.authService.getRol()?.toUpperCase();
    this.router.navigate([r === 'DOCENTE' ? '/dashboard-docente' : '/dashboard-apoderado']);
  }

  irAConfiguracion() { 
    this.menuOpen = false;
    this.router.navigate(['/configuracion']); 
  }

  cerrarSesion() { 
    this.authService.logout(); 
    this.router.navigate(['/login']); 
  }
}