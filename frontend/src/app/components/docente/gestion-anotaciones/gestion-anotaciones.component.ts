import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotasService } from '../../../services/notas.service';
import { OfflineStorageService } from '../../../services/offline-storage.service';

@Component({
  selector: 'app-gestion-anotaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-anotaciones.component.html',
  styleUrls: ['./gestion-anotaciones.component.css']
})
export class GestionAnotacionesComponent implements OnInit {
  userRol: string = '';
  userName: string = ''; 
  menuOpen: boolean = false;
  cursos: any[] = [];
  estudiantes: any[] = [];
  anotacionesActuales: any[] = [];

  seleccion: any = {
    curso: null,
    estudiante: null,
    contenido: '',
    tipo: 'POSITIVA', 
    id_anotacion_edicion: null
  };

  anotacionSeleccionadaId: number | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notasService: NotasService,
    private offlineStore: OfflineStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const rawRol = this.authService.getRol() || 'DOCENTE';
    this.userRol = rawRol.charAt(0).toUpperCase() + rawRol.slice(1).toLowerCase();
    this.userName = localStorage.getItem('rut') || 'DOCENTE';
    this.cargarCursos();
  }

  cambiarTipo(nuevoTipo: string) {
    this.seleccion.tipo = nuevoTipo;
    this.cdr.detectChanges();
  }

  cargarCursos() {
    this.notasService.getCursos().subscribe({
      next: (data: any) => { this.cursos = data; this.cdr.detectChanges(); }
    });
  }

  onCursoChange() {
    this.estudiantes = [];
    this.seleccion.estudiante = null;
    this.anotacionesActuales = [];
    if (this.seleccion.curso) {
      this.notasService.getEstudiantesPorCurso(this.seleccion.curso).subscribe({
        next: (data: any) => { this.estudiantes = data; this.cdr.detectChanges(); }
      });
    }
  }

  obtenerAnotaciones() {
    if (this.seleccion.estudiante) {
      this.notasService.getAnotacionesEstudiante(this.seleccion.estudiante).subscribe({
        next: (data: any) => {
          this.anotacionesActuales = data;
          this.anotacionSeleccionadaId = null;
          this.cdr.detectChanges();
        }
      });
    }
  }

  guardarAnotacion() {
    const idDocente = localStorage.getItem('id_usuario'); 
    
    if (this.seleccion.contenido && this.seleccion.estudiante && idDocente) {
      const payload = {
        id_estudiante: Number(this.seleccion.estudiante),
        id_docente: Number(idDocente),
        contenido: this.seleccion.contenido,
        tipo: this.seleccion.tipo, 
        fecha: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      const id_edicion = this.seleccion.id_anotacion_edicion;
      const obs = id_edicion 
        ? this.notasService.actualizarAnotacion(id_edicion, payload)
        : this.notasService.guardarAnotacion(payload);

      obs.subscribe({
        next: () => {
          const notif = { 
            id_estudiante: Number(this.seleccion.estudiante), 
            tipo: 'anotacion' 
          };
          this.notasService.guardarNotificacionSQL(notif).subscribe();

          alert('Éxito: Registro guardado y apoderado notificado.');
          this.limpiarPanelEdicion();
          this.obtenerAnotaciones();
        },
        error: async () => {
          const url = id_edicion ? `api/anotaciones/${id_edicion}` : 'api/anotaciones';
          await this.offlineStore.encolarAccionParaSincronizar(url, id_edicion ? 'PUT' : 'POST', payload);
          alert('Anotación guardada localmente (Modo Offline).');
          this.limpiarPanelEdicion();
        }
      });
    } else {
      alert('Por favor, complete todos los campos.');
    }
  }

  seleccionarParaAccion(anotacion: any) { 
    this.anotacionSeleccionadaId = (this.anotacionSeleccionadaId === anotacion.id_anotacion) ? null : anotacion.id_anotacion; 
  }
  
  editarAnotacion() {
    if (!this.anotacionSeleccionadaId) return;
    const anot = this.anotacionesActuales.find(a => a.id_anotacion === this.anotacionSeleccionadaId);
    if (anot) {
      this.seleccion.id_anotacion_edicion = anot.id_anotacion;
      this.seleccion.contenido = anot.contenido;
      this.seleccion.tipo = anot.tipo;
      this.cdr.detectChanges();
    }
  }

  borrarAnotacion() {
    if (!this.anotacionSeleccionadaId) return;
    if (confirm('¿Seguro que desea eliminar esta anotación?')) {
      this.notasService.borrarAnotacion(this.anotacionSeleccionadaId).subscribe(() => {
        this.obtenerAnotaciones();
      });
    }
  }

  limpiarPanelEdicion() {
    this.seleccion.contenido = '';
    this.seleccion.tipo = 'POSITIVA';
    this.seleccion.id_anotacion_edicion = null;
    this.anotacionSeleccionadaId = null;
    this.cdr.detectChanges();
  }

  toggleMenu(event: Event) { event.stopPropagation(); this.menuOpen = !this.menuOpen; }
  volverDashboard() { this.router.navigate(['/dashboard-docente']); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }
  irAConfig() { this.menuOpen = false; this.router.navigate(['/configuracion']); }
}