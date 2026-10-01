import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import Swal from 'sweetalert2';
import { AssignShift } from 'src/app/auth/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class SessionManagementService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  // Inactividad: 15 minutos (900s), advertencia a los 14 minutos (60s restantes)
  private idleTimeLimitMs = 15 * 60 * 1000;
  private warningThresholdMs = 60 * 1000;
  private checkIntervalMs = 1000;

  private lastActivityTimestamp = Date.now();
  private isWarningActive = false;
  private isMonitoring = false;

  private intervalId: any = null;
  private shiftCheckIntervalId: any = null;
  private cleanupListeners: (() => void)[] = [];

  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastActivityTimestamp = Date.now();
    this.isWarningActive = false;

    this.setupActivityListeners();
    this.startInactivityLoop();
    this.startShiftVerificationLoop();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.isWarningActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.shiftCheckIntervalId) {
      clearInterval(this.shiftCheckIntervalId);
      this.shiftCheckIntervalId = null;
    }
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
  }

  private setupActivityListeners(): void {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    this.ngZone.runOutsideAngular(() => {
      const onUserAction = () => {
        if (!this.isWarningActive) {
          this.lastActivityTimestamp = Date.now();
        }
      };

      events.forEach(eventName => {
        window.addEventListener(eventName, onUserAction, { passive: true });
        this.cleanupListeners.push(() => window.removeEventListener(eventName, onUserAction));
      });
    });
  }

  private startInactivityLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        if (!this.authService.token) {
          this.stopMonitoring();
          return;
        }

        const now = Date.now();
        const elapsed = now - this.lastActivityTimestamp;
        const timeRemaining = this.idleTimeLimitMs - elapsed;

        if (timeRemaining <= 0) {
          this.handleInactivityTimeout();
        } else if (timeRemaining <= this.warningThresholdMs && !this.isWarningActive) {
          this.showInactivityWarning();
        }
      }, this.checkIntervalMs);
    });
  }

  private showInactivityWarning(): void {
    this.isWarningActive = true;
    this.ngZone.run(() => {
      let timerInterval: any;
      Swal.fire({
        title: '¿Sigues ahí?',
        html: 'Tu sesión se cerrará automáticamente por inactividad en <b>60</b> segundos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="bx bx-check"></i> Mantener sesión activa',
        cancelButtonText: '<i class="bx bx-log-out"></i> Cerrar sesión ahora',
        confirmButtonColor: '#34c38f',
        cancelButtonColor: '#f46a6a',
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: this.warningThresholdMs,
        timerProgressBar: true,
        didOpen: () => {
          const content = Swal.getHtmlContainer();
          const b = content ? content.querySelector('b') : null;
          timerInterval = setInterval(() => {
            const timerLeft = Swal.getTimerLeft();
            if (b && timerLeft !== undefined) {
              b.textContent = `${Math.ceil(timerLeft / 1000)}`;
            }
          }, 1000);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.lastActivityTimestamp = Date.now();
          this.isWarningActive = false;
        } else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
          this.logoutUser('Sesión cerrada por el usuario.');
        } else if (result.isDismissed && result.dismiss === Swal.DismissReason.timer) {
          this.logoutUser('Tu sesión ha expirado por inactividad.');
        }
      });
    });
  }

  private handleInactivityTimeout(): void {
    if (Swal.isVisible()) {
      Swal.close();
    }
    this.logoutUser('Tu sesión ha expirado por inactividad.');
  }

  private startShiftVerificationLoop(): void {
    // Verificar cada 60 segundos
    this.shiftCheckIntervalId = setInterval(() => {
      if (!this.authService.token) return;
      const user = this.authService.getUser;
      if (!user?.id || user.role === 'ADMINISTRADOR' || user.role === 'DESARROLLADOR') return;

      if (user.assign_shift && user.assign_shift.length > 0) {
        const isShiftActive = this.isWithinShift(user.assign_shift);
        if (!isShiftActive) {
          this.handleShiftExpiration();
        }
      }
    }, 60 * 1000);
  }

  isWithinShift(shifts: AssignShift[]): boolean {
    if (!shifts || shifts.length === 0) return true;
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ...
    const todayShift = shifts.find(s => s.id !== undefined && s.number_day === currentDay && s.status !== false);

    if (!todayShift) return false;

    const [startH, startM] = todayShift.hour_start.split(':').map(Number);
    const [endH, endM] = todayShift.hour_end.split(':').map(Number);

    const startTime = new Date(now);
    startTime.setHours(startH, startM, 0, 0);

    const endTime = new Date(now);
    endTime.setHours(endH, endM, 59, 999);

    return now >= startTime && now <= endTime;
  }

  private handleShiftExpiration(): void {
    this.stopMonitoring();
    if (Swal.isVisible()) {
      Swal.close();
    }
    this.ngZone.run(() => {
      Swal.fire({
        title: 'Horario de Turno Finalizado',
        text: 'Tu turno de trabajo asignado ha concluido. El sistema cerrará tu sesión por seguridad.',
        icon: 'info',
        confirmButtonColor: '#556ee6',
        confirmButtonText: 'Entendido'
      }).then(() => {
        this.authService.logout();
      });
    });
  }

  private logoutUser(message: string): void {
    this.stopMonitoring();
    this.ngZone.run(() => {
      this.authService.logout();
      Swal.fire({
        title: 'Sesión Finalizada',
        text: message,
        icon: 'info',
        confirmButtonColor: '#556ee6',
        confirmButtonText: 'Aceptar'
      });
    });
  }
}
