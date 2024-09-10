import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ErrorLogsService {

  private router = inject(Router);

  logDeErrores(e: any): void {
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
    } else if ( e.status === 0) {
      Swal.fire({
        title: 'Oops...',
        text: 'Ocurrió un imprevisto presiona F5 | Revisa tu conexión a internet',
        icon: 'warning',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      });
    } else if ( e.status === 400 || e.status === 404){
      Swal.fire({
        title: 'Error!',
        text: 'Error dato no encontrado | pagina y/o servicio no existente',
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
        title: 'Oops...',
        text: 'Ocurrió un imprevisto presiona F5',
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
