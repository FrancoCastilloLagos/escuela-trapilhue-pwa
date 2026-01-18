import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['expectedRole'];
  const userRol = (authService.getRol() || '').toUpperCase(); 

  // 1. Verificación de Inicio de Sesión
  if (!authService.isLoggedIn()) {
    console.warn('Guard: Usuario no autenticado');
    router.navigate(['/login']);
    return false;
  }

  // 2. Verificación de Permisos (Roles)
  if (expectedRole) {
    // Caso A: Si expectedRole es un Arreglo (ej: ['DOCENTE', 'APODERADO'])
    if (Array.isArray(expectedRole)) {
      const tienePermiso = expectedRole.some(role => role.toUpperCase() === userRol);
      if (!tienePermiso) {
        // Se elimina el alert() para evitar el letrero molesto
        redirigirSegunRol(router, userRol);
        return false;
      }
    } 
    // Caso B: Si expectedRole es un String simple (ej: 'DOCENTE')
    else if (typeof expectedRole === 'string') {
      if (userRol !== expectedRole.toUpperCase()) {
        // Se elimina el alert() para evitar el letrero molesto
        redirigirSegunRol(router, userRol);
        return false;
      }
    }
  }

  // Si pasa todas las validaciones
  return true;
};

/**
 * Función auxiliar para redirigir al usuario a su dashboard correspondiente 
 * de forma silenciosa.
 */
function redirigirSegunRol(router: Router, rol: string) {
  if (rol === 'DOCENTE') {
    router.navigate(['/dashboard-docente']);
  } else if (rol === 'APODERADO') {
    router.navigate(['/dashboard-apoderado']);
  } else {
    router.navigate(['/login']);
  }
}