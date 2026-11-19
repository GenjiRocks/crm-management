import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Tenant, User, UserRole, Lead, Company, Contact,
  PipelineStage, Deal, Activity, TaskReminder,
  CustomFieldDefinition, LeadAssignmentRule, DashboardWidgetConfig
} from '../models/crm.models';
import {
  INITIAL_TENANTS, INITIAL_USERS, INITIAL_PIPELINE_STAGES,
  INITIAL_COMPANIES, INITIAL_CONTACTS, INITIAL_LEADS,
  INITIAL_DEALS, INITIAL_ACTIVITIES, INITIAL_TASKS,
  INITIAL_ASSIGNMENT_RULES, INITIAL_CUSTOM_FIELDS
} from '../mock-data/initial-data';
import { NotificationService } from './notification.service';
import { LeadScoringService } from './lead-scoring.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { SoundEffectsService } from './sound-effects.service';

const STORAGE_PREFIX = 'octax_crm_';

@Injectable({
  providedIn: 'root'
})
export class CrmStateService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private leadScoringService = inject(LeadScoringService);
  private workflowEngine = inject(WorkflowEngineService);
  private soundEffects = inject(SoundEffectsService);

  constructor() {
    this.initPublicJsonData();
  }

  /**
   * Automatically synchronizes with public/data/crm-data.json
   */
  private initPublicJsonData() {
    const hasLocalData = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem(STORAGE_PREFIX + 'leads');
    if (!hasLocalData) {
      this.reloadPublicJson(false);
    }
  }

  /**
   * Reload all state directly from public/data/crm-data.json
   */
  reloadPublicJson(showToast = true) {
    this.http.get<any>('/data/crm-data.json').subscribe({
      next: (data) => {
        if (data) {
          if (data.tenants) { this.tenants.set(data.tenants); this.saveToStorage('tenants', data.tenants); }
          if (data.users) { this.users.set(data.users); this.saveToStorage('users', data.users); }
          if (data.pipelineStages) { this.pipelineStages.set(data.pipelineStages); this.saveToStorage('pipelineStages', data.pipelineStages); }
          if (data.companies) { this.companies.set(data.companies); this.saveToStorage('companies', data.companies); }
          if (data.contacts) { this.contacts.set(data.contacts); this.saveToStorage('contacts', data.contacts); }
          if (data.leads) { this.leads.set(data.leads); this.saveToStorage('leads', data.leads); }
          if (data.deals) { this.deals.set(data.deals); this.saveToStorage('deals', data.deals); }
          if (data.activities) { this.activities.set(data.activities); this.saveToStorage('activities', data.activities); }
          if (data.tasks) { this.tasks.set(data.tasks); this.saveToStorage('tasks', data.tasks); }
          if (data.workflows) { this.workflowEngine.workflows.set(data.workflows); }
          if (data.customFields) { this.customFields.set(data.customFields); this.saveToStorage('customFields', data.customFields); }
          if (data.assignmentRules) { this.leadAssignmentRules.set(data.assignmentRules); this.saveToStorage('assignmentRules', data.assignmentRules); }
          if (data.notifications) { this.notificationService.notifications.set(data.notifications); }

          if (showToast) {
            this.notificationService.showToast('success', 'Public JSON Loaded', 'Synchronized fresh datasets from /public/data/crm-data.json');
          }
        }
      },
      error: () => {
        // Fallback to static mock datasets
      }
    });
  }

  // Tenants & Auth
  tenants = signal<Tenant[]>(this.loadFromStorage('tenants', INITIAL_TENANTS));
  currentTenantId = signal<string>(this.loadFromStorage('currentTenantId', 'tenant-acme'));
  users = signal<User[]>(this.loadFromStorage('users', INITIAL_USERS));
  currentUserId = signal<string>(this.loadFromStorage('currentUserId', 'usr-1'));

  // Pipeline Stages
  pipelineStages = signal<PipelineStage[]>(this.loadFromStorage('pipelineStages', INITIAL_PIPELINE_STAGES));

  // Entities
  leads = signal<Lead[]>(this.loadFromStorage('leads', INITIAL_LEADS));
  deals = signal<Deal[]>(this.loadFromStorage('deals', INITIAL_DEALS));
  companies = signal<Company[]>(this.loadFromStorage('companies', INITIAL_COMPANIES));
  contacts = signal<Contact[]>(this.loadFromStorage('contacts', INITIAL_CONTACTS));
  activities = signal<Activity[]>(this.loadFromStorage('activities', INITIAL_ACTIVITIES));
  tasks = signal<TaskReminder[]>(this.loadFromStorage('tasks', INITIAL_TASKS));

  // Configurations
  customFields = signal<CustomFieldDefinition[]>(this.loadFromStorage('customFields', INITIAL_CUSTOM_FIELDS));
  leadAssignmentRules = signal<LeadAssignmentRule[]>(this.loadFromStorage('assignmentRules', INITIAL_ASSIGNMENT_RULES));

  // Dashboard Widgets Configuration
  dashboardWidgets = signal<DashboardWidgetConfig[]>([
    { id: 'kpi_cards', name: 'Executive Revenue KPIs', visible: true, order: 1 },
    { id: 'sales_chart', name: 'Revenue Overview & Trajectory Chart', visible: true, order: 2 },
    { id: 'pipeline_summary', name: 'Pipeline Health & Funnel Conversion', visible: true, order: 3 },
    { id: 'forecast_preview', name: 'Weighted Sales Forecasting', visible: true, order: 4 },
    { id: 'lead_sources', name: 'Lead Acquisition Channels', visible: true, order: 5 },
    { id: 'activity_feed', name: 'Live Activity Timeline Feed', visible: true, order: 6 },
    { id: 'tasks_reminders', name: 'Upcoming Action Items & Follow-ups', visible: true, order: 7 }
  ]);

  // Global Search Query
  searchQuery = signal<string>('');

  // ---------------- Computeds ---------------- //

  currentTenant = computed(() => {
    const found = this.tenants().find(t => t.id === this.currentTenantId());
    return found || this.tenants()[0];
  });

  currentUser = computed(() => {
    const found = this.users().find(u => u.id === this.currentUserId());
    return found || this.users()[0];
  });

  currentRole = computed(() => this.currentUser().role);

  currencySymbol = computed(() => this.currentTenant().currency);
  currencyCode = computed(() => this.currentTenant().currencyCode);

  // Tenant-scoped entities
  tenantLeads = computed(() => this.leads().filter(l => l.tenantId === this.currentTenantId()));
  tenantDeals = computed(() => this.deals().filter(d => d.tenantId === this.currentTenantId()));
  tenantCompanies = computed(() => this.companies().filter(c => c.tenantId === this.currentTenantId()));
  tenantContacts = computed(() => this.contacts().filter(c => c.tenantId === this.currentTenantId()));
  tenantActivities = computed(() => this.activities().filter(a => a.tenantId === this.currentTenantId()));
  tenantTasks = computed(() => this.tasks().filter(t => t.tenantId === this.currentTenantId()));
  tenantCustomFields = computed(() => this.customFields().filter(cf => cf.tenantId === this.currentTenantId()));

  // Analytics Metrics
  totalRevenueYtd = computed(() => {
    return this.tenantDeals()
      .filter(d => d.stageId === 'stage-won')
      .reduce((sum, d) => sum + d.value, 0);
  });

  activePipelineValue = computed(() => {
    return this.tenantDeals()
      .filter(d => d.stageId !== 'stage-won' && d.stageId !== 'stage-lost')
      .reduce((sum, d) => sum + d.value, 0);
  });

  dealsClosedWonCount = computed(() => {
    return this.tenantDeals().filter(d => d.stageId === 'stage-won').length;
  });

  weightedForecastValue = computed(() => {
    return this.tenantDeals()
      .filter(d => d.stageId !== 'stage-lost')
      .reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);
  });

  leadWinRate = computed(() => {
    const total = this.tenantLeads().length;
    if (total === 0) return 0;
    const converted = this.tenantLeads().filter(l => l.status === 'Converted' || l.status === 'Qualified').length;
    return Math.round((converted / total) * 100);
  });

  // Duplicate leads detection
  duplicateLeadGroups = computed(() => {
    return this.leadScoringService.detectDuplicates(this.tenantLeads());
  });

  // ---------------- Actions ---------------- //

  switchTenant(tenantId: string) {
    this.currentTenantId.set(tenantId);
    this.saveToStorage('currentTenantId', tenantId);
    this.notificationService.showToast(
      'info',
      'Tenant Switched',
      `Active organization changed to ${this.currentTenant().name}`
    );
  }

  switchUserRole(role: UserRole) {
    this.users.update(users =>
      users.map(u => u.id === this.currentUserId() ? { ...u, role } : u)
    );
    this.saveToStorage('users', this.users());
    this.notificationService.showToast(
      'info',
      'Role Updated',
      `Current user profile permission set to ${role}`
    );
  }

  // --- Lead Management ---

  createLead(leadData: Omit<Lead, 'id' | 'tenantId' | 'createdAt' | 'score' | 'scoreTier'>): Lead {
    const scoring = this.leadScoringService.calculateLeadScore(leadData);
    const assignedUser = this.autoAssignLead(scoring.score);

    const newLead: Lead = {
      ...leadData,
      id: 'lead-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      score: scoring.score,
      scoreTier: scoring.tier,
      assignedTo: leadData.assignedTo || assignedUser,
      createdAt: new Date().toISOString()
    };

    this.leads.update(current => [newLead, ...current]);
    this.saveToStorage('leads', this.leads());

    // Log Activity
    this.logActivity({
      type: 'note',
      title: `Lead Created: ${newLead.firstName} ${newLead.lastName}`,
      description: `Inbound lead added with score ${newLead.score} (${newLead.scoreTier}). Assigned to ${this.getUserName(newLead.assignedTo)}.`,
      relatedType: 'lead',
      relatedId: newLead.id
    });

    // Check Automation Workflows
    this.workflowEngine.evaluateTrigger(
      'lead_created',
      { lead: newLead },
      {
        createTask: t => this.createTask(t),
        logActivity: a => this.logActivity(a)
      }
    );

    if (newLead.score >= 80) {
      this.workflowEngine.evaluateTrigger(
        'lead_score_exceeded',
        { lead: newLead, score: newLead.score },
        {
          createTask: t => this.createTask(t),
          logActivity: a => this.logActivity(a)
        }
      );
    }

    this.notificationService.showToast('success', 'Lead Added', `${newLead.firstName} ${newLead.lastName} (${newLead.company}) registered with score ${newLead.score}.`);
    return newLead;
  }

  updateLead(leadId: string, updates: Partial<Lead>) {
    this.leads.update(current =>
      current.map(l => {
        if (l.id === leadId) {
          const merged = { ...l, ...updates };
          const scoring = this.leadScoringService.calculateLeadScore(merged);
          return { ...merged, score: scoring.score, scoreTier: scoring.tier };
        }
        return l;
      })
    );
    this.saveToStorage('leads', this.leads());
    this.notificationService.showToast('info', 'Lead Updated', 'Changes saved successfully.');
  }

  deleteLead(leadId: string) {
    this.leads.update(current => current.filter(l => l.id !== leadId));
    this.saveToStorage('leads', this.leads());
    this.notificationService.showToast('info', 'Lead Deleted', 'Lead removed from database.');
  }

  convertLeadToDeal(leadId: string, dealTitle?: string, dealValue?: number): Deal {
    const lead = this.leads().find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    // 1. Create or Find Company
    let company = this.companies().find(c => c.name.toLowerCase() === lead.company.toLowerCase());
    if (!company) {
      company = {
        id: 'comp-' + Math.random().toString(36).substring(2, 9),
        tenantId: this.currentTenantId(),
        name: lead.company,
        industry: 'Technology',
        size: '51-200',
        website: 'https://' + (lead.email.split('@')[1] || 'example.com'),
        phone: lead.phone,
        address: 'HQ Location',
        tier: lead.estimatedValue > 60000 ? 'Enterprise' : 'Mid-Market',
        annualRevenue: lead.estimatedValue * 15,
        assignedTo: lead.assignedTo,
        createdAt: new Date().toISOString()
      };
      this.companies.update(c => [...c, company!]);
      this.saveToStorage('companies', this.companies());
    }

    // 2. Create Contact
    const contact: Contact = {
      id: 'cnt-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      companyId: company.id,
      companyName: company.name,
      title: lead.title,
      lifecycleStage: 'Opportunity',
      lastContacted: new Date().toISOString()
    };
    this.contacts.update(c => [...c, contact]);
    this.saveToStorage('contacts', this.contacts());

    // 3. Create Deal
    const deal: Deal = {
      id: 'deal-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      title: dealTitle || `${lead.company} - Expansion Deal`,
      companyId: company.id,
      companyName: company.name,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      value: dealValue || lead.estimatedValue || 50000,
      currency: this.currencySymbol(),
      stageId: 'stage-qualify',
      probability: 40,
      expectedCloseDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      assignedTo: lead.assignedTo,
      priority: lead.scoreTier === 'Hot' ? 'Urgent' : 'High',
      tags: [...lead.tags, 'Converted'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.deals.update(d => [deal, ...d]);
    this.saveToStorage('deals', this.deals());

    // 4. Mark Lead as Converted
    this.updateLead(lead.id, { status: 'Converted' });

    // 5. Activity log
    this.logActivity({
      type: 'stage_change',
      title: `Lead Converted to Deal: ${deal.title}`,
      description: `Converted by ${this.currentUser().name}. Associated Company: ${company.name}, Contact: ${contact.firstName} ${contact.lastName}.`,
      relatedType: 'deal',
      relatedId: deal.id
    });

    this.notificationService.showToast(
      'success',
      'Lead Converted Successfully',
      `Created Deal "${deal.title}" ($${deal.value.toLocaleString()}), Company "${company.name}", and Contact.`
    );

    this.soundEffects.launchConfetti();
    this.soundEffects.playSuccessChime();

    return deal;
  }

  mergeDuplicates(primaryLeadId: string, duplicateLeadIds: string[]) {
    const primary = this.leads().find(l => l.id === primaryLeadId);
    if (!primary) return;

    this.leads.update(current => {
      return current.filter(l => !duplicateLeadIds.includes(l.id));
    });
    this.saveToStorage('leads', this.leads());

    this.notificationService.showToast(
      'success',
      'Leads Merged',
      `Consolidated ${duplicateLeadIds.length} duplicate records into ${primary.firstName} ${primary.lastName}.`
    );
  }

  // --- Deal & Pipeline Management ---

  createDeal(dealData: Omit<Deal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Deal {
    const newDeal: Deal = {
      ...dealData,
      id: 'deal-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      currency: this.currencySymbol(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.deals.update(current => [newDeal, ...current]);
    this.saveToStorage('deals', this.deals());

    this.logActivity({
      type: 'note',
      title: `Deal Created: ${newDeal.title}`,
      description: `Value: ${this.currencySymbol()}${newDeal.value.toLocaleString()} in stage "${this.getStageName(newDeal.stageId)}". Assigned to ${this.getUserName(newDeal.assignedTo)}.`,
      relatedType: 'deal',
      relatedId: newDeal.id
    });

    // Check Automation Workflows
    this.workflowEngine.evaluateTrigger(
      'deal_created',
      { deal: newDeal, value: newDeal.value },
      {
        createTask: t => this.createTask(t),
        logActivity: a => this.logActivity(a),
        updateDeal: (id, u) => this.updateDeal(id, u)
      }
    );

    this.notificationService.showToast('success', 'Deal Created', `${newDeal.title} added to sales pipeline.`);
    return newDeal;
  }

  updateDeal(dealId: string, updates: Partial<Deal>) {
    this.deals.update(current =>
      current.map(d => d.id === dealId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)
    );
    this.saveToStorage('deals', this.deals());
  }

  moveDealStage(dealId: string, targetStageId: string) {
    const deal = this.deals().find(d => d.id === dealId);
    if (!deal || deal.stageId === targetStageId) return;

    const fromStageName = this.getStageName(deal.stageId);
    const toStageName = this.getStageName(targetStageId);
    const stage = this.pipelineStages().find(s => s.id === targetStageId);
    const newProb = stage ? stage.defaultProbability : deal.probability;

    this.updateDeal(dealId, {
      stageId: targetStageId,
      probability: newProb
    });

    const updatedDeal = { ...deal, stageId: targetStageId, probability: newProb };

    // Log Stage Change Activity
    this.logActivity({
      type: 'stage_change',
      title: `Stage Moved: ${fromStageName} → ${toStageName}`,
      description: `Deal "${deal.title}" shifted to ${toStageName} with probability ${newProb}%.`,
      relatedType: 'deal',
      relatedId: deal.id,
      metadata: { stageFrom: fromStageName, stageTo: toStageName }
    });

    // Fire Automation Workflows (e.g. Closed Won welcome email!)
    this.workflowEngine.evaluateTrigger(
      'deal_stage_changed',
      { deal: updatedDeal, stageId: targetStageId },
      {
        createTask: t => this.createTask(t),
        logActivity: a => this.logActivity(a),
        updateDeal: (id, u) => this.updateDeal(id, u)
      }
    );

    if (targetStageId === 'stage-won') {
      this.soundEffects.launchConfetti();
      this.soundEffects.playSuccessChime();
      this.notificationService.showToast('success', '🎉 Deal Closed Won!', `Congratulations on closing "${deal.title}" for ${this.currencySymbol()}${deal.value.toLocaleString()}!`);
    } else {
      this.soundEffects.playEmailSentSwoosh();
      this.notificationService.showToast('info', 'Pipeline Updated', `Moved "${deal.title}" to ${toStageName}`);
    }
  }

  deleteDeal(dealId: string) {
    this.deals.update(current => current.filter(d => d.id !== dealId));
    this.saveToStorage('deals', this.deals());
    this.notificationService.showToast('info', 'Deal Removed', 'Deal deleted from pipeline.');
  }

  // --- Activity & Communication Logging ---

  logActivity(activityData: Partial<Activity>): Activity {
    const newAct: Activity = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      type: activityData.type || 'note',
      title: activityData.title || 'Activity Logged',
      description: activityData.description || '',
      timestamp: new Date().toISOString(),
      userId: this.currentUser().id,
      userName: this.currentUser().name,
      userAvatar: this.currentUser().avatar,
      relatedType: activityData.relatedType || 'deal',
      relatedId: activityData.relatedId || '',
      metadata: activityData.metadata
    };

    this.activities.update(current => [newAct, ...current]);
    this.saveToStorage('activities', this.activities());
    return newAct;
  }

  // --- Task & Reminder Management ---

  createTask(taskData: Partial<TaskReminder>): TaskReminder {
    const newTask: TaskReminder = {
      id: 'tsk-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      title: taskData.title || 'Follow-up Task',
      dueDate: taskData.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: taskData.dueTime || '10:00',
      priority: taskData.priority || 'Medium',
      completed: false,
      assignedTo: taskData.assignedTo || this.currentUserId(),
      relatedType: taskData.relatedType || 'deal',
      relatedId: taskData.relatedId || '',
      relatedName: taskData.relatedName || ''
    };

    this.tasks.update(current => [newTask, ...current]);
    this.saveToStorage('tasks', this.tasks());
    this.notificationService.showToast('success', 'Task Scheduled', `Action item "${newTask.title}" added to reminders.`);
    return newTask;
  }

  toggleTaskCompleted(taskId: string) {
    this.tasks.update(current =>
      current.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
    this.saveToStorage('tasks', this.tasks());
  }

  deleteTask(taskId: string) {
    this.tasks.update(current => current.filter(t => t.id !== taskId));
    this.saveToStorage('tasks', this.tasks());
  }

  // --- Companies & Contacts ---

  createCompany(companyData: Omit<Company, 'id' | 'tenantId' | 'createdAt'>): Company {
    const newComp: Company = {
      ...companyData,
      id: 'comp-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      createdAt: new Date().toISOString()
    };
    this.companies.update(c => [newComp, ...c]);
    this.saveToStorage('companies', this.companies());
    this.notificationService.showToast('success', 'Customer Added', `Company profile "${newComp.name}" created.`);
    return newComp;
  }

  createContact(contactData: Omit<Contact, 'id' | 'tenantId'>): Contact {
    const newCnt: Contact = {
      ...contactData,
      id: 'cnt-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId(),
      lastContacted: new Date().toISOString()
    };
    this.contacts.update(c => [newCnt, ...c]);
    this.saveToStorage('contacts', this.contacts());
    this.notificationService.showToast('success', 'Contact Saved', `${newCnt.firstName} ${newCnt.lastName} added.`);
    return newCnt;
  }

  // --- Custom Fields Management ---

  addCustomField(field: Omit<CustomFieldDefinition, 'id' | 'tenantId'>) {
    const newField: CustomFieldDefinition = {
      ...field,
      id: 'cf-' + Math.random().toString(36).substring(2, 9),
      tenantId: this.currentTenantId()
    };
    this.customFields.update(f => [...f, newField]);
    this.saveToStorage('customFields', this.customFields());
    this.notificationService.showToast('success', 'Custom Field Created', `Added "${field.label}" to ${field.entity} forms.`);
  }

  deleteCustomField(id: string) {
    this.customFields.update(f => f.filter(cf => cf.id !== id));
    this.saveToStorage('customFields', this.customFields());
    this.notificationService.showToast('info', 'Custom Field Removed', 'Field removed from tenant configuration.');
  }

  // --- Lead Assignment Strategy ---

  autoAssignLead(score: number): string {
    const activeRules = this.leadAssignmentRules().filter(r => r.active && r.tenantId === this.currentTenantId());
    
    // Check tier rule
    for (const rule of activeRules) {
      if (rule.strategy === 'lead_score_tier' && rule.criteria) {
        if (rule.criteria.operator === 'greater_than' && score > rule.criteria.value) {
          if (rule.assignToUserIds.length > 0) return rule.assignToUserIds[0];
        }
      }
    }

    // Default round robin across available reps
    const reps = this.users().filter(u => u.tenantId === this.currentTenantId() && u.role !== 'Viewer');
    if (reps.length > 0) {
      const idx = Math.floor(Math.random() * reps.length);
      return reps[idx].id;
    }
    return this.currentUserId();
  }

  // --- Helpers ---

  getUserName(userId: string): string {
    const u = this.users().find(user => user.id === userId);
    return u ? u.name : 'Unassigned';
  }

  getUser(userId: string): User | undefined {
    return this.users().find(user => user.id === userId);
  }

  getStageName(stageId: string): string {
    const s = this.pipelineStages().find(stage => stage.id === stageId);
    return s ? s.name : stageId;
  }

  getStageColor(stageId: string): string {
    const s = this.pipelineStages().find(stage => stage.id === stageId);
    return s ? s.color : '#6366f1';
  }

  // --- Storage ---
  private loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch {
      // ignore
    }
    return defaultValue;
  }

  private saveToStorage(key: string, value: any) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      }
    } catch {
      // ignore
    }
  }
}
