import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service'; // <--- IMPORTANTE
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  userRol: string = '';
  userName: string = '';
  menuOpen: boolean = false;
  notifOpen: boolean = false;
  listaNotificaciones: any[] = [];
  unreadCount: number = 0;
  
  // Usamos una suscripción en lugar de un intervalo para que sea instantáneo
  private refreshSub?: Subscription;

  constructor(
    private authService: AuthService,
    private notiService: NotificationsService, // <--- INYECTAMOS EL SERVICIO
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRol = (this.authService.getRol() || 'Usuario').toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Usuario';
    
    // 1. Carga inicial
    this.actualizarNotificaciones();

    // 2. ESCUCHAR AL SERVICIO: Cuando el docente guarda algo, el servicio avisa 
    // y el header reacciona de inmediato sin esperar 10 segundos.
    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      console.log('🔔 Header: Recibida señal de actualización de notificaciones');
      this.actualizarNotificaciones();
    });
  }

  ngOnDestroy(): void {
    // Limpiamos la suscripción para evitar fugas de memoria
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  actualizarNotificaciones() {
    const idUsu = localStorage.getItem('id_usuario');
    if (!idUsu) return;

    // USAMOS LA URL DE RENDER (La misma del servicio)
    const API_URL = `https://escuela-backend-vva9.onrender.com/api/notificaciones/${idUsu}`;

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        this.listaNotificaciones = (data || []).map((n: any) => {
          let t = n.tipo ? n.tipo.toLowerCase().trim() : 'comunicacion';
          const tit = n.titulo.toLowerCase();
          
          // Lógica de colores por tipo
          if (tit.includes('anotaci')) {
            t = 'anotacion'; 
          } else if (tit.includes('riesgo') || tit.includes('alerta')) {
            t = 'riesgo'; 
          } else if (tit.includes('nota') || tit.includes('calificaci')) {
            t = 'nota';
          } else if (tit.includes('fecha') || tit.includes('evaluaci')) {
            t = 'fecha';
          }

          return { 
            ...n, 
            tipo: t, 
            leida: Number(n.leida) 
          };
        });

        this.unreadCount = this.listaNotificaciones.filter(n => n.leida === 0).length;
        this.cdr.detectChanges(); 
      })
      .catch(err => console.error("Error en sincronización del Header:", err));
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
    // TAMBIÉN CORREGIMOS ESTA URL A RENDER
    const API_URL_LEER = `https://escuela-backend-vva9.onrender.com/api/notificaciones/leer/${idUsu}`;

    fetch(API_URL_LEER, { method: 'PUT' })
      .then(() => {
        this.unreadCount = 0;
        this.listaNotificaciones.forEach(n => n.leida = 1);
        this.cdr.detectChanges();
        // Avisamos al servicio que forcé una actualización
        this.notiService.forzarActualizacion();
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