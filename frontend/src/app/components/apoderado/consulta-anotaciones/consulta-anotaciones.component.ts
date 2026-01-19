import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotasService } from '../../../services/notas.service';
import { NotificationsService } from '../../../services/notifications.service';
import { HeaderComponent } from '../../header/header.component'; // Asegúrate que la ruta sea correcta
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consulta-anotaciones',
  standalone: true,
  imports: [CommonModule, HeaderComponent], // Importación vital
  templateUrl: './consulta-anotaciones.component.html',
  styleUrls: ['./consulta-anotaciones.component.css']
})
export class ConsultaAnotacionesComponent implements OnInit, OnDestroy {
  anotaciones: any[] = [];
  loading: boolean = true;
  private refreshSub?: Subscription;

  constructor(
    private notasService: NotasService,
    private notiService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarAnotaciones();

    // Esta es la parte que "escucha" al docente en tiempo real
    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      console.log('Refrescando anotaciones por nueva notificación...');
      this.cargarAnotaciones();
    });
  }

  ngOnDestroy(): void {
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
}