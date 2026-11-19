import { Injectable, inject, signal } from '@angular/core';
import { WorkflowRule, Activity, TaskReminder, Deal, Lead } from '../models/crm.models';
import { INITIAL_WORKFLOWS } from '../mock-data/initial-data';
import { NotificationService } from './notification.service';

export interface WorkflowExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: string;
  timestamp: string;
  details: string;
  actionsPerformed: string[];
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowEngineService {
  private notificationService = inject(NotificationService);

  workflows = signal<WorkflowRule[]>(INITIAL_WORKFLOWS);
  executionLogs = signal<WorkflowExecutionLog[]>([
    {
      id: 'log-1',
      ruleId: 'wf-1',
      ruleName: 'Closed-Won Automated Client Welcome & Team Alert',
      trigger: 'deal_stage_changed',
      timestamp: '2025-05-14T17:00:15Z',
      details: 'Deal "Zenith Systems" moved to Closed Won ($140,000)',
      actionsPerformed: [
        'Automated welcome email sent to Alexander Novak',
        'Created task "Schedule Executive Onboarding Kickoff Call"',
        'Fired priority notification toast'
      ]
    },
    {
      id: 'log-2',
      ruleId: 'wf-2',
      ruleName: 'High-Intent Hot Lead Escalation (Score >= 80)',
      trigger: 'lead_score_exceeded',
      timestamp: '2025-05-18T10:15:30Z',
      details: 'Lead "Harrison Fordham" calculated score reached 92 (Tier: Hot)',
      actionsPerformed: [
        'Generated urgent 1-hour outreach task',
        'Dispatched automated demo invite confirmation email'
      ]
    }
  ]);

  addWorkflow(rule: Omit<WorkflowRule, 'id' | 'executionsCount'>) {
    const newRule: WorkflowRule = {
      ...rule,
      id: 'wf-' + Math.random().toString(36).substring(2, 9),
      executionsCount: 0
    };
    this.workflows.update(rules => [newRule, ...rules]);
    this.notificationService.showToast('success', 'Automation Created', `Workflow "${newRule.name}" is now active.`);
  }

  toggleWorkflow(id: string) {
    this.workflows.update(rules =>
      rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
  }

  deleteWorkflow(id: string) {
    this.workflows.update(rules => rules.filter(r => r.id !== id));
    this.notificationService.showToast('info', 'Workflow Removed', 'Automation rule deleted.');
  }

  /**
   * Evaluate and execute workflows matching an event
   */
  evaluateTrigger(
    trigger: WorkflowRule['trigger'],
    payload: { deal?: Deal; lead?: Lead; [key: string]: any },
    callbacks: {
      createTask?: (task: Partial<TaskReminder>) => void;
      logActivity?: (activity: Partial<Activity>) => void;
      updateDeal?: (dealId: string, updates: Partial<Deal>) => void;
    }
  ) {
    const activeRules = this.workflows().filter(w => w.enabled && w.trigger === trigger);

    for (const rule of activeRules) {
      let conditionsMet = true;

      for (const cond of rule.conditions) {
        let actualVal: any = undefined;
        if (payload.deal && cond.field in payload.deal) {
          actualVal = (payload.deal as any)[cond.field];
        } else if (payload.lead && cond.field in payload.lead) {
          actualVal = (payload.lead as any)[cond.field];
        } else if (cond.field in payload) {
          actualVal = payload[cond.field];
        }

        if (cond.operator === 'equals' && actualVal !== cond.value) {
          conditionsMet = false;
          break;
        }
        if (cond.operator === 'greater_than' && !(Number(actualVal) > Number(cond.value))) {
          conditionsMet = false;
          break;
        }
        if (cond.operator === 'less_than' && !(Number(actualVal) < Number(cond.value))) {
          conditionsMet = false;
          break;
        }
      }

      if (conditionsMet) {
        this.executeRule(rule, payload, callbacks);
      }
    }
  }

  private executeRule(
    rule: WorkflowRule,
    payload: any,
    callbacks: {
      createTask?: (task: Partial<TaskReminder>) => void;
      logActivity?: (activity: Partial<Activity>) => void;
      updateDeal?: (dealId: string, updates: Partial<Deal>) => void;
    }
  ) {
    const actionsPerformed: string[] = [];

    // Increment executions count
    this.workflows.update(rules =>
      rules.map(r => r.id === rule.id ? {
        ...r,
        executionsCount: r.executionsCount + 1,
        lastExecutedAt: new Date().toISOString()
      } : r)
    );

    for (const action of rule.actions) {
      switch (action.type) {
        case 'send_simulated_email': {
          const recipient = payload.deal?.contactName || payload.lead?.firstName || 'Customer';
          const toEmail = payload.lead?.email || 'client@enterprise.com';
          const subject = action.params['subject'] || 'Automated CRM Notification';
          
          this.notificationService.showToast(
            'email',
            '⚡ Automated Email Triggered',
            `Workflow dispatched: "${subject}" to ${recipient} (${toEmail})`,
            6000
          );

          this.notificationService.addNotification({
            tenantId: rule.tenantId,
            title: 'Automated Email: ' + subject,
            message: `Dispatched to ${recipient} as part of workflow "${rule.name}".`,
            type: 'email'
          });

          if (callbacks.logActivity) {
            callbacks.logActivity({
              type: 'email',
              title: 'Automated Email: ' + subject,
              description: `Dispatched automated notification via rule: ${rule.name}`,
              relatedType: payload.deal ? 'deal' : 'lead',
              relatedId: payload.deal?.id || payload.lead?.id || 'sys',
              metadata: { emailSubject: subject, emailTo: toEmail }
            });
          }
          actionsPerformed.push(`Sent automated email "${subject}"`);
          break;
        }

        case 'create_task': {
          const title = action.params['title'] || 'Workflow Follow-up Task';
          if (callbacks.createTask) {
            callbacks.createTask({
              title,
              priority: action.params['priority'] || 'High',
              dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
              relatedType: payload.deal ? 'deal' : 'lead',
              relatedId: payload.deal?.id || payload.lead?.id || 'sys',
              relatedName: payload.deal?.title || payload.lead?.company || 'Opportunity'
            });
          }
          actionsPerformed.push(`Created follow-up task "${title}"`);
          break;
        }

        case 'change_deal_priority': {
          if (payload.deal && callbacks.updateDeal) {
            callbacks.updateDeal(payload.deal.id, { priority: action.params['priority'] || 'Urgent' });
            actionsPerformed.push(`Elevated deal priority to ${action.params['priority']}`);
          }
          break;
        }

        case 'show_toast': {
          this.notificationService.showToast('info', 'Workflow Action', action.params['message'] || 'Action completed');
          actionsPerformed.push('Triggered alert notification');
          break;
        }
      }
    }

    // Record execution log
    const log: WorkflowExecutionLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      ruleId: rule.id,
      ruleName: rule.name,
      trigger: rule.trigger,
      timestamp: new Date().toISOString(),
      details: payload.deal?.title || payload.lead?.company || 'Automated trigger',
      actionsPerformed
    };

    this.executionLogs.update(logs => [log, ...logs.slice(0, 49)]);
  }
}
