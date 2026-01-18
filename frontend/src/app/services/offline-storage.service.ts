import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private dbPromise: Promise<IDBPDatabase>;
  private readonly DB_NAME = 'TrapilhueOfflineDB';
  private readonly VERSION = 1;

  constructor() {
    this.dbPromise = this.initDatabase();
  }

  private async initDatabase() {
    return openDB(this.DB_NAME, this.VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache_notas')) {
          db.createObjectStore('cache_notas', { keyPath: 'id_unico' });
        }
        if (!db.objectStoreNames.contains('cola_sincronizacion')) {
          db.createObjectStore('cola_sincronizacion', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }

  async guardarNotasCache(notas: any[], idAsignatura: number) {
    const db = await this.dbPromise;
    const tx = db.transaction('cache_notas', 'readwrite');
    await tx.store.put({ id_unico: `asignatura_${idAsignatura}`, datos: notas, fecha: new Date() });
    return tx.done;
  }

  async obtenerNotasCache(idAsignatura: number) {
    const db = await this.dbPromise;
    return db.get('cache_notas', `asignatura_${idAsignatura}`);
  }

  async encolarAccionParaSincronizar(url: string, metodo: string, cuerpo: any) {
    const db = await this.dbPromise;
    return db.add('cola_sincronizacion', {
      url: url,
      metodo: metodo,
      body: cuerpo,
      timestamp: new Date()
    });
  }

  async obtenerAccionesPendientes() {
    const db = await this.dbPromise;
    return db.getAll('cola_sincronizacion');
  }

  async eliminarAccionSincronizada(id: number) {
    const db = await this.dbPromise;
    return db.delete('cola_sincronizacion', id);
  }
}