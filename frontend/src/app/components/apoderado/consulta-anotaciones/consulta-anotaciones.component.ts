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
  // Aquí guardo la lista de anotaciones que traigo de la base de datos.
  anotaciones: any[] = [];
  // Variable para manejar el spinner o mensaje de carga.
  loading: boolean = true;
  // Guardamos la suscripción para poder matarla cuando salgamos de la pantalla.
  private refreshSub?: Subscription;

  constructor(
    private notasService: NotasService,
    private notiService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  // Apenas cargue el componente, traigo los datos y activo el escucha para recargas automáticas.
  ngOnInit() {
    this.cargarAnotaciones();
    this.refreshSub = this.notiService.refreshNeeded$.subscribe(() => {
      console.log('Recargando anotaciones por señal externa');
      this.cargarAnotaciones();
    });
  }

  // Si cerramos el componente, desuscribimos para no dejar procesos colgados.
  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  // Función principal para pedir las anotaciones al backend usando el ID del alumno guardado.
  cargarAnotaciones() {
    const id = localStorage.getItem('id_estudiante');
    if (id) {
      this.notasService.getAnotacionesEstudiante(Number(id)).subscribe({
        next: (data: any) => { 
          // Guardamos lo que llegó, quitamos el loading y refrescamos la vista.
          this.anotaciones = data; 
          this.loading = false; 
          this.cdr.detectChanges(); 
        },
        // Si falla la petición, igual quitamos el loading para que no se quede pegado.
        error: () => { 
          this.loading = false; 
          this.cdr.detectChanges(); 
        }
      });
    }
  }
}