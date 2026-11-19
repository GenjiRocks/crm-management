import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../core/services/crm-state.service';
import { TaskReminder } from '../../core/models/crm.models';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ModalComponent],
  template: `
    <div class="space-y-5 animate-fade-in">
      
      <!-- Top Header & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tasks & Follow-up Reminders</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Action Center
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Never miss an enterprise client touchpoint, contract renewal, or outbound follow-up.
          </p>
        </div>

        <button
          (click)="openCreateModal()"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Schedule Task</span>
        </button>
      </div>

      <!-- Filter pills -->
      <div class="flex items-center gap-2">
        <button
          (click)="filter.set('all')"
          class="px-3 py-1.5 text-xs font-medium rounded-xl border transition"
          [class.bg-indigo-600]="filter() === 'all'"
          [class.text-white]="filter() === 'all'"
          [class.border-indigo-600]="filter() === 'all'"
          [class.border-slate-200]="filter() !== 'all'">
          All Tasks ({{ crmState.tenantTasks().length }})
        </button>
        <button
          (click)="filter.set('pending')"
          class="px-3 py-1.5 text-xs font-medium rounded-xl border transition"
          [class.bg-indigo-600]="filter() === 'pending'"
          [class.text-white]="filter() === 'pending'"
          [class.border-indigo-600]="filter() === 'pending'"
          [class.border-slate-200]="filter() !== 'pending'">
          Pending ({{ pendingCount() }})
        </button>
        <button
          (click)="filter.set('completed')"
          class="px-3 py-1.5 text-xs font-medium rounded-xl border transition"
          [class.bg-indigo-600]="filter() === 'completed'"
          [class.text-white]="filter() === 'completed'"
          [class.border-indigo-600]="filter() === 'completed'"
          [class.border-slate-200]="filter() !== 'completed'">
          Completed
        </button>
      </div>

      <!-- Tasks List Card -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        @for (task of filteredTasks(); track task.id) {
          <div class="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
            
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <input
                type="checkbox"
                [checked]="task.completed"
                (change)="crmState.toggleTaskCompleted(task.id)"
                class="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer">

              <div>
                <div class="text-xs font-bold text-slate-900 dark:text-white" [class.line-through]="task.completed" [class.text-slate-400]="task.completed">
                  {{ task.title }}
                </div>
                <div class="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                  <span class="flex items-center gap-1">
                    <app-icon name="calendar" [size]="12"></app-icon>
                    Due: {{ task.dueDate }} {{ task.dueTime }}
                  </span>
                  <span>•</span>
                  <span>Related to: <strong class="text-slate-700 dark:text-slate-300">{{ task.relatedName }}</strong></span>
                  <span>•</span>
                  <span>Assigned: {{ crmState.getUserName(task.assignedTo) }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                [ngClass]="{
                  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': task.priority === 'Urgent',
                  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300': task.priority === 'High',
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': task.priority === 'Medium' || task.priority === 'Low'
                }">
                {{ task.priority }}
              </span>

              <button
                type="button"
                (click)="crmState.deleteTask(task.id)"
                class="p-1 text-slate-400 hover:text-rose-600 rounded">
                <app-icon name="trash" [size]="14"></app-icon>
              </button>
            </div>

          </div>
        }

        @if (filteredTasks().length === 0) {
          <div class="p-8 text-center text-xs text-slate-400">
            No tasks found in this view.
          </div>
        }
      </div>

      <!-- MODAL: Schedule Task -->
      <app-modal
        [isOpen]="isCreateModalOpen"
        title="Schedule Follow-up Task"
        subtitle="Set an action item or reminder for yourself or a sales representative"
        icon="activities"
        badge="Task Center"
        maxWidth="680px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitTask()" class="flex-1 flex flex-col min-h-0 overflow-hidden">

          <!-- Middle Scrollable Section (Between Top Header & Bottom Footer) -->
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1 space-y-4">

            <!-- 1. Live Task Notification Preview Card -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-slate-50/80 to-indigo-50/60 dark:from-amber-950/30 dark:via-slate-900/60 dark:to-indigo-950/30 border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
            <div class="flex items-center justify-between gap-3 mb-2.5">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center text-white shadow-md transition-all"
                  [ngClass]="{
                    'bg-gradient-to-br from-rose-600 to-red-600 shadow-rose-500/25': priority === 'Urgent',
                    'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25': priority === 'High',
                    'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/25': priority === 'Medium',
                    'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-500/25': priority === 'Low'
                  }">
                  <app-icon name="check" [size]="18"></app-icon>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {{ title.trim() || 'Scheduled Follow-up Action' }}
                    </h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      [ngClass]="{
                        'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200': priority === 'Urgent',
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200': priority === 'High',
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200': priority === 'Medium',
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200': priority === 'Low'
                      }">
                      {{ priority }} Priority
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ⏰ Target: {{ dueDate || 'Today' }} at {{ dueTime || '14:00' }} • Assigned to {{ getAssignedRepName() }}
                  </p>
                </div>
              </div>

              <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hidden sm:flex items-center gap-1 shadow-2xs">
                <span>🔔 In-app Alert</span>
              </span>
            </div>

            <!-- Mini Quick Chips -->
            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/30 text-center">
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                📅 {{ dueDate || 'Select Date' }}
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                ⚡ {{ getSelectedDealTitle() }}
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold truncate">
                👤 {{ getAssignedRepName().split(' ')[0] }}
              </div>
            </div>
          </div>

          <!-- Quick Templates Bar -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Quick Action Presets
            </span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                (click)="setQuickTitle('Client Discovery & Architecture Sync')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200/80 transition active:scale-95">
                📞 Discovery Call
              </button>
              <button
                type="button"
                (click)="setQuickTitle('Follow-up on Security Redlines with Legal')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200/80 transition active:scale-95">
                📑 Security Redlines
              </button>
              <button
                type="button"
                (click)="setQuickTitle('Deliver Custom Product Demo & Technical Q&A')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200/80 transition active:scale-95">
                💻 Demo & Q&A
              </button>
              <button
                type="button"
                (click)="setQuickTitle('Finalize Contract & Executive Sign-off')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200/80 transition active:scale-95">
                ✍️ Contract Sign-off
              </button>
            </div>
          </div>

          <!-- 2. Form Inputs Section -->
          <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <app-icon name="check" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Task Scope & Timeline</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <!-- Task Title -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Task Description / Objective <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="check" [size]="14"></app-icon>
                </span>
                <input
                  type="text"
                  [(ngModel)]="title"
                  name="title"
                  required
                  placeholder="e.g. Follow-up on Security Redlines with Legal"
                  class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
              </div>
            </div>

            <!-- Linked Opportunity / Account -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Associated Sales Opportunity / Account
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="briefcase" [size]="14"></app-icon>
                </span>
                <select
                  [(ngModel)]="relatedDealId"
                  name="relatedDeal"
                  class="w-full appearance-none pl-10 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs">
                  <option value="">-- General Account Task --</option>
                  @for (deal of crmState.tenantDeals(); track deal.id) {
                    <option [value]="deal.id">{{ deal.title }} ({{ deal.companyName }}) - \${{ deal.value }}</option>
                  }
                </select>
                <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="chevron-down" [size]="13"></app-icon>
                </span>
              </div>
            </div>

            <!-- Due Date & Time -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="calendar" [size]="14"></app-icon>
                  </span>
                  <input
                    type="date"
                    [(ngModel)]="dueDate"
                    name="date"
                    required
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Time</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="clock" [size]="14"></app-icon>
                  </span>
                  <input
                    type="time"
                    [(ngModel)]="dueTime"
                    name="time"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            </div>

            <!-- Priority & Assignee -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Urgency Priority</label>
                <div class="relative">
                  <select
                    [(ngModel)]="priority"
                    name="priority"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="Urgent">🔥 Urgent Priority (Immediate)</option>
                    <option value="High">⚡ High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Representative</label>
                <div class="relative">
                  <select
                    [(ngModel)]="assignedTo"
                    name="assignedTo"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    @for (u of crmState.users(); track u.id) {
                      <option [value]="u.id">{{ u.name }} ({{ u.role }})</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>
            </div>
          </div>

          </div>

          <!-- FIXED PINNED BOTTOM SECTION (Always visible, never scrolled) -->
          <div class="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <app-icon name="bell" [size]="13" class="text-indigo-500"></app-icon>
              <span>Automated alert & email simulation triggered on due time</span>
            </span>
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                (click)="isCreateModalOpen = false"
                class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Save Reminder</span>
              </button>
            </div>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class TasksComponent {
  crmState = inject(CrmStateService);

  filter = signal<'all' | 'pending' | 'completed'>('all');
  isCreateModalOpen = false;

  title = '';
  dueDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
  dueTime = '11:00';
  priority: TaskReminder['priority'] = 'High';
  assignedTo = 'usr-1';
  relatedDealId = '';

  getAssignedRepName(): string {
    const u = this.crmState.users().find(x => x.id === (this.assignedTo || this.crmState.currentUserId()));
    return u ? u.name : 'Jessica Miller';
  }

  getSelectedDealTitle(): string {
    const deal = this.crmState.tenantDeals().find(d => d.id === this.relatedDealId);
    return deal ? deal.title : 'General Account Task';
  }

  setQuickTitle(preset: string) {
    this.title = preset;
  }

  pendingCount = computed(() => {
    return this.crmState.tenantTasks().filter(t => !t.completed).length;
  });

  filteredTasks = computed(() => {
    const list = this.crmState.tenantTasks();
    const f = this.filter();
    if (f === 'pending') return list.filter(t => !t.completed);
    if (f === 'completed') return list.filter(t => t.completed);
    return list;
  });

  openCreateModal() {
    this.title = '';
    this.dueDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    this.dueTime = '11:00';
    this.priority = 'High';
    this.assignedTo = this.crmState.currentUserId();
    this.relatedDealId = this.crmState.tenantDeals()[0]?.id || '';
    this.isCreateModalOpen = true;
  }

  submitTask() {
    if (!this.title) return;

    const deal = this.crmState.tenantDeals().find(d => d.id === this.relatedDealId);

    this.crmState.createTask({
      title: this.title,
      dueDate: this.dueDate,
      dueTime: this.dueTime,
      priority: this.priority,
      assignedTo: this.assignedTo || this.crmState.currentUserId(),
      relatedType: deal ? 'deal' : 'company',
      relatedId: deal ? deal.id : 'gen-1',
      relatedName: deal ? `${deal.title} (${deal.companyName})` : 'General Task'
    });

    this.isCreateModalOpen = false;
  }
}
