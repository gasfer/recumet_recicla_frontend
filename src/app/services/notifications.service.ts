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

  constructor() {
    this.initSocketConnection();
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

  playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Tono percusivo icónico al estilo de Slack ("Knock Brush")
      const slackNotes = [
        { freq: 783.99, start: 0.00, dur: 0.18, vol: 0.35 }, // G5
        { freq: 1046.50, start: 0.10, dur: 1.85, vol: 0.45 }  // C6 con resonancia suave
      ];

      slackNotes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.start);

        const startTime = now + note.start;
        const endTime = startTime + note.dur;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(note.vol, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch (e) {
      console.warn('Error al reproducir audio:', e);
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
