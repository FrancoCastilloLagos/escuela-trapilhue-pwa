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
  userRol: string = '';
  userName: string = '';
  menuOpen: boolean = false; 
  notifOpen: boolean = false;
  listaNotificaciones: any[] = [];
  esDocente: boolean = false;
  idUsuarioActual: number = 0;
  unreadCount: number = 0;

  private pollSub: Subscription | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private nService: NotasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userRol = (this.authService.getRol() || '').toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Usuario';
    this.idUsuarioActual = Number(localStorage.getItem('id_usuario'));
    this.esDocente = this.userRol === 'DOCENTE';

    if (!this.esDocente && this.idUsuarioActual > 0) {
      this.iniciarSincronizacion();
    }
  }

  ngOnDestroy() {
    if (this.pollSub) this.pollSub.unsubscribe();
  }

  iniciarSincronizacion() {
    this.pollSub = interval(5000).pipe(
      startWith(0),
      switchMap(() => this.nService.getNotificaciones(this.idUsuarioActual))
    ).subscribe({
      next: (data: any[]) => {
        // FILTRO: Solo mostramos las últimas 5 según tu lógica del Header
        const ultimas5 = data.slice(0, 5); 

        this.listaNotificaciones = ultimas5.map(n => {
          let tipoFinal = (n.tipo || 'comunicacion').toLowerCase().trim();
          const tituloNorm = (n.titulo || '').toLowerCase();
          
          if (tituloNorm.includes('anotaci')) tipoFinal = 'anotacion';
          else if (tituloNorm.includes('riesgo') || tituloNorm.includes('alerta')) tipoFinal = 'riesgo';
          else if (tituloNorm.includes('nota') || tituloNorm.includes('calificaci')) tipoFinal = 'nota';
          else if (tituloNorm.includes('fecha') || tituloNorm.includes('evaluaci')) tipoFinal = 'fecha';

          return { ...n, tipo: tipoFinal, leida: n.leida === 1 || n.leida === true };
        });

        this.unreadCount = this.listaNotificaciones.filter(n => !n.leida).length;
        this.cdr.detectChanges(); 
      }
    });
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.notifOpen = !this.notifOpen;
    this.menuOpen = false;
    if (this.notifOpen && this.unreadCount > 0) {
      this.nService.marcarComoLeidas(this.idUsuarioActual).subscribe(() => {
        this.unreadCount = 0;
        this.listaNotificaciones.forEach(n => n.leida = true);
        this.cdr.detectChanges();
      });
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
    this.notifOpen = false;
  }

  irANotas() { this.router.navigate([this.esDocente ? '/gestion-notas' : '/consulta-notas']); }
  irAAnotaciones() { this.router.navigate([this.esDocente ? '/gestion-anotaciones' : '/consulta-anotaciones']); }
  irAFechas() { this.router.navigate([this.esDocente ? '/gestion-fechas' : '/consulta-fechas']); }
  irARendimiento() { this.router.navigate(['/rendimiento']); }
  irAConfig() { this.menuOpen = false; this.router.navigate(['/configuracion']); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }
}