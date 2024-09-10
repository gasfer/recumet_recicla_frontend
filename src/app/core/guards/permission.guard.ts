import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';


export const permissionGuard: CanActivateChildFn = (childRoute, state) => {
  const validatorsService = inject(ValidatorsService);
  const authService       = inject(AuthService);
  const name              = childRoute.data['name'];
  const action            = childRoute.data['action'];
  if(!name || name === 'INIT') { return true; }
  const isValid = validatorsService.withPermission(name,action ?? 'view');
  if(!isValid) {
    Swal.fire('SIN ACCESO', 'No tienes acceso a este modulo', 'warning');
    authService.logout();
  }
  return isValid;
};

// public tituloSubs$! : Subscription;
//   public breadcrumbs:any = [];

  