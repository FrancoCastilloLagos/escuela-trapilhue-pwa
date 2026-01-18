import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotasService } from '../../../services/notas.service';
import { OfflineStorageService } from '../../../services/offline-storage.service';

@Component({
  selector: 'app-gestion-fechas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-fechas.component.html',
  styleUrls: ['./gestion-fechas.component.css']
})
export class GestionFechasComponent implements OnInit {
  userRol: string = '';
  userName: string = '';
  menuOpen: boolean = false;
  cursos: any[] = [];
  asignaturas: any[] = [];
  fechasActuales: any[] = [];

  seleccion: any = {
    curso: null,
    asignatura: null,
    contenido: '',
    fecha: new Date().toISOString().split('T')[0],
    id_fecha_edicion: null
  };

  fechaSeleccionadaId: number | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private nService: NotasService,
    private offlineStore: OfflineStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const rawRol = this.authService.getRol() || 'DOCENTE';
    this.userRol = rawRol.toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Docente';
    this.cargarCursos();
  }

  cargarCursos() {
    this.nService.getCursos().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cdr.detectChanges();
      }
    });
  }

  onCursoChange() {
    this.asignaturas = [];
    this.fechasActuales = []; 
    this.seleccion.asignatura = null;
    if (this.seleccion.curso) {
      this.nService.getAsignaturasPorCurso(Number(this.seleccion.curso)).subscribe({
        next: (data) => {
          this.asignaturas = data;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onAsignaturaChange() {
    this.fechasActuales = [];
    if (this.seleccion.asignatura) {
      this.obtenerFechas();
    }
  }

  obtenerFechas() {
    if (!this.seleccion.asignatura) return;

    this.nService.getEvaluacionesDB().subscribe({
      next: (data: any[]) => {
        const idAsignaturaSeleccionada = Number(this.seleccion.asignatura);
        this.fechasActuales = data
          .filter(f => Number(f.id_asignatura) === idAsignaturaSeleccionada)
          .map(f => {
            const asigEncontrada = this.asignaturas.find(a => Number(a.id_asignatura) === idAsignaturaSeleccionada);
            return {
              ...f,
              nombre_asignatura: asigEncontrada ? (asigEncontrada.nombre || asigEncontrada.nombre_asignatura) : 'Asignatura',
              contenido: f.titulo || f.contenido || 'Evaluación sin descripción'
            };
          });
        this.cdr.detectChanges();
      }
    });
  }

  guardarFecha() {
    const { contenido, fecha, id_fecha_edicion, asignatura } = this.seleccion;
    
    if (contenido && fecha && asignatura) {
      const payload = {
        fecha: fecha,
        titulo: contenido,
        tipo_evaluacion: 'sumativa',
        id_docente: localStorage.getItem('id_usuario'), 
        id_asignatura: Number(asignatura)
      };

      const url = id_fecha_edicion 
        ? `http://localhost:3000/api/evaluaciones/${id_fecha_edicion}`
        : 'http://localhost:3000/api/evaluaciones';
      
      const metodo = id_fecha_edicion ? 'PUT' : 'POST';

      const obs = id_fecha_edicion
        ? this.nService.actualizarEvaluacionDB(id_fecha_edicion, payload)
        : this.nService.guardarEvaluacionDB(payload);

      obs.subscribe({
        next: () => {
          const notifPayload = { tipo: 'fecha', id_asignatura: Number(asignatura) };
          this.nService.guardarNotificacionSQL(notifPayload).subscribe();
          alert('¡Guardado con éxito!');
          this.limpiarPanelEdicion();
          this.obtenerFechas();
        },
        error: async (err: any) => {
          await this.offlineStore.encolarAccionParaSincronizar(url, metodo, payload);
          alert('⚠️ Modo Offline: La fecha se sincronizará cuando el servidor esté activo.');
          this.limpiarPanelEdicion();
        }
      });
    } else {
      alert('Por favor complete todos los campos');
    }
  }

  editarFecha() {
    const fecha = this.fechasActuales.find(f => f.id_evaluacion === this.fechaSeleccionadaId);
    if (fecha) {
      this.seleccion.id_fecha_edicion = this.fechaSeleccionadaId;
      this.seleccion.contenido = fecha.contenido;
      this.seleccion.fecha = new Date(fecha.fecha).toISOString().split('T')[0];
      this.seleccion.asignatura = fecha.id_asignatura;
      this.cdr.detectChanges();
    }
  }

  borrarFecha() {
    if (this.fechaSeleccionadaId && confirm('¿Está seguro de eliminar esta evaluación?')) {
      this.nService.borrarEvaluacionDB(this.fechaSeleccionadaId).subscribe(() => {
        this.obtenerFechas();
        this.fechaSeleccionadaId = null;
      });
    }
  }

  seleccionarParaAccion(f: any) { 
    this.fechaSeleccionadaId = (this.fechaSeleccionadaId === f.id_evaluacion) ? null : f.id_evaluacion; 
  }
  
  limpiarPanelEdicion() {
    this.seleccion.id_fecha_edicion = null;
    this.seleccion.contenido = '';
    this.fechaSeleccionadaId = null;
    this.cdr.detectChanges();
  }

  irAConfig() { this.router.navigate(['/configuracion']); }
  toggleMenu(e: Event) { e.stopPropagation(); this.menuOpen = !this.menuOpen; }
  volverDashboard() { this.router.navigate(['/dashboard-docente']); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }
}