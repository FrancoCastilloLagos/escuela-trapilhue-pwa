import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OfflineStorageService } from './offline-storage.service';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  constructor(
    private http: HttpClient,
    private offlineStore: OfflineStorageService
  ) {
    // 1. Escuchar cuando el navegador vuelve a estar ONLINE
    fromEvent(window, 'online').subscribe(() => {
      console.log('🌐 Conexión detectada. Iniciando sincronización de datos pendientes...');
      this.sincronizarAccionesPendientes();
    });

    // 2. Intentar sincronizar al iniciar la app si hay internet
    if (navigator.onLine) {
      this.sincronizarAccionesPendientes();
    }
  }

  /**
   * Recorre la cola de IndexedDB y envía cada petición al servidor.
   * Se usa un enfoque secuencial para mantener la integridad de los datos.
   */
  public async sincronizarAccionesPendientes() {
    const pendientes = await this.offlineStore.obtenerAccionesPendientes();

    if (!pendientes || pendientes.length === 0) {
      console.log('✅ No hay acciones pendientes en la base de datos local.');
      return;
    }

    console.log(`🚀 Se han encontrado ${pendientes.length} acciones para sincronizar.`);

    // Procesamos uno por uno para asegurar el orden (importante en ediciones/borrados)
    for (const accion of pendientes) {
      try {
        await this.enviarAlServidor(accion);
      } catch (error) {
        console.error(`❌ Fallo crítico en la sincronización del registro ${accion.id}:`, error);
        // Si hay un error de red, detenemos el bucle para reintentar más tarde
        if (!navigator.onLine) break;
      }
    }
  }

  /**
   * Ejecuta la petición HTTP guardada y la elimina de la cola si tiene éxito.
   */
  private enviarAlServidor(accion: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Configuramos la petición usando los datos almacenados en IndexedDB
      this.http.request(accion.metodo, accion.url, { body: accion.body }).subscribe({
        next: (res) => {
          console.log(`✅ Sincronización exitosa: [${accion.metodo}] ${accion.url}`);
          // Una vez confirmado por el servidor de Node, lo borramos de IndexedDB
          this.offlineStore.eliminarAccionSincronizada(accion.id)
            .then(() => resolve())
            .catch(err => reject(err));
        },
        error: (err) => {
          // Si el error es 4xx (error de cliente), quizás el dato está mal formado.
          // Si es 5xx o 0 (servidor apagado), lo mantenemos en la cola.
          if (err.status >= 400 && err.status < 500) {
            console.warn(`⚠️ Error de datos (4xx) en ID ${accion.id}. Se mantiene para revisión manual.`);
          } else {
            console.error(`⏳ El servidor no respondió para ID ${accion.id}. Reintentando en la próxima conexión.`);
          }
          reject(err);
        }
      });
    });
  }
}