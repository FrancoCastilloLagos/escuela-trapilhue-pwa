import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotasService } from '../../../services/notas.service';
import { NotificationsService } from '../../../services/notifications.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consulta-anotaciones',
  standalone: true,
  imports: [CommonModule, FormsModule], // Quitamos HeaderComponent ya que lo haremos manual
  templateUrl: './consulta-anotaciones.component.html',
  styleUrls: ['./consulta-anotaciones.component.css']
})
export class ConsultaAnotacionesComponent implements OnInit, OnDestroy {
  anotaciones: any[] = [];
  loading: boolean = true;
  private refreshSub?: Subscription;

  // Variables para el Header Manual
  menuOpen: boolean = false;
  userName: string = localStorage.getItem('nombre_usuario') || 'Usuario';
  userRol: string = localStorage.getItem('rol') || 'Estudiante';

  constructor(
    private notasService: NotasService,
    private notiService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarAnotaciones();
    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      this.cargarAnotaciones();
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

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

  // Funciones de control del Header Manual
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  volverDashboard() {
    this.router.navigate(['/dashboard-estudiante']); // Ajusta según tu ruta
  }

  irAConfig() {
    this.router.navigate(['/configuracion']);
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}