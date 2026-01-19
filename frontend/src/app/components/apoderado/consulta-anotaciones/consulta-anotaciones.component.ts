import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotasService } from '../../../services/notas.service';
import { NotificationsService } from '../../../services/notifications.service';
import { HeaderComponent } from '../../header/header.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consulta-anotaciones',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './consulta-anotaciones.component.html',
  styleUrls: ['./consulta-anotaciones.component.css']
})
export class ConsultaAnotacionesComponent implements OnInit, OnDestroy {
  anotaciones: any[] = [];
  loading: boolean = true;
  private refreshSub?: Subscription;

  constructor(
    private router: Router,
    private notasService: NotasService,
    private notiService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Carga inicial
    this.cargarAnotaciones();

    // 2. Suscripción idéntica a la de consulta-fechas
    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      console.log('Señal de refresco recibida en Anotaciones');
      // Agregamos un pequeño delay de 500ms para asegurar que la DB esté lista
      setTimeout(() => {
        this.cargarAnotaciones();
      }, 500);
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  cargarAnotaciones() {
    // Es vital asegurarse de que estamos usando el ID correcto del almacenamiento
    const idEstudiante = localStorage.getItem('id_estudiante');
    
    if (!idEstudiante) {
      console.warn('No se encontró id_estudiante en el localStorage');
      this.loading = false;
      return;
    }

    this.loading = true;
    this.notasService.getAnotacionesEstudiante(Number(idEstudiante)).subscribe({
      next: (data: any) => { 
        // Forzamos el mapeo para asegurar que los campos existan
        this.anotaciones = (data || []).map((a: any) => ({
          ...a,
          tipo: a.tipo ? a.tipo.toUpperCase() : 'POSITIVA',
          fecha: a.fecha || new Date()
        }));
        
        this.loading = false; 
        this.cdr.detectChanges(); // Forzar renderizado igual que en Fechas
      },
      error: (err) => { 
        console.error('Error al cargar anotaciones:', err);
        this.loading = false; 
        this.cdr.detectChanges(); 
      }
    });
  }
}