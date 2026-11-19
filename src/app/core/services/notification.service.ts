import { Injectable, inject, signal } from '@angular/core';
import { AppNotification } from '../models/crm.models';
import { INITIAL_NOTIFICATIONS } from '../mock-data/initial-data';
import { SoundEffectsService } from './sound-effects.service';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'email';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private soundEffects = inject(SoundEffectsService);

  toasts = signal<ToastMessage[]>([]);
  notifications = signal<AppNotification[]>(INITIAL_NOTIFICATIONS);

  unreadCount = signal<number>(
    INITIAL_NOTIFICATIONS.filter(n => !n.read).length
  );

  showToast(type: ToastMessage['type'], title: string, message: string, duration = 4000) {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };
    
    this.toasts.update(current => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  removeToast(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: AppNotification = {
      ...notification,
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.update(current => [newNotif, ...current]);
    this.updateUnreadCount();
  }

  markAsRead(id: string) {
    this.notifications.update(current =>
      current.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.updateUnreadCount();
  }

  markAllAsRead() {
    this.notifications.update(current =>
      current.map(n => ({ ...n, read: true }))
    );
    this.updateUnreadCount();
  }

  clearAll() {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  private updateUnreadCount() {
    this.unreadCount.set(this.notifications().filter(n => !n.read).length);
  }

  /**
   * Mock simulated email dispatch with realistic user feedback
   */
  simulateSendEmail(to: string, subject: string, snippet?: string): Promise<boolean> {
    return new Promise(resolve => {
      this.showToast('info', 'Dispatching Email', `Sending to ${to}...`, 1200);

      setTimeout(() => {
        this.soundEffects.playEmailSentSwoosh();

        this.showToast(
          'email',
          'Email Sent Successfully',
          `"${subject}" has been sent to ${to}. Logged in activity timeline.`,
          5000
        );

        this.addNotification({
          tenantId: 'tenant-acme',
          title: 'Email Sent: ' + subject,
          message: `Email sent to ${to}: ${snippet ? snippet.substring(0, 75) + '...' : 'Delivered.'}`,
          type: 'email'
        });

        resolve(true);
      }, 700);
    });
  }
}
