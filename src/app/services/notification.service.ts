import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  push(title: string, message: string, type: AppNotification['type']): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    this._notifications.update(list => [notification, ...list]);
    this.scheduleAutoRemove(notification.id);
  }

  markRead(notificationId: string): void {
    this._notifications.update(list =>
      list.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }

  dismiss(notificationId: string): void {
    this._notifications.update(list => list.filter(n => n.id !== notificationId));
  }

  private scheduleAutoRemove(notificationId: string): void {
    setTimeout(() => this.dismiss(notificationId), 8000);
  }
}
