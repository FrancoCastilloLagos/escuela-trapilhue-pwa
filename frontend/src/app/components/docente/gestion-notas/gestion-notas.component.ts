import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotasService } from '../../../services/notas.service';
import { OfflineStorageService } from '../../../services/offline-storage.service';

@Component({
  selector: 'app-gestion-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-notas.component.html',
  styleUrls: ['./gestion-notas.component.css']
})
export class GestionNotasComponent implements OnInit {
  userRol: string = ''; 
  userName: string = ''; 
  menuOpen: boolean = false;
  cursos: any[] = []; 
  estudiantes: any[] = []; 
  asignaturas: any[] = []; 
  notasActuales: any[] = [];

  seleccion: any = { 
    asignatura: null, curso: null, estudiante: null, 
    calificacion: null, tipo: 'sumativa', descripcion: '', id_nota_edicion: null 
  };

  notaSeleccionadaId: number | null = null;

  constructor(
    private router: Router, 
    private authService: AuthService, 
    private nService: NotasService, 
    private offlineStore: OfflineStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userRol = (localStorage.getItem('tipo_usuario') || 'DOCENTE').toUpperCase();
    this.userName = localStorage.getItem('rut') || 'Usuario'; 
    this.cargarCursos();
  }

  cargarCursos() {
    this.nService.getCursos().subscribe(data => { 
      this.cursos = data; 
      this.cdr.detectChanges(); 
    });
  }

  onCursoChange() {
    this.asignaturas = []; 
    this.estudiantes = []; 
    this.notasActuales = [];
    this.seleccion.asignatura = null; 
    this.seleccion.estudiante = null;
    if (this.seleccion.curso) {
      const idCurso = Number(this.seleccion.curso);
      this.nService.getAsignaturasPorCurso(idCurso).subscribe(data => this.asignaturas = data);
      this.nService.getEstudiantesPorCurso(idCurso).subscribe(data => { 
        this.estudiantes = data; 
        this.cdr.detectChanges(); 
      });
    }
  }

  obtenerNotas() {
    if (this.seleccion.estudiante && this.seleccion.asignatura) {
      this.nService.getNotasEstudiante(Number(this.seleccion.estudiante), Number(this.seleccion.asignatura)).subscribe({
        next: (data: any) => {
          this.notasActuales = Array.isArray(data) ? data : (data.notas || []);
          this.cdr.detectChanges();
        }
      });
    }
  }

  guardarNota() {
    const { calificacion, estudiante, asignatura, tipo, descripcion, id_nota_edicion } = this.seleccion;
    
    if (calificacion != null && estudiante && asignatura && descripcion) {
      const idEst = Number(estudiante);
      const idAsig = Number(asignatura);
      const nuevaNotaVal = Number(calificacion);

      const payload = { 
        id_estudiante: idEst, 
        id_asignatura: idAsig, 
        valor: nuevaNotaVal, 
        tipo_evaluacion: tipo, 
        descripcion: descripcion
      };

      const url = id_nota_edicion 
        ? `http://localhost:3000/api/notas/notas/${id_nota_edicion}` 
        : 'http://localhost:3000/api/notas/notas';
      
      const metodo = id_nota_edicion ? 'PUT' : 'POST';

      const obs = id_nota_edicion 
        ? this.nService.actualizarNota(id_nota_edicion, payload) 
        : this.nService.guardarNota(payload);

      obs.subscribe({
        next: () => { 
          const sumaTotal = this.notasActuales.reduce((acc, n) => acc + Number(n.valor), 0) + nuevaNotaVal;
          const promedio = sumaTotal / (this.notasActuales.length + 1);

          if (promedio < 4.5) {
            const notifAlerta = { id_estudiante: idEst, id_asignatura: idAsig, tipo: 'alerta_academica' };
            this.nService.guardarNotificacionSQL(notifAlerta).subscribe();
          }

          alert('¡Nota guardada correctamente!'); 
          this.limpiarPanelEdicion(); 
          this.obtenerNotas(); 
        },
        error: async (err) => {
          await this.offlineStore.encolarAccionParaSincronizar(url, metodo, payload);
          alert('⚠️ Servidor no disponible. La nota se guardó localmente y se sincronizará automáticamente.');
          this.limpiarPanelEdicion();
        }
      });
    } else { 
      alert('Por favor complete todos los campos'); 
    }
  }

  limpiarPanelEdicion() {
    this.seleccion.calificacion = null; 
    this.seleccion.descripcion = '';
    this.seleccion.id_nota_edicion = null; 
    this.notaSeleccionadaId = null;
    this.cdr.detectChanges();
  }

  seleccionarParaAccion(nota: any) { 
    this.notaSeleccionadaId = (this.notaSeleccionadaId === nota.id_nota) ? null : nota.id_nota; 
  }
  
  editarNota() {
    const nota = this.notasActuales.find(n => n.id_nota === this.notaSeleccionadaId);
    if (nota) {
      this.seleccion.id_nota_edicion = nota.id_nota;
      this.seleccion.calificacion = nota.valor;
      this.seleccion.descripcion = nota.descripcion || nota.nombre;
      this.seleccion.tipo = nota.tipo_evaluacion || 'sumativa';
      this.cdr.detectChanges();
    }
  }

  borrarNota() {
    if (this.notaSeleccionadaId && confirm('¿Está seguro de eliminar esta calificación?')) {
      this.nService.borrarNota(this.notaSeleccionadaId).subscribe(() => this.obtenerNotas());
    }
  }

  toggleMenu(e: Event) { e.stopPropagation(); this.menuOpen = !this.menuOpen; }
  volverDashboard() { this.router.navigate(['/dashboard-docente']); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }
  irAConfig() { this.router.navigate(['/configuracion']); }
}