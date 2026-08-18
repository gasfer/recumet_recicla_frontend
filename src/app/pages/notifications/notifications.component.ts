import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NotificationsService, AppNotification } from 'src/app/services/notifications.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styles: []
})
export class NotificationsComponent implements OnInit {
  private notificationsService = inject(NotificationsService);
  private fb = inject(FormBuilder);

  notifications = signal<AppNotification[]>([]);
  loading = signal<boolean>(false);
  totalRecords = signal<number>(0);
  page = signal<number>(1);
  limit = signal<number>(10);

  filterForm: FormGroup = this.fb.group({
    query: [''],
    level: ['']
  });

  levelOptions = [
    { label: 'Todos los Niveles', value: '' },
    { label: 'ℹ️ Información (INFO)', value: 'INFO' },
    { label: '🚨 Alerta Roja (DANGER)', value: 'DANGER' }
  ];

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(page: number = 1): void {
    this.loading.set(true);
    this.page.set(page);
    const { query, level } = this.filterForm.value;

    this.notificationsService.getNotificationsHistory(page, this.limit(), query, level).subscribe({
      next: (resp) => {
        if (resp && resp.ok) {
          this.notifications.set(resp.notifications.data);
          this.totalRecords.set(resp.notifications.total);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.loadHistory(1);
  }

  onReset(): void {
    this.filterForm.reset({ query: '', level: '' });
    this.loadHistory(1);
  }

  markAsRead(item: AppNotification): void {
    if (item.is_read) return;
    this.notificationsService.markAsRead([item.id]).subscribe({
      next: () => {
        item.is_read = true;
      }
    });
  }

  markAllAsRead(): void {
    const unread = this.notifications().filter(n => !n.is_read).map(n => n.id);
    if (unread.length === 0) {
      Swal.fire('Información', 'No hay notificaciones no leídas en esta página', 'info');
      return;
    }
    this.notificationsService.markAsRead(unread).subscribe({
      next: () => {
        this.loadHistory(this.page());
      }
    });
  }

  onPageChange(event: any): void {
    const newPage = (event.first / event.rows) + 1;
    this.limit.set(event.rows);
    this.loadHistory(newPage);
  }
}
