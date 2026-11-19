import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowEngineService } from '../../core/services/workflow-engine.service';
import { CrmStateService } from '../../core/services/crm-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { WorkflowRule } from '../../core/models/crm.models';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ModalComponent, TimeAgoPipe],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Top Header & Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Automation</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              Event-Driven Engine
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trigger automated email notifications, follow-up tasks, and priority escalations based on live CRM state.
          </p>
        </div>

        <button
          (click)="openCreateModal()"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Create Automation Rule</span>
        </button>
      </div>

      <!-- Workflows Grid & Execution History -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: Active Automation Rules -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Active Automation Rules</h3>
            <span class="text-xs text-slate-400">{{ workflowEngine.workflows().length }} configured</span>
          </div>

          <div class="space-y-3">
            @for (wf of workflowEngine.workflows(); track wf.id) {
              <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-3">
                
                <!-- Rule Header & Status Switch -->
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <app-icon name="workflows" [size]="20"></app-icon>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-900 dark:text-white">{{ wf.name }}</h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ wf.description }}</p>
                    </div>
                  </div>

                  <!-- Toggle switch -->
                  <div class="flex items-center gap-2">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="wf.enabled"
                        (change)="workflowEngine.toggleWorkflow(wf.id)"
                        class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <!-- Trigger & Action Flow Pills -->
                <div class="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <!-- Trigger Pill -->
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <span class="text-[10px] font-bold uppercase text-indigo-500">Trigger</span>
                    <span class="font-medium">{{ formatTrigger(wf.trigger) }}</span>
                  </div>

                  <span class="text-slate-300 dark:text-slate-600">→</span>

                  <!-- Actions Pills -->
                  @for (act of wf.actions; track act.type) {
                    <div class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                      <app-icon [name]="act.type === 'send_simulated_email' ? 'mail' : 'check'" [size]="12"></app-icon>
                      <span class="font-medium">{{ formatActionType(act.type) }}</span>
                    </div>
                  }
                </div>

                <!-- Footer: Executions count & Test Run button -->
                <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <div class="flex items-center gap-3">
                    <span>Executions: <strong class="text-slate-700 dark:text-slate-300">{{ wf.executionsCount }}</strong></span>
                    @if (wf.lastExecutedAt) {
                      <span>Last run: {{ wf.lastExecutedAt | timeAgo }}</span>
                    }
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      (click)="testRunWorkflow(wf)"
                      class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition flex items-center gap-1">
                      <app-icon name="sparkles" [size]="12"></app-icon>
                      <span>Test Trigger</span>
                    </button>
                    <button
                      (click)="workflowEngine.deleteWorkflow(wf.id)"
                      class="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                      title="Delete Workflow">
                      <app-icon name="trash" [size]="14"></app-icon>
                    </button>
                  </div>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- Right 1 Col: Live Execution Logs -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Execution Audit Trail</h3>
            <span class="text-xs text-slate-400">Live Engine</span>
          </div>

          <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 max-h-[600px] overflow-y-auto">
            @for (log of workflowEngine.executionLogs(); track log.id) {
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{{ log.ruleName }}</span>
                  <span class="text-[10px] text-slate-400">{{ log.timestamp | timeAgo }}</span>
                </div>
                <div class="text-[11px] text-slate-500">{{ log.details }}</div>
                
                <div class="space-y-1 pt-1">
                  @for (action of log.actionsPerformed; track action) {
                    <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <app-icon name="check" [size]="11"></app-icon>
                      <span>{{ action }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- MODAL: Create Workflow Rule -->
      <app-modal
        [isOpen]="isCreateModalOpen"
        title="Build Custom Automation Workflow"
        subtitle="Set condition triggers and automated email/task actions"
        icon="workflows"
        maxWidth="600px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitWorkflowForm()" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Name *</label>
            <input
              type="text"
              [(ngModel)]="formName"
              name="name"
              required
              placeholder="e.g. High-Value Inbound Alert"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input
              type="text"
              [(ngModel)]="formDescription"
              name="desc"
              placeholder="Explain what this automation accomplishes"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
          </div>

          <!-- Trigger Selector -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              1. When this event happens (Trigger)
            </span>
            <select
              [(ngModel)]="formTrigger"
              name="trigger"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="deal_stage_changed">Deal Stage Changes (e.g. Moved to Won or Negotiate)</option>
              <option value="lead_score_exceeded">Lead Score Exceeds Threshold (e.g. Hot Lead > 80)</option>
              <option value="deal_created">New Deal Created (> $50k)</option>
              <option value="lead_created">New Inbound Lead Created</option>
            </select>
          </div>

          <!-- Action Selector -->
          <div class="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <span class="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider block">
              2. Perform these automated actions
            </span>
            
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  [(ngModel)]="actionSendEmail"
                  name="actEmail"
                  class="rounded text-indigo-600">
                <span>Send Simulated Automated Email to Client / Owner</span>
              </label>

              @if (actionSendEmail) {
                <div class="pl-6">
                  <input
                    type="text"
                    [(ngModel)]="emailSubject"
                    name="emailSubject"
                    placeholder="Automated Email Subject"
                    class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                </div>
              }

              <label class="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  [(ngModel)]="actionCreateTask"
                  name="actTask"
                  class="rounded text-indigo-600">
                <span>Automatically Create Follow-up Task for Sales Rep</span>
              </label>

              @if (actionCreateTask) {
                <div class="pl-6">
                  <input
                    type="text"
                    [(ngModel)]="taskTitle"
                    name="taskTitle"
                    placeholder="Follow-up Task Title"
                    class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                </div>
              }
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              (click)="isCreateModalOpen = false"
              class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              Save Automation Rule
            </button>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class WorkflowsComponent {
  workflowEngine = inject(WorkflowEngineService);
  crmState = inject(CrmStateService);
  notificationService = inject(NotificationService);

  isCreateModalOpen = false;
  formName = '';
  formDescription = '';
  formTrigger: WorkflowRule['trigger'] = 'deal_stage_changed';
  actionSendEmail = true;
  emailSubject = 'Automated Pipeline Update';
  actionCreateTask = true;
  taskTitle = 'Automated Workflow Follow-up';

  formatTrigger(trigger: string): string {
    switch (trigger) {
      case 'deal_stage_changed': return 'Deal Stage Changed';
      case 'lead_score_exceeded': return 'Lead Score Threshold';
      case 'deal_created': return 'High-Value Deal Created';
      default: return 'New Lead Created';
    }
  }

  formatActionType(actionType: string): string {
    switch (actionType) {
      case 'send_simulated_email': return 'Simulate Email Dispatch';
      case 'create_task': return 'Create Reminder Task';
      case 'change_deal_priority': return 'Elevate Priority';
      default: return 'Trigger Notification';
    }
  }

  openCreateModal() {
    this.formName = '';
    this.formDescription = '';
    this.formTrigger = 'deal_stage_changed';
    this.actionSendEmail = true;
    this.emailSubject = 'Automated Workflow Notice';
    this.actionCreateTask = true;
    this.taskTitle = 'Immediate Account Follow-up';
    this.isCreateModalOpen = true;
  }

  submitWorkflowForm() {
    if (!this.formName) {
      this.notificationService.showToast('error', 'Validation Error', 'Please specify a workflow name.');
      return;
    }

    const actions: WorkflowRule['actions'] = [];
    if (this.actionSendEmail) {
      actions.push({
        type: 'send_simulated_email',
        params: { subject: this.emailSubject, template: 'Custom Automated Notice' }
      });
    }
    if (this.actionCreateTask) {
      actions.push({
        type: 'create_task',
        params: { title: this.taskTitle, priority: 'Urgent' }
      });
    }

    this.workflowEngine.addWorkflow({
      tenantId: this.crmState.currentTenantId(),
      name: this.formName,
      description: this.formDescription || 'Automated rule',
      trigger: this.formTrigger,
      conditions: [],
      actions,
      enabled: true
    });

    this.isCreateModalOpen = false;
  }

  testRunWorkflow(wf: WorkflowRule) {
    const sampleDeal = this.crmState.tenantDeals()[0];
    this.workflowEngine.evaluateTrigger(
      wf.trigger,
      { deal: sampleDeal, lead: this.crmState.tenantLeads()[0] },
      {
        createTask: t => this.crmState.createTask(t),
        logActivity: a => this.crmState.logActivity(a),
        updateDeal: (id, u) => this.crmState.updateDeal(id, u)
      }
    );
  }
}
