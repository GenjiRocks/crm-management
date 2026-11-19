import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CrmStateService } from '../../core/services/crm-state.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AppIconComponent],
  template: `
    <aside class="w-64 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 select-none">
      
      <!-- Top Branding & Nav List -->
      <div class="p-4 space-y-6">
        
        <!-- App Logo & Tenant Brand -->
        <div class="flex items-center gap-3 px-2 py-1">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black text-lg transition-transform duration-300 hover:rotate-6"
            [style.background-color]="crmState.currentTenant().brandColor">
            {{ crmState.currentTenant().name.substring(0, 1) }}
          </div>
          <div>
            <div class="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{{ crmState.currentTenant().logoText }}</span>
              <span class="text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                SaaS
              </span>
            </div>
            <div class="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
              {{ crmState.currentTenant().domain }}
            </div>
          </div>
        </div>

        <!-- Section: Workspace -->
        <div class="space-y-1">
          <div class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Workspace
          </div>

          <!-- Dashboard -->
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="dashboard" [size]="16"></app-icon>
              <span>Overview</span>
            </div>
          </a>

          <!-- Leads -->
          <a
            routerLink="/leads"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="leads" [size]="16"></app-icon>
              <span>Leads</span>
            </div>
            <div class="flex items-center gap-1">
              @if (hotLeadsCount() > 0) {
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" title="Hot Leads">
                  🔥 {{ hotLeadsCount() }}
                </span>
              }
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                {{ crmState.tenantLeads().length }}
              </span>
            </div>
          </a>

          <!-- Pipeline & Kanban -->
          <a
            routerLink="/pipeline"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="pipeline" [size]="16"></app-icon>
              <span>Deals & Pipeline</span>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
              {{ crmState.tenantDeals().length }}
            </span>
          </a>

          <!-- Customers / Companies -->
          <a
            routerLink="/companies"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="companies" [size]="16"></app-icon>
              <span>Companies</span>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
              {{ crmState.tenantCompanies().length }}
            </span>
          </a>

          <!-- Contacts -->
          <a
            routerLink="/contacts"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="contacts" [size]="16"></app-icon>
              <span>Contacts</span>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
              {{ crmState.tenantContacts().length }}
            </span>
          </a>

          <!-- Tasks & Activities -->
          <a
            routerLink="/tasks"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="activities" [size]="16"></app-icon>
              <span>Tasks & Reminders</span>
            </div>
            @if (pendingTasksCount() > 0) {
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {{ pendingTasksCount() }}
              </span>
            }
          </a>

          <!-- Activity Timeline & Communications -->
          <a
            routerLink="/activities"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="mail" [size]="16"></app-icon>
              <span>Activity Timeline</span>
            </div>
          </a>
        </div>

        <!-- Section: Automation & Analytics -->
        <div class="space-y-1">
          <div class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Intelligence & Scale
          </div>

          <!-- Workflows -->
          <a
            routerLink="/workflows"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="workflows" [size]="16"></app-icon>
              <span>Workflows & Rules</span>
            </div>
            <span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold">
              Auto
            </span>
          </a>

          <!-- Analytics & Forecasting -->
          <a
            routerLink="/analytics"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="analytics" [size]="16"></app-icon>
              <span>Revenue & Forecast</span>
            </div>
          </a>
        </div>

        <!-- Section: Administration -->
        <div class="space-y-1">
          <div class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Configuration
          </div>

          <!-- Settings -->
          <a
            routerLink="/settings"
            routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
            class="nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div class="flex items-center gap-3">
              <app-icon name="settings" [size]="16"></app-icon>
              <span>Tenant & Fields</span>
            </div>
          </a>
        </div>

      </div>

      <!-- Bottom Card: Current Plan & Role indicator -->
      <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <div class="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 dark:border-indigo-800/40">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
            <span class="flex items-center gap-1.5">
              <app-icon name="shield" [size]="14" class="text-indigo-500"></app-icon>
              {{ crmState.currentTenant().subscriptionPlan }} Tier
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              Active
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            Role: <strong class="text-slate-700 dark:text-slate-300">{{ crmState.currentRole() }}</strong>
          </div>
        </div>
      </div>

    </aside>
  `
})
export class SidebarComponent {
  crmState = inject(CrmStateService);

  hotLeadsCount() {
    return this.crmState.tenantLeads().filter(l => l.scoreTier === 'Hot').length;
  }

  pendingTasksCount() {
    return this.crmState.tenantTasks().filter(t => !t.completed).length;
  }
}
