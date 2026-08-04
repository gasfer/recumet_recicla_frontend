import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { io, Socket } from 'socket.io-client';

export interface AppNotification {
  id: number;
  id_user: number;
  title: string;
  message: string;
  type: string;
  level: string; // 'INFO' | 'DANGER'
  id_reference?: number;
  is_read: boolean;
  createdAt: string;
}

export interface GetNotificationsResponse {
  ok: boolean;
  notifications: AppNotification[];
}

export interface GetNotificationsHistoryResponse {
  ok: boolean;
  notifications: {
    previousPage: number | null;
    currentPage: number;
    nextPage: number | null;
    total: number;
    per_page: number;
    data: AppNotification[];
  };
}

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private socket!: Socket;

  notifications = signal<AppNotification[]>([]);
  hasDangerAlert = signal<boolean>(false);

  private audioCtx?: AudioContext;

  constructor() {
    this.initSocketConnection();
    this.unlockAudio();
  }

  private unlockAudio() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  private getSocketUrl(): string {
    if (!base_url) {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
    if (base_url.startsWith('http://') || base_url.startsWith('https://')) {
      return base_url.replace(/\/api\/v1\/?$/, '');
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  private initSocketConnection() {
    try {
      const socketUrl = this.getSocketUrl();
      if (!socketUrl) return;

      this.socket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });

      this.socket.on('connect_error', (err) => {
        console.warn('Socket.io error de conexión (no crítico):', err.message);
      });

      this.socket.on('new-notification', (data: any) => {
        this.playNotificationSound();
        if (data && data.title) {
          this.showDesktopNotification(data.title, data.message || 'Nueva notificación en el sistema');
        }
        this.getUnreadNotifications().subscribe({
          error: (err) => console.warn('Error al refrescar notificaciones:', err)
        });
      });
    } catch (err) {
      console.warn('Error al inicializar Socket.io:', err);
    }
  }

  requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }

  async playNotificationSound() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Acorde armónico cristalino de 2 segundos (E5, G#5, B5, E6)
      const notes = [
        { freq: 659.25, time: 0.00 }, // E5
        { freq: 830.61, time: 0.12 }, // G#5
        { freq: 987.77, time: 0.24 }, // B5
        { freq: 1318.51, time: 0.36 } // E6
      ];

      const duration = 2.0;

      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        const startTime = now + note.time;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(now + duration);
      });
    } catch (e) {
      console.warn('Error al reproducir audio de notificación:', e);
    }
  }

  showDesktopNotification(title: string, message: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: 'assets/images/logo.png',
        tag: 'recumet-notification'
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  private updateDocumentTitle(unreadCount: number, hasDanger: boolean) {
    if (typeof document === 'undefined') return;
    if (unreadCount > 0) {
      const prefix = hasDanger ? `🚨 (${unreadCount}) ` : `(${unreadCount}) `;
      document.title = `${prefix}Recumet Recicla`;
    } else {
      document.title = 'Recumet Recicla';
    }
  }

  getUnreadNotifications(): Observable<GetNotificationsResponse> {
    const url = `${base_url}/notifications`;
    return this.http.get<GetNotificationsResponse>(url).pipe(
      tap((resp) => {
        if (resp && resp.ok && resp.notifications) {
          this.notifications.set(resp.notifications);
          const unreadCount = resp.notifications.length;
          const containsDanger = resp.notifications.some(n => n.level === 'DANGER');
          this.hasDangerAlert.set(containsDanger);
          this.updateDocumentTitle(unreadCount, containsDanger);
        }
      })
    );
  }

  getNotificationsHistory(page: number = 1, limit: number = 10, query: string = '', level: string = ''): Observable<GetNotificationsHistoryResponse> {
    const params: any = { page, limit };
    if (query) params.query = query;
    if (level) params.level = level;
    const url = `${base_url}/notifications/history`;
    return this.http.get<GetNotificationsHistoryResponse>(url, { params });
  }

  markAsRead(notificationIds: number[] = []): Observable<{ ok: boolean; msg: string }> {
    const url = `${base_url}/notifications/read`;
    return this.http.put<{ ok: boolean; msg: string }>(url, { notificationIds }).pipe(
      tap(() => {
        if (notificationIds.length === 0) {
          this.notifications.set([]);
          this.hasDangerAlert.set(false);
          this.updateDocumentTitle(0, false);
        } else {
          this.notifications.update(current => current.filter(n => !notificationIds.includes(n.id)));
          const remaining = this.notifications();
          const containsDanger = remaining.some(n => n.level === 'DANGER');
          this.hasDangerAlert.set(containsDanger);
          this.updateDocumentTitle(remaining.length, containsDanger);
        }
      })
    );
  }
}
