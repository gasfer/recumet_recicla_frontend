import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { PermissionAction } from '../constants/application-navigation.constants';
import { permissionActionLabel, permissionModuleLabel } from '../constants/permission-presentation.constants';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';


export const permissionGuard: CanActivateChildFn = (childRoute, state) => {
  const validatorsService = inject(ValidatorsService);
  const router            = inject(Router);
  const name              = childRoute.data['name'];
  const action            = (childRoute.data['action'] ?? 'view') as PermissionAction;
  if(!name || name === 'INIT') { return true; }
  const isValid = validatorsService.withPermission(name, action);
  if(!isValid) {
    Swal.fire({
      title: 'Sin permiso',
      text: `No tiene permiso para ${permissionActionLabel(action).toLocaleLowerCase('es')} ${permissionModuleLabel(name)}. Comuníquese con soporte para solicitar la habilitación.`,
      icon: 'warning',
    });
    return router.parseUrl('/dashboard/home');
  }
  return true;
};

// public tituloSubs$! : Subscription;
//   public breadcrumbs:any = [];

  
