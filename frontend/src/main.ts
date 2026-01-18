import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Registro del Service Worker para funcionalidad Offline (Elemento 1)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('✅ Service Worker registrado con éxito. Alcance:', reg.scope))
          .catch(err => console.error('❌ Error al registrar el Service Worker:', err));
      });
    }
  })
  .catch((err) => console.error(err));