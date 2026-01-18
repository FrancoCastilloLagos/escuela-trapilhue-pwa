import { Component, OnInit } from '@angular/core'; 
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'escuela-trapilhue-frontend';
  
  // Variable que uso para controlar el estado de conexión
  isOffline: boolean = false;

  constructor(private syncService: SyncService) {
    console.log('🚀 Sistema de Sincronización Trapilhue activado');
  }

  ngOnInit() {
    // Verifico estado inicial
    this.isOffline = !navigator.onLine;

    // Escucha los eventos de conexión
    window.addEventListener('online', () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);
  }
}