import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../core/services/crm-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { UserRole } from '../../core/models/crm.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, TimeAgoPipe],
  template: `
    <header class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      
      <!-- Left: Mobile Menu Toggle & Tenant Switcher -->
      <div class="flex items-center gap-3">
        <!-- Tenant Switcher Dropdown -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleTenantMenu()"
            class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 transition shadow-sm text-xs font-medium">
            <span class="w-2.5 h-2.5 rounded-full" [style.background-color]="crmState.currentTenant().brandColor"></span>
            <span class="font-semibold">{{ crmState.currentTenant().name }}</span>
            <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
              {{ crmState.currentTenant().currencyCode }}
            </span>
            <app-icon name="chevron-down" [size]="14"></app-icon>
          </button>

          <!-- Tenant Dropdown Menu -->
          @if (isTenantMenuOpen) {
            <div class="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-dropdown">
              <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Multi-Tenant Organizations
              </div>
              <div class="space-y-1 mt-1">
                @for (tenant of crmState.tenants(); track tenant.id) {
                  <button
                    type="button"
                    (click)="selectTenant(tenant.id)"
                    class="w-full text-left p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs"
                    [ngClass]="{'bg-indigo-50 dark:bg-indigo-950': tenant.id === crmState.currentTenantId()}">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm" [style.background-color]="tenant.brandColor">
                        {{ tenant.name.substring(0, 2) }}
                      </div>
                      <div>
                        <div class="font-medium text-slate-900 dark:text-white">{{ tenant.name }}</div>
                        <div class="text-[11px] text-slate-500">{{ tenant.industry }}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {{ tenant.currency }} {{ tenant.currencyCode }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Breadcrumb / Active Tenant Plan Badge -->
        <div class="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span>/</span>
          <span class="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200/50 dark:border-emerald-800/40">
            {{ crmState.currentTenant().subscriptionPlan }}
          </span>
        </div>
      </div>

      <!-- Center: Global Search Bar -->
      <div class="flex-1 max-w-md hidden lg:block">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <app-icon name="search" [size]="16"></app-icon>
          </span>
          <input
            type="text"
            [ngModel]="crmState.searchQuery()"
            (ngModelChange)="crmState.searchQuery.set($event)"
            placeholder="Search deals, contacts, leads, companies (Ctrl + K)..."
            class="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition">
        </div>
      </div>

      <!-- Right: Action Buttons, Notification Bell, User & Role Switcher -->
      <div class="flex items-center gap-3">

        <!-- Quick Compose Email Simulation Button -->
        <button
          type="button"
          (click)="openEmailComposer.emit()"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition shadow-sm">
          <app-icon name="mail" [size]="14"></app-icon>
          <span>Quick Email</span>
        </button>

        <!-- New Deal Button -->
        <button
          type="button"
          (click)="openNewDealModal.emit()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-500/20 transition active:scale-95">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>New Deal</span>
        </button>

        <!-- Notifications Bell -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleNotifications()"
            class="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <app-icon name="bell" [size]="18"></app-icon>
            @if (notificationService.unreadCount() > 0) {
              <span class="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {{ notificationService.unreadCount() }}
              </span>
            }
          </button>

          <!-- Notifications Drawer / Panel -->
          @if (isNotificationsOpen) {
            <div class="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 animate-dropdown">
              <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifications & Activity
                  </h4>
                  <p class="text-[10px] text-slate-500">Automated workflows & simulated emails</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="notificationService.markAllAsRead()"
                    class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                    Mark all read
                  </button>
                </div>
              </div>

              <!-- Notification list -->
              <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                @if (notificationService.notifications().length === 0) {
                  <div class="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                }
                @for (item of notificationService.notifications(); track item.id) {
                  <div
                    class="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-start gap-3"
                    [ngClass]="{'bg-indigo-50/50 dark:bg-indigo-950/20': !item.read}">
                    <div
                      class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      [ngClass]="{
                        'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400': item.type === 'email',
                        'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400': item.type === 'deal',
                        'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400': item.type === 'lead',
                        'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400': item.type === 'workflow',
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400': item.type === 'task'
                      }">
                      <app-icon [name]="getNotificationIcon(item.type)" [size]="14"></app-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {{ item.title }}
                        </span>
                        <span class="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                          {{ item.timestamp | timeAgo }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {{ item.message }}
                      </p>
                    </div>
                  </div>
                }
              </div>

              <!-- Footer -->
              <div class="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  (click)="notificationService.clearAll(); isNotificationsOpen = false"
                  class="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  Clear all notifications
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Role & User Profile Switcher -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleUserMenu()"
            class="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <img
              [src]="crmState.currentUser().avatar"
              [alt]="crmState.currentUser().name"
              class="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20">
            <div class="hidden md:block text-left">
              <div class="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {{ crmState.currentUser().name }}
              </div>
              <div class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                {{ crmState.currentUser().role }}
              </div>
            </div>
            <app-icon name="chevron-down" [size]="14" class="text-slate-400"></app-icon>
          </button>

          <!-- User & Role Menu -->
          @if (isUserMenuOpen) {
            <div class="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-dropdown">
              <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div class="text-xs font-bold text-slate-900 dark:text-white">{{ crmState.currentUser().name }}</div>
                <div class="text-[11px] text-slate-500">{{ crmState.currentUser().email }}</div>
              </div>

              <!-- Role Switcher (RBAC Live Demo) -->
              <div class="p-2">
                <div class="text-[10px] uppercase font-bold text-slate-400 mb-1.5 px-1 tracking-wider">
                  Test Role-Based Permissions
                </div>
                <div class="space-y-1">
                  @for (role of availableRoles; track role) {
                    <button
                      type="button"
                      (click)="changeRole(role)"
                      class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      [class.bg-indigo-50]="crmState.currentRole() === role"
                      [class.text-indigo-600]="crmState.currentRole() === role"
                      [class.font-semibold]="crmState.currentRole() === role">
                      <span>{{ role }}</span>
                      @if (crmState.currentRole() === role) {
                        <app-icon name="check" [size]="14"></app-icon>
                      }
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

      </div>
    </header>
  `,
  styles: [`
    @keyframes dropdownFade {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-dropdown {
      animation: dropdownFade 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class NavbarComponent {
  crmState = inject(CrmStateService);
  notificationService = inject(NotificationService);

  @Output() openNewDealModal = new EventEmitter<void>();
  @Output() openEmailComposer = new EventEmitter<void>();

  isTenantMenuOpen = false;
  isNotificationsOpen = false;
  isUserMenuOpen = false;

  availableRoles: UserRole[] = ['Admin', 'Sales Manager', 'Sales Rep', 'Viewer'];

  toggleTenantMenu() {
    this.isTenantMenuOpen = !this.isTenantMenuOpen;
    this.isNotificationsOpen = false;
    this.isUserMenuOpen = false;
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isTenantMenuOpen = false;
    this.isUserMenuOpen = false;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.isTenantMenuOpen = false;
    this.isNotificationsOpen = false;
  }

  selectTenant(id: string) {
    this.crmState.switchTenant(id);
    this.isTenantMenuOpen = false;
  }

  changeRole(role: UserRole) {
    this.crmState.switchUserRole(role);
    this.isUserMenuOpen = false;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'email': return 'mail';
      case 'deal': return 'dollar';
      case 'lead': return 'leads';
      case 'workflow': return 'workflows';
      case 'task': return 'check';
      default: return 'bell';
    }
  }
}
