import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  private intervalId: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRol = (this.authService.getRol() || 'Usuario').toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Usuario';
    
    // Si no es docente, activamos el rastreador de notificaciones
    if (this.userRol !== 'DOCENTE') {
      this.actualizarNotificaciones();
      // Polling cada 5 segundos para máxima respuesta
      this.intervalId = setInterval(() => this.actualizarNotificaciones(), 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  actualizarNotificaciones() {
    const idUsu = localStorage.getItem('id_usuario');
    if (!idUsu) return;

    fetch(`http://localhost:3000/api/notificaciones/${idUsu}`)
      .then(res => res.json())
      .then(data => {
        const procesadas = data.map((n: any) => {
          let t = n.tipo ? n.tipo.toLowerCase().trim() : 'comunicacion';
          const tit = n.titulo.toLowerCase();
          
          if (tit.includes('anotaci')) t = 'anotacion';
          else if (tit.includes('riesgo') || tit.includes('alerta')) t = 'riesgo';
          else if (tit.includes('nota') || tit.includes('calificaci')) t = 'nota';
          else if (tit.includes('fecha') || tit.includes('evaluaci')) t = 'fecha';

          return { ...n, tipo: t, leida: Number(n.leida) };
        });

        // Ordenamos: las más recientes arriba
        procesadas.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // El contador global de no leídas
        this.unreadCount = procesadas.filter((n: any) => n.leida === 0).length;
        
        // El dropdown solo muestra las últimas 5 para no colapsar la pantalla
        this.listaNotificaciones = procesadas.slice(0, 5);

        this.cdr.detectChanges(); 
      })
      .catch(err => console.error("Error en Header Polling:", err));
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