import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <!-- Backdrop with smooth dark blur -->
        <div
          class="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-300"
          (click)="closeModal()"></div>

        <!-- Modal Dialog Window -->
        <div
          class="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full z-10 overflow-hidden transform transition-all duration-300 animate-modal-in my-auto flex flex-col max-h-[90vh]"
          [style.max-width]="maxWidth">

          <!-- Top Gradient Accent Ribbon -->
          <div class="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
            <div class="flex items-center gap-3">
              @if (icon) {
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/15 dark:from-indigo-950/50 dark:to-purple-950/50 border border-indigo-200/60 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <app-icon [name]="icon" [size]="20"></app-icon>
                </div>
              }
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">{{ title }}</h3>
                  @if (badge) {
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                      {{ badge }}
                    </span>
                  }
                </div>
                @if (subtitle) {
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{{ subtitle }}</p>
                }
              </div>
            </div>

            <button
              type="button"
              (click)="closeModal()"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <!-- Body with custom smooth scrollbar -->
          <div class="p-6 overflow-y-auto flex-1 modal-content-scroll">
            <ng-content></ng-content>
          </div>

          <!-- Optional Footer -->
          @if (hasFooter) {
            <div class="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 shrink-0">
              <ng-content select="[modal-footer]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(12px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-modal-in {
      animation: modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .modal-content-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .modal-content-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .modal-content-scroll::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.3);
      border-radius: 9999px;
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Dialog';
  @Input() subtitle = '';
  @Input() badge = '';
  @Input() icon = '';
  @Input() maxWidth = '620px';
  @Input() hasFooter = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
