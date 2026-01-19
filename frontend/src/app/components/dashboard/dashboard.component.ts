import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { NotasService } from '../../services/notas.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Variables para controlar quién está logueado y qué mostrar en el panel.
  userRol: string = '';
  userName: string = '';
  menuOpen: boolean = false; 
  notifOpen: boolean = false;
  listaNotificaciones: any[] = [];
  esDocente: boolean = false;
  idUsuarioActual: number = 0;
  unreadCount: number = 0;

  // Suscripción para el temporizador que busca notificaciones nuevas.
  private pollSub: Subscription | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private nService: NotasService,
    private cdr: ChangeDetectorRef
  ) {}

  // Al iniciar: recupero el rol, el RUT y el ID. Si es apoderado, activo la sincronización.
  ngOnInit() {
    this.userRol = (this.authService.getRol() || '').toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Usuario';
    this.idUsuarioActual = Number(localStorage.getItem('id_usuario'));
    this.esDocente = this.userRol === 'DOCENTE';

    // Solo los apoderados reciben notificaciones automáticas por ahora.
    if (!this.esDocente && this.idUsuarioActual > 0) {
      this.iniciarSincronizacion();
    }
  }

  // Configuro un intervalo de 5 segundos para estar revisando si hay avisos nuevos en la BD.
  iniciarSincronizacion() {
    this.pollSub = interval(5000).pipe(
      startWith(0), // Para que la primera carga sea inmediata al entrar.
      switchMap(() => this.nService.getNotificaciones(this.idUsuarioActual))
    ).subscribe({
      next: (data: any[]) => {
        this.listaNotificaciones = data.map(n => {
          // Normalizamos el tipo para que el CSS no falle por mayúsculas.
          let tipoFinal = (n.tipo || n.TIPO || 'comunicacion').toLowerCase();
          
          // Truco: Si el mensaje es una alerta académica, lo forzamos a tipo 'riesgo' 
          // para que en el CSS se pinte de color rojo automáticamente.
          if (tipoFinal === 'alerta' || (n.titulo && n.titulo.includes('Alerta'))) {
            tipoFinal = 'riesgo';
          }

          return {
            titulo: n.titulo || n.TITULO || 'Aviso',
            mensaje: n.mensaje || n.MENSAJE || '',
            fecha: n.fecha || n.FECHA || n.created_at,
            tipo: tipoFinal, 
            leida: n.leida === 1 || n.LEIDA === 1 || false
          };
        });

        // Contamos cuántas no se han visto para poner el globito rojo en la campana.
        this.unreadCount = this.listaNotificaciones.filter(n => !n.leida).length;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        // Si falla la red, no mostramos error al usuario para no molestarlo.
      }
    });
  }

  // Mato el proceso de sincronización cuando el usuario sale del dashboard.
  ngOnDestroy() {
    if (this.pollSub) this.pollSub.unsubscribe();
  }

  // Control para abrir la campana de notificaciones y marcarlas como leídas de una vez.
  toggleNotifications(event: Event) {
    if (this.esDocente) return; // Los profes no usan esta campana por ahora.
    event.stopPropagation();
    
    this.notifOpen = !this.notifOpen;
    this.menuOpen = false;

    // Si abre la lista y hay pendientes, le avisamos al servidor que ya las vio todas.
    if (this.notifOpen && this.unreadCount > 0) {
      this.unreadCount = 0; 
      this.nService.marcarComoLeidas(this.idUsuarioActual).subscribe({
        next: () => {
          this.listaNotificaciones.forEach(n => n.leida = true);
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Manejo del menu lateral de usuario.
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
    this.notifOpen = false;
  }

  // Rutas de navegación: detecto si es docente o apoderado para mandar a la página correcta.
  irANotas() { this.router.navigate([this.esDocente ? '/gestion-notas' : '/consulta-notas']); }
  irAAnotaciones() { this.router.navigate([this.esDocente ? '/gestion-anotaciones' : '/consulta-anotaciones']); }
  irAFechas() { this.router.navigate([this.esDocente ? '/gestion-fechas' : '/consulta-fechas']); }
  irARendimiento() { this.router.navigate(['/rendimiento']); }
  irAConfig() { this.menuOpen = false; this.router.navigate(['/configuracion']); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }
}