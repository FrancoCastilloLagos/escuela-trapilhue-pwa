import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { GestionNotasComponent } from './components/docente/gestion-notas/gestion-notas.component';
import { ConsultaNotasComponent } from './components/apoderado/consulta-notas/consulta-notas.component';
import { GestionAnotacionesComponent } from './components/docente/gestion-anotaciones/gestion-anotaciones.component';
import { ConsultaAnotacionesComponent } from './components/apoderado/consulta-anotaciones/consulta-anotaciones.component';
import { GestionFechasComponent } from './components/docente/gestion-fechas/gestion-fechas.component';
import { ConfiguracionComponent } from './components/configuracion-boton/configuracion.component';
import { ConsultaFechasComponent } from './components/apoderado/consulta-fechas/consulta-fechas.component'; 
import { RendimientoComponent } from './components/rendimiento/rendimiento.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'rendimiento', component: RendimientoComponent },
  { 
    path: 'dashboard-docente', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'DOCENTE' } 
  },
  { 
    path: 'dashboard-apoderado', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'APODERADO' } 
  },
  { 
    path: 'gestion-notas', 
    component: GestionNotasComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'DOCENTE' } 
  },
  { 
    path: 'gestion-anotaciones', 
    component: GestionAnotacionesComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'DOCENTE' } 
  },
  { 
    path: 'consulta-notas', 
    component: ConsultaNotasComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'APODERADO' } 
  },
  { 
    path: 'consulta-anotaciones', 
    component: ConsultaAnotacionesComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'APODERADO' } 
  },
  { 
    path: 'gestion-fechas', 
    component: GestionFechasComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'DOCENTE' } 
  },
  { 
    path: 'consulta-fechas', 
    component: ConsultaFechasComponent, 
    canActivate: [authGuard],
    data: { expectedRole: 'APODERADO' } 
  },
  // Configuración permite a ambos para que puedan configurar su clave
  { 
    path: 'configuracion', 
    component: ConfiguracionComponent, 
    canActivate: [authGuard],
    data: { expectedRole: ['DOCENTE', 'APODERADO'] } 
  },
  { path: '**', redirectTo: 'login' }
];