import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotasService } from '../../../services/notas.service';
import { NotificationsService } from '../../../services/notifications.service';
import { HeaderComponent } from '../../header/header.component';
import { Subscription } from 'rxjs';

interface Nota {
  descripcion: string;
  tipo: string;
  valor: number;
}

@Component({
  selector: 'app-consulta-notas',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './consulta-notas.component.html',
  styleUrls: ['./consulta-notas.component.css']
})
export class ConsultaNotasComponent implements OnInit, OnDestroy {
  // Variables para llenar los selectores y las tablas de la vista.
  asignaturas: any[] = [];
  notasSumativas: Nota[] = [];
  notasFormativas: Nota[] = [];
  idEstudiante: number | null = null;
  idAsignaturaSeleccionada: number | null = null;
  promedioFinal: number = 0;
  
  // Guardo la suscripción para poder limpiarla al cerrar y que no gaste memoria.
  private refreshSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private nService: NotasService,
    private notiService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  // Al iniciar, saco el ID del estudiante del storage y cargo sus materias.
  ngOnInit(): void {
    const idStorage = localStorage.getItem('id_estudiante');
    if (idStorage && idStorage !== 'null') {
      this.idEstudiante = Number(idStorage);
      this.cargarAsignaturas();
    }

    // Me suscribo al canal de refresco. Si hay cambios en el servidor, recargo las notas de la materia actual.
    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      console.log('Señal de refresco recibida en Notas');
      if (this.idAsignaturaSeleccionada) {
        this.onAsignaturaChange();
      }
    });
  }

  // Si el usuario sale de la página, cancelo la escucha de actualizaciones.
  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  // Llamo al servicio para traer las materias en las que el alumno está inscrito.
  cargarAsignaturas(): void {
    if (!this.idEstudiante) return;
    this.nService.getAsignaturasPorEstudiante(this.idEstudiante).subscribe(data => {
      this.asignaturas = data;
      this.cdr.detectChanges(); // Le aviso a la vista que ya llegaron las materias.
    });
  }

  // Cada vez que el usuario cambie de materia en el select, pido las notas nuevas.
  onAsignaturaChange(): void {
    if (!this.idEstudiante || !this.idAsignaturaSeleccionada) return;

    this.nService.getNotasEstudiante(this.idEstudiante, this.idAsignaturaSeleccionada).subscribe({
      next: (data: any[]) => {
        // Mapeo lo que viene de la BD para limpiar nombres y asegurar que el valor sea número.
        const todas = data.map(n => ({
          descripcion: n.descripcion || 'Evaluación',
          tipo: n.tipo || n.tipo_evaluacion || 'Sumativa',
          valor: Number(n.valor)
        }));
        
        // Separo las notas por tipo para mostrarlas en tablas distintas en el HTML.
        this.notasSumativas = todas.filter(n => n.tipo.toLowerCase().includes('sumativa'));
        this.notasFormativas = todas.filter(n => n.tipo.toLowerCase().includes('formativa'));
        
        this.calcularPromedio();
        this.cdr.detectChanges(); // Refresco la pantalla con los nuevos cálculos.
      }
    });
  }

  // Saco el promedio simple solo de las notas que son Sumativas.
  calcularPromedio(): void {
    if (this.notasSumativas.length === 0) { 
      this.promedioFinal = 0; 
      return; 
    }
    const suma = this.notasSumativas.reduce((acc, n) => acc + n.valor, 0);
    this.promedioFinal = suma / this.notasSumativas.length;
  }
}