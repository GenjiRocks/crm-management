export type UserRole = 'Admin' | 'Sales Manager' | 'Sales Rep' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  tenantId: string;
  title: string;
  department: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logoText: string;
  brandColor: string;
  currency: string; // '$', '€', '£', '¥'
  currencyCode: string; // 'USD', 'EUR', 'GBP'
  timezone: string;
  industry: string;
  subscriptionPlan: 'Enterprise' | 'Growth' | 'Professional';
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Unqualified' | 'Converted';
export type LeadSource = 'Website' | 'Inbound Demo' | 'Referral' | 'LinkedIn' | 'Outbound Campaign' | 'Partner' | 'Event';

export interface Lead {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: LeadStatus;
  source: LeadSource;
  score: number; // 0 - 100
  scoreTier: 'Hot' | 'Warm' | 'Cold';
  estimatedValue: number;
  assignedTo: string; // User ID
  tags: string[];
  notes: string;
  createdAt: string;
  lastContactedAt?: string;
  customFields?: Record<string, any>;
  duplicateMatchIds?: string[];
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  industry: string;
  size: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  website: string;
  phone: string;
  address: string;
  tier: 'Enterprise' | 'Mid-Market' | 'SMB';
  annualRevenue: number;
  assignedTo: string;
  createdAt: string;
  customFields?: Record<string, any>;
}

export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  title: string;
  department?: string;
  avatar?: string;
  lifecycleStage: 'Lead' | 'Opportunity' | 'Customer' | 'Evangelist';
  lastContacted?: string;
  customFields?: Record<string, any>;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  defaultProbability: number;
}

export type DealPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Deal {
  id: string;
  tenantId: string;
  title: string;
  companyId: string;
  companyName: string;
  contactId?: string;
  contactName?: string;
  value: number;
  currency: string;
  stageId: string;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  priority: DealPriority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lostReason?: string;
  customFields?: Record<string, any>;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'stage_change';

export interface Activity {
  id: string;
  tenantId: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  relatedType: 'lead' | 'deal' | 'company' | 'contact';
  relatedId: string;
  relatedTitle?: string;
  metadata?: {
    durationMinutes?: number;
    callOutcome?: 'Connected' | 'Left Voicemail' | 'No Answer' | 'Busy';
    emailSubject?: string;
    emailTo?: string;
    meetingLocation?: string;
    dueDate?: string;
    priority?: 'Low' | 'Medium' | 'High';
    isCompleted?: boolean;
    stageFrom?: string;
    stageTo?: string;
  };
}

export interface TaskReminder {
  id: string;
  tenantId: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  completed: boolean;
  assignedTo: string;
  relatedType: 'lead' | 'deal' | 'contact' | 'company';
  relatedId: string;
  relatedName: string;
}

export interface WorkflowRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  trigger: 'deal_stage_changed' | 'lead_created' | 'lead_score_exceeded' | 'task_overdue' | 'deal_created';
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }[];
  actions: {
    type: 'send_simulated_email' | 'create_task' | 'change_deal_priority' | 'assign_lead' | 'show_toast';
    params: Record<string, any>;
  }[];
  enabled: boolean;
  executionsCount: number;
  lastExecutedAt?: string;
}

export interface LeadAssignmentRule {
  id: string;
  tenantId: string;
  name: string;
  strategy: 'round_robin' | 'lead_score_tier' | 'industry' | 'region';
  criteria?: {
    field: string;
    operator: 'equals' | 'greater_than';
    value: any;
  };
  assignToUserIds: string[];
  active: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  tenantId: string;
  entity: 'lead' | 'deal' | 'contact' | 'company';
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: string[]; // for select
  required?: boolean;
  defaultValue?: any;
}

export interface AppNotification {
  id: string;
  tenantId: string;
  title: string;
  message: string;
  type: 'email' | 'deal' | 'lead' | 'workflow' | 'task';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface DashboardWidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}
