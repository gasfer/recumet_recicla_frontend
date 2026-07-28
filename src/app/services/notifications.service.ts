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

  private initSocketConnection() {
    try {
      const socketUrl = base_url.replace('/api/v1', '');
      this.socket = io(socketUrl);
      this.socket.on('new-notification', () => {
        this.getUnreadNotifications().subscribe();
      });
    } catch (err) {
      console.error('Error al conectar Socket.io:', err);
    }
  }

  getUnreadNotifications(): Observable<GetNotificationsResponse> {
    const url = `${base_url}/notifications`;
    return this.http.get<GetNotificationsResponse>(url).pipe(
      tap((resp) => {
        if (resp && resp.ok && resp.notifications) {
          this.notifications.set(resp.notifications);
          const containsDanger = resp.notifications.some(n => n.level === 'DANGER');
          this.hasDangerAlert.set(containsDanger);
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
        } else {
          this.notifications.update(current => current.filter(n => !notificationIds.includes(n.id)));
          this.hasDangerAlert.set(this.notifications().some(n => n.level === 'DANGER'));
        }
      })
    );
  }
}
