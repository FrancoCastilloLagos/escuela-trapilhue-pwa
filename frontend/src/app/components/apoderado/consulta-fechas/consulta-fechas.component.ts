import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotasService } from '../../../services/notas.service';
import { NotificationsService } from '../../../services/notifications.service';
import { HeaderComponent } from '../../header/header.component';
import { Subscription } from 'rxjs';

// Estructura básica para que las evaluaciones no den errores de tipado.
interface Evaluacion {
  fecha: string; 
  materia: string;
  descripcion: string;
  tipo: string;
}

@Component({
  selector: 'app-consulta-fechas',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './consulta-fechas.component.html',
  styleUrls: ['./consulta-fechas.component.css']
})
export class ConsultaFechasComponent implements OnInit, OnDestroy {
  // Datos que muestro en el perfil y controles para moverme por el calendario.
  studentName: string = '';
  cursoNombre: string = '';
  idCurso: number = 0;
  currentMonth: number = 0; 
  currentYear: number = 2026;

  // Textos fijos para el renderizado del calendario.
  weekDays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  // Aquí guardo la grilla de fechas y las listas de pruebas.
  calendar: (Date | null)[][] = [];
  evaluaciones: Evaluacion[] = [];
  proximasEvaluaciones: Evaluacion[] = [];
  private refreshSub?: Subscription;

  constructor(
    private router: Router, 
    private nService: NotasService, 
    private notiService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  // Al arrancar: recupero info del login, pongo el mes actual y cargo las fechas desde el server.
  ngOnInit() {
    this.studentName = localStorage.getItem('nombre_estudiante') || 'Estudiante';
    this.cursoNombre = localStorage.getItem('nombre_curso') || 'Curso';
    this.idCurso = Number(localStorage.getItem('id_curso')) || 0;
    
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();

    this.generateCalendar();
    this.cargarEvaluaciones();

    // Me quedo escuchando por si alguien guarda una prueba nueva, así refresco la vista al segundo.
    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      console.log('Señal de refresco recibida en Calendario');
      this.cargarEvaluaciones();
    });
  }

  // Si cierro la página, mato la suscripción para que no gaste memoria.
  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  // Traigo las evaluaciones de la API. Si hay curso, filtro solo las de ese grupo.
  cargarEvaluaciones() {
    const peticion = this.idCurso > 0 
      ? this.nService.getEvaluacionesPorCurso(this.idCurso) 
      : this.nService.getEvaluacionesDB();

    peticion.subscribe({
      next: (data: any[]) => {
        // Limpio y formateo los datos que vienen del backend para que el calendario los entienda.
        this.evaluaciones = data.map(e => ({
          fecha: e.fecha ? new Date(e.fecha).toISOString().substring(0, 10) : '',
          materia: e.materia || e.nombre_materia || e.nombre || 'Asignatura',
          descripcion: e.titulo || e.titulo_evaluacion || 'Evaluación',
          tipo: e.tipo_evaluacion || 'sumativa'
        }));
        this.filtrarProximas();
        this.cdr.detectChanges(); // Fuerzo a Angular a pintar los cambios.
      }
    });
  }

  // Cálculo para armar la tabla del mes con sus huecos vacíos al principio y final.
  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    let dayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    let currentDay = 1;
    this.calendar = [];
    for (let i = 0; i < 6; i++) {
      let week: (Date | null)[] = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < dayOffset) || currentDay > lastDay.getDate()) {
          week.push(null);
        } else {
          week.push(new Date(this.currentYear, this.currentMonth, currentDay));
          currentDay++;
        }
      }
      this.calendar.push(week);
      if (currentDay > lastDay.getDate()) break;
    }
  }

  // Chequeo rápido para ponerle un puntito o marca a los días que tienen evaluaciones.
  hasEvent = (date: Date | null): boolean => {
    if (!date) return false;
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return this.evaluaciones.some(e => e.fecha === `${y}-${m}-${d}`);
  }

  // Filtro la lista lateral para mostrar solo lo que toca en el mes que estoy mirando.
  filtrarProximas() {
    const mesBuscado = (this.currentMonth + 1).toString().padStart(2, '0');
    this.proximasEvaluaciones = this.evaluaciones.filter(e => 
      e.fecha.startsWith(`${this.currentYear}-${mesBuscado}`)
    ).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  // Lógica para los botones de atrás/adelante en el calendario.
  changeMonth(delta: number) {
    this.currentMonth += delta;
    if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
    else if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
    this.generateCalendar();
    this.filtrarProximas();
    this.cdr.detectChanges();
  }

  // Comparo con la fecha de hoy para resaltar el número en la vista.
  isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  // Cuando pinchan un día, tiro un alert con el resumen de las evaluaciones de esa fecha.
  selectDate(date: Date | null) {
    if (!date) return;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const dateStr = `${y}-${m}-${d}`;
    const evs = this.evaluaciones.filter(e => e.fecha === dateStr);
    if (evs.length > 0) {
      const lista = evs.map(e => `- ${e.materia}: ${e.descripcion}`).join('\n');
      alert(`Evaluaciones el ${d}/${m}/${y}:\n${lista}`);
    }
  }
}