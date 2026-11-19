import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="toast-container fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-md w-full">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="toast-item pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transform transition-all duration-300 animate-slide-up"
          [ngClass]="{
            'bg-emerald-950/90 text-emerald-100 border-emerald-500/40': toast.type === 'success',
            'bg-slate-900/95 text-slate-100 border-slate-700': toast.type === 'info',
            'bg-indigo-950/95 text-indigo-100 border-indigo-500/50': toast.type === 'email',
            'bg-amber-950/90 text-amber-100 border-amber-500/40': toast.type === 'warning',
            'bg-rose-950/90 text-rose-100 border-rose-500/40': toast.type === 'error'
          }">

          <!-- Icon -->
          <div class="toast-icon mt-0.5 rounded-lg p-2 flex items-center justify-center shrink-0"
            [ngClass]="{
              'bg-emerald-500/20 text-emerald-400': toast.type === 'success',
              'bg-indigo-500/20 text-indigo-400': toast.type === 'email',
              'bg-slate-700/60 text-slate-300': toast.type === 'info',
              'bg-amber-500/20 text-amber-400': toast.type === 'warning',
              'bg-rose-500/20 text-rose-400': toast.type === 'error'
            }">
            <app-icon [name]="getToastIcon(toast.type)" [size]="18"></app-icon>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold tracking-tight">{{ toast.title }}</h4>
              <button
                (click)="notificationService.removeToast(toast.id)"
                class="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded">
                <app-icon name="x" [size]="14"></app-icon>
              </button>
            </div>
            <p class="text-xs text-slate-300/90 mt-0.5 leading-relaxed">{{ toast.message }}</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-slide-up {
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ToastContainerComponent {
  notificationService = inject(NotificationService);

  getToastIcon(type: string): string {
    switch (type) {
      case 'success': return 'check';
      case 'email': return 'mail';
      case 'warning': return 'bell';
      case 'error': return 'x';
      default: return 'bell';
    }
  }
}
