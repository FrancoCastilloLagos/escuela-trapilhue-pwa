import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { NotasService } from '../../services/notas.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../header/header.component'; // Importación necesaria
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-rendimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './rendimiento.component.html',
  styleUrls: ['./rendimiento.component.css']
})
export class RendimientoComponent implements OnInit {
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

  mensajeSumativo: string = 'Seleccione asignatura.';
  alertaSumativa: boolean = false;
  mensajeFormativo: string = 'Seleccione asignatura.';
  alertaFormativa: boolean = false;

  chartSumativo: any;
  chartFormativo: any;

  constructor(
    private nService: NotasService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const rol = this.authService.getRol()?.toUpperCase();
    this.esDocente = (rol === 'DOCENTE');

    if (this.esDocente) {
      this.cargarCursos();
    } else {
      const idEst = localStorage.getItem('id_estudiante');
      if (idEst) {
        this.idEstudianteSel = Number(idEst);
        this.cargarAsignaturas();
      }
    }
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
      this.nService.getNotasEstudiante(this.idEstudianteSel, this.idAsignaturaSel)
        .pipe(catchError(() => of([])))
        .subscribe(notas => {
          this.notasActuales = Array.isArray(notas) ? notas : [];
          this.procesarAnalisisYGraficos(this.notasActuales);
          this.cdr.detectChanges();
        });
    }
  }

  procesarAnalisisYGraficos(notas: any[]) {
    const sumativas = notas.filter(n => n.tipo?.toUpperCase() === 'SUMATIVA' || !n.tipo);
    const formativas = notas.filter(n => n.tipo?.toUpperCase() === 'FORMATIVA');

    if (sumativas.length > 0) {
      const promS = sumativas.reduce((a, b) => a + Number(b.valor), 0) / sumativas.length;
      this.alertaSumativa = promS < 4.5; 
      this.mensajeSumativo = `Promedio: ${promS.toFixed(1)}`;
    } else {
      this.mensajeSumativo = "Sin notas.";
    }

    if (formativas.length > 0) {
      const promF = formativas.reduce((a, b) => a + Number(b.valor), 0) / formativas.length;
      this.mensajeFormativo = `Desempeño: ${promF.toFixed(1)}`;
      this.alertaFormativa = promF < 4.0;
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
          label: isSum ? 'Sumativas' : 'Formativas',
          data: datos.map(n => n.valor),
          borderColor: isSum ? '#e67e22' : '#17a2b8',
          backgroundColor: isSum ? 'rgba(230,126,34,0.2)' : 'rgba(23,162,184,0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 1, max: 7 } }
      }
    });

    if (isSum) this.chartSumativo = newChart;
    else this.chartFormativo = newChart;
  }

  limpiarGraficos() {
    if (this.chartSumativo) this.chartSumativo.destroy();
    if (this.chartFormativo) this.chartFormativo.destroy();
    this.notasActuales = [];
    this.cdr.detectChanges();
  }
}