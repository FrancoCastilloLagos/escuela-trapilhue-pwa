import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { NotasService } from '../../services/notas.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../header/header.component'; // Importamos el componente real
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-rendimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent], // Inyectamos el HeaderComponent
  templateUrl: './rendimiento.component.html',
  styleUrls: ['./rendimiento.component.css']
})
export class RendimientoComponent implements OnInit, OnDestroy {
  @ViewChild('sumativasChart', { static: false }) sumativasCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('formativasChart', { static: false }) formativasCanvas!: ElementRef<HTMLCanvasElement>;
  
  esDocente: boolean = false;
  cursos: any[] = [];
  estudiantes: any[] = [];
  asignaturas: any[] = [];
  notasActuales: any[] = []; 
  
  idCursoSel: number | null = null;
  idEstudianteSel: number | null = null;
  idAsignaturaSel: number | null = null;
  nombreEstudianteVisual: string = '';

  mensajeSumativo: string = 'Seleccione asignatura.';
  alertaSumativa: boolean = false;
  mensajeFormativo: string = 'Seleccione asignatura.';
  alertaFormativa: boolean = false;
  cantidadAnotaciones: number = 0;

  chartSumativo: any;
  chartFormativo: any;

  constructor(
    private nService: NotasService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const rawRol = this.authService.getRol() || 'APODERADO';
    this.esDocente = rawRol.toUpperCase() === 'DOCENTE';

    if (this.esDocente) {
      this.cargarCursos();
    } else {
      const idEst = localStorage.getItem('id_estudiante');
      if (idEst) {
        this.idEstudianteSel = Number(idEst);
        this.nombreEstudianteVisual = "MI PUPILO";
        this.cargarAsignaturas();
      }
    }
  }

  ngOnDestroy(): void {
    this.limpiarGraficos();
  }

  cargarCursos() {
    this.nService.getCursos().subscribe(data => { 
      this.cursos = data; 
      this.cdr.detectChanges(); 
    });
  }

  onCursoChange() {
    this.estudiantes = []; 
    this.idEstudianteSel = null; 
    this.idAsignaturaSel = null;
    this.limpiarGraficos();
    if (this.idCursoSel) {
      this.nService.getEstudiantesPorCurso(this.idCursoSel).subscribe(data => {
        this.estudiantes = data; 
        this.cdr.detectChanges();
      });
    }
  }

  onEstudianteChange() {
    this.asignaturas = []; 
    this.idAsignaturaSel = null;
    this.limpiarGraficos();
    if (this.idEstudianteSel) {
      const est = this.estudiantes.find(e => e.id_estudiante === this.idEstudianteSel);
      this.nombreEstudianteVisual = est ? est.nombre_completo : 'Estudiante';
      this.cargarAsignaturas();
    }
  }

  cargarAsignaturas() {
    this.nService.getAsignaturasPorEstudiante(this.idEstudianteSel!).subscribe(data => {
      this.asignaturas = data; 
      this.cdr.detectChanges();
    });
  }

  obtenerDatosGrafico() {
    if (this.idEstudianteSel && this.idAsignaturaSel) {
      forkJoin({
        notas: this.nService.getNotasEstudiante(this.idEstudianteSel, this.idAsignaturaSel).pipe(catchError(() => of([]))),
        anotaciones: this.nService.getConteoAnotaciones(this.idEstudianteSel).pipe(catchError(() => of({ total: 0 })))
      }).subscribe({
        next: (res) => {
          this.notasActuales = Array.isArray(res.notas) ? res.notas : [];
          this.cantidadAnotaciones = res.anotaciones?.total || 0;
          this.procesarAnalisisYGraficos(this.notasActuales);
          this.cdr.detectChanges();
        }
      });
    }
  }

  procesarAnalisisYGraficos(notas: any[]) {
    const sumativas = notas.filter(n => n.tipo?.toUpperCase() === 'SUMATIVA' || !n.tipo);
    const formativas = notas.filter(n => n.tipo?.toUpperCase() === 'FORMATIVA');
    const asignaturaObj = this.asignaturas.find(a => a.id_asignatura === this.idAsignaturaSel);
    const nombreAsig = asignaturaObj ? asignaturaObj.nombre.toUpperCase() : 'ASIGNATURA';

    if (sumativas.length > 0) {
      const promS = sumativas.reduce((a, b) => a + Number(b.valor), 0) / sumativas.length;
      let tendenciaDescendente = false;
      if (sumativas.length >= 2) {
        const ultima = Number(sumativas[sumativas.length - 1].valor);
        const penultima = Number(sumativas[sumativas.length - 2].valor);
        if (ultima < penultima) tendenciaDescendente = true;
      }
      this.alertaSumativa = (promS < 4.0) || (promS < 4.5 && (this.cantidadAnotaciones > 0 || tendenciaDescendente));
      this.mensajeSumativo = this.alertaSumativa ? `RIESGO DETECTADO EN ${nombreAsig}.` : `Promedio sumativo: ${promS.toFixed(1)}`;
    } else {
      this.mensajeSumativo = "Sin notas registradas.";
    }

    if (formativas.length > 0) {
      const promF = formativas.reduce((a, b) => a + Number(b.valor), 0) / formativas.length;
      this.mensajeFormativo = `Desempeño formativo: ${promF.toFixed(1)}`;
      this.alertaFormativa = promF < 4.0;
    } else {
      this.mensajeFormativo = "Sin evaluaciones formativas.";
      this.alertaFormativa = false;
    }

    setTimeout(() => {
      this.renderChart('sumativo', sumativas);
      this.renderChart('formativo', formativas);
    }, 200);
  }

  renderChart(tipo: 'sumativo' | 'formativo', datos: any[]) {
    const isSum = tipo === 'sumativo';
    const canvasElement = isSum ? this.sumativasCanvas?.nativeElement : this.formativasCanvas?.nativeElement;
    if (!canvasElement) return;
    if (isSum && this.chartSumativo) this.chartSumativo.destroy();
    if (!isSum && this.chartFormativo) this.chartFormativo.destroy();
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datos.map((_, i) => (isSum ? `S${i+1}` : `F${i+1}`)),
        datasets: [{
          label: isSum ? 'Sumativas' : 'Formativa',
          data: datos.map(n => n.valor),
          borderColor: isSum ? '#e67e22' : '#17a2b8',
          backgroundColor: isSum ? 'rgba(230,126,34,0.2)' : 'rgba(23,162,184,0.2)',
          fill: true, tension: 0.4, pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { min: 1, max: 7 } },
        plugins: { legend: { display: false } }
      }
    });
    if (isSum) this.chartSumativo = newChart; else this.chartFormativo = newChart;
    this.cdr.detectChanges();
  }

  limpiarGraficos() {
    if (this.chartSumativo) this.chartSumativo.destroy();
    if (this.chartFormativo) this.chartFormativo.destroy();
    this.chartSumativo = null; 
    this.chartFormativo = null;
    this.notasActuales = []; 
    this.alertaSumativa = false;
    this.mensajeSumativo = 'Seleccione asignatura.'; 
    this.mensajeFormativo = 'Seleccione asignatura.';
    this.cdr.detectChanges();
  }
}