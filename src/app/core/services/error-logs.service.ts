import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

export const PERMISSION_DENIED_FALLBACK = 'No tiene permiso para realizar esta acción. Comuníquese con soporte para solicitar la habilitación.';

@Injectable({
  providedIn: 'root'
})
export class ErrorLogsService {

  private router = inject(Router);
  private handledErrors = new WeakSet<object>();

  logDeErrores(e: any): void {
    if (e && typeof e === 'object') {
      if (this.handledErrors.has(e)) return;
      this.handledErrors.add(e);
    }

    if(e.status === 422) {
      this.notifications(
        e?.error?.errors[0]?.msg ? e?.error?.errors[0]?.msg : 'Los datos no son validos, Intenta nuevamente',
        'warning','form');
    } else if ( e.status === 401) {
      localStorage.removeItem('token');
      this.router.navigateByUrl('/auth');
      Swal.fire({
        title: 'Tu sesión expiró.',
        text: 'Vuelve a iniciar sesión para continuar',
        icon: 'info',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      });
    } else if (e.status === 403) {
      Swal.fire({
        title: 'Sin permiso',
        text: e?.error?.errors?.[0]?.msg || PERMISSION_DENIED_FALLBACK,
        icon: 'warning',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      });
    } else if ( e.status === 0) {
      Swal.fire({
        title: 'Sin conexión',
        text: 'No fue posible conectar con el servicio. Revise su conexión a internet e inténtelo nuevamente.',
        icon: 'warning',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      });
    } else if ( e.status === 400 || e.status === 404){
      Swal.fire({
        title: 'Solicitud no disponible',
        text: e?.error?.errors?.[0]?.msg || 'No se encontró el dato, la página o el servicio solicitado.',
        icon: 'warning',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      });
    } else if ( e.status >= 500 && e.status <= 599){
      Swal.fire({
        title: 'Error!',
        text: 'Ocurrió un problema interno | Si el problema persiste notifica a soporte',
        icon: 'error',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      });
    } else {
      Swal.fire({
        title: 'No se pudo completar la solicitud',
        text: e?.error?.errors?.[0]?.msg || 'Ocurrió un problema inesperado. Si persiste, comuníquese con soporte.',
        icon: 'error',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      })
    }
  }

  /**
   * A function that displays a toast notification.
   * @param {string} msg - The message you want to display
   * @param {'warning' | 'error' | 'success' | 'info' |'question'} icon
   * @param {string} [target=body] - The target element to display the toast.
   */
  notifications(msg:string, icon: 'warning' | 'error' | 'success' | 'info' |'question', target:string = 'body') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      target: target,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      },
      didClose() {
        Toast.close();
      },
    });
    Toast.fire({
      icon: icon,
      title: msg
    });
  }
}
