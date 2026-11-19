import {
  Tenant, User, Lead, Company, Contact, PipelineStage, Deal,
  Activity, TaskReminder, WorkflowRule, LeadAssignmentRule,
  CustomFieldDefinition, AppNotification
} from '../models/crm.models';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-acme',
    name: 'Octax Enterprise Cloud',
    slug: 'octax',
    domain: 'octax.cloud',
    logoText: 'Octax Cloud',
    brandColor: '#4f46e5', // indigo-600
    currency: '$',
    currencyCode: 'USD',
    timezone: 'America/New_York (EST)',
    industry: 'Enterprise Software & Cloud',
    subscriptionPlan: 'Enterprise'
  },
  {
    id: 'tenant-apex',
    name: 'Apex Health Systems',
    slug: 'apex-health',
    domain: 'apexhealth.io',
    logoText: 'Apex Health',
    brandColor: '#059669', // emerald-600
    currency: '€',
    currencyCode: 'EUR',
    timezone: 'Europe/Berlin (CET)',
    industry: 'Healthcare Technology',
    subscriptionPlan: 'Growth'
  },
  {
    id: 'tenant-logistics',
    name: 'Vanguard Freight Global',
    slug: 'vanguard',
    domain: 'vanguardfreight.co.uk',
    logoText: 'Vanguard Global',
    brandColor: '#0284c7', // sky-600
    currency: '£',
    currencyCode: 'GBP',
    timezone: 'Europe/London (GMT)',
    industry: 'Supply Chain & Logistics',
    subscriptionPlan: 'Enterprise'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Jessica Miller',
    email: 'jessica.m@octax.cloud',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    tenantId: 'tenant-acme',
    title: 'VP of Global Sales',
    department: 'Sales Leadership'
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'marcus.v@octax.cloud',
    role: 'Sales Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    tenantId: 'tenant-acme',
    title: 'Enterprise Sales Lead',
    department: 'Commercial Accounts'
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.r@octax.cloud',
    role: 'Sales Rep',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    tenantId: 'tenant-acme',
    title: 'Account Executive',
    department: 'Inbound Sales'
  },
  {
    id: 'usr-4',
    name: 'David Kim',
    email: 'david.k@octax.cloud',
    role: 'Viewer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    tenantId: 'tenant-acme',
    title: 'Financial Auditor',
    department: 'Finance'
  }
];

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'stage-prospect', name: 'Prospecting', order: 1, color: '#6366f1', defaultProbability: 20 },
  { id: 'stage-qualify', name: 'Qualification', order: 2, color: '#8b5cf6', defaultProbability: 40 },
  { id: 'stage-proposal', name: 'Proposal / Demo', order: 3, color: '#ec4899', defaultProbability: 60 },
  { id: 'stage-negotiate', name: 'Negotiation', order: 4, color: '#f59e0b', defaultProbability: 80 },
  { id: 'stage-won', name: 'Closed Won', order: 5, color: '#10b981', defaultProbability: 100 },
  { id: 'stage-lost', name: 'Closed Lost', order: 6, color: '#ef4444', defaultProbability: 0 }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    tenantId: 'tenant-acme',
    name: 'Acme Corporation',
    industry: 'Enterprise SaaS',
    size: '1000+',
    website: 'https://acme-corp.com',
    phone: '+1 (555) 234-5678',
    address: '450 Mission St, San Francisco, CA',
    tier: 'Enterprise',
    annualRevenue: 45000000,
    assignedTo: 'usr-1',
    createdAt: '2025-01-10T10:00:00Z',
    customFields: { securityClearance: 'SOC2 Type II', cloudPlatform: 'AWS + GCP' }
  },
  {
    id: 'comp-2',
    tenantId: 'tenant-acme',
    name: 'Beta Industries',
    industry: 'Manufacturing & IoT',
    size: '201-1000',
    website: 'https://betaindustries.io',
    phone: '+1 (555) 987-6543',
    address: '100 Tech Blvd, Austin, TX',
    tier: 'Mid-Market',
    annualRevenue: 18000000,
    assignedTo: 'usr-2',
    createdAt: '2025-02-14T11:30:00Z',
    customFields: { securityClearance: 'ISO 27001', cloudPlatform: 'Azure' }
  },
  {
    id: 'comp-3',
    tenantId: 'tenant-acme',
    name: 'Omega Partners Tech',
    industry: 'FinTech & Payments',
    size: '51-200',
    website: 'https://omegapartners.com',
    phone: '+1 (555) 456-7890',
    address: '742 Evergreen Terr, Chicago, IL',
    tier: 'Mid-Market',
    annualRevenue: 8500000,
    assignedTo: 'usr-3',
    createdAt: '2025-03-01T09:15:00Z',
    customFields: { securityClearance: 'PCI-DSS Tier 1', cloudPlatform: 'AWS' }
  },
  {
    id: 'comp-4',
    tenantId: 'tenant-acme',
    name: 'Zenith Systems Global',
    industry: 'Cloud Infrastructure',
    size: '1000+',
    website: 'https://zenithsystems.com',
    phone: '+1 (555) 321-4321',
    address: '1200 Avenue of the Americas, New York, NY',
    tier: 'Enterprise',
    annualRevenue: 62000000,
    assignedTo: 'usr-1',
    createdAt: '2025-01-20T14:00:00Z',
    customFields: { securityClearance: 'FedRAMP Ready', cloudPlatform: 'Multi-Cloud' }
  },
  {
    id: 'comp-5',
    tenantId: 'tenant-acme',
    name: 'Delta Group Logistics',
    industry: 'Supply Chain',
    size: '51-200',
    website: 'https://deltagroup.io',
    phone: '+1 (555) 876-5432',
    address: '88 Harbor Dr, Seattle, WA',
    tier: 'SMB',
    annualRevenue: 3200000,
    assignedTo: 'usr-3',
    createdAt: '2025-03-12T08:45:00Z'
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    tenantId: 'tenant-acme',
    firstName: 'Jake',
    lastName: 'Williams',
    email: 'jake.williams@acmecorp.com',
    phone: '+1 (555) 234-1101',
    companyId: 'comp-1',
    companyName: 'Acme Corporation',
    title: 'Head of Sales Operations',
    department: 'Sales & Revenue',
    lifecycleStage: 'Opportunity',
    lastContacted: '2025-05-20T10:30:00Z'
  },
  {
    id: 'cnt-2',
    tenantId: 'tenant-acme',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@acmecorp.com',
    phone: '+1 (555) 234-1102',
    companyId: 'comp-1',
    companyName: 'Acme Corporation',
    title: 'Sales Operations Manager',
    department: 'Operations',
    lifecycleStage: 'Opportunity',
    lastContacted: '2025-05-18T16:00:00Z'
  },
  {
    id: 'cnt-3',
    tenantId: 'tenant-acme',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'm.johnson@betaindustries.io',
    phone: '+1 (555) 987-2201',
    companyId: 'comp-2',
    companyName: 'Beta Industries',
    title: 'VP of Revenue Systems',
    department: 'Executive Team',
    lifecycleStage: 'Customer',
    lastContacted: '2025-05-15T14:20:00Z'
  },
  {
    id: 'cnt-4',
    tenantId: 'tenant-acme',
    firstName: 'Chloe',
    lastName: 'Taylor',
    email: 'chloe.taylor@omegapartners.com',
    phone: '+1 (555) 456-3301',
    companyId: 'comp-3',
    companyName: 'Omega Partners Tech',
    title: 'Chief Technology Officer',
    department: 'Engineering',
    lifecycleStage: 'Opportunity',
    lastContacted: '2025-05-19T11:00:00Z'
  },
  {
    id: 'cnt-5',
    tenantId: 'tenant-acme',
    firstName: 'Alexander',
    lastName: 'Novak',
    email: 'a.novak@zenithsystems.com',
    phone: '+1 (555) 321-4401',
    companyId: 'comp-4',
    companyName: 'Zenith Systems Global',
    title: 'VP of Procurement',
    department: 'Purchasing',
    lifecycleStage: 'Customer',
    lastContacted: '2025-05-21T09:40:00Z'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    tenantId: 'tenant-acme',
    firstName: 'Harrison',
    lastName: 'Fordham',
    email: 'h.fordham@cyberapex.io',
    phone: '+1 (555) 712-9901',
    company: 'CyberApex Security',
    title: 'Chief Information Officer',
    status: 'Qualified',
    source: 'Website',
    score: 92,
    scoreTier: 'Hot',
    estimatedValue: 85000,
    assignedTo: 'usr-1',
    tags: ['Cybersecurity', 'High-Intent', 'Enterprise'],
    notes: 'Requested urgent demo for 500-seat multi-tenant rollout.',
    createdAt: '2025-05-10T08:30:00Z',
    lastContactedAt: '2025-05-18T10:15:00Z',
    customFields: { decisionMaker: true, currentCrm: 'Salesforce (Migrating)' }
  },
  {
    id: 'lead-2',
    tenantId: 'tenant-acme',
    firstName: 'Rebecca',
    lastName: 'Solis',
    email: 'rebecca.solis@pulsehealth.org',
    phone: '+1 (555) 412-8821',
    company: 'Pulse Healthcare Network',
    title: 'Director of Business Development',
    status: 'Contacted',
    source: 'Inbound Demo',
    score: 78,
    scoreTier: 'Warm',
    estimatedValue: 45000,
    assignedTo: 'usr-2',
    tags: ['Healthcare', 'HIPAA'],
    notes: 'Followed up after webinar. Evaluating pricing tiers.',
    createdAt: '2025-05-12T14:10:00Z',
    lastContactedAt: '2025-05-19T13:45:00Z',
    customFields: { decisionMaker: true, currentCrm: 'HubSpot' }
  },
  {
    id: 'lead-3',
    tenantId: 'tenant-acme',
    firstName: 'Harri',
    lastName: 'Fordham', // DUPLICATE CANDIDATE of lead-1!
    email: 'h.fordham@cyberapex.io',
    phone: '+1 (555) 712-9901',
    company: 'CyberApex',
    title: 'CIO',
    status: 'New',
    source: 'Event',
    score: 65,
    scoreTier: 'Warm',
    estimatedValue: 85000,
    assignedTo: 'usr-3',
    tags: ['Duplicate', 'Webform'],
    notes: 'Submitted contact form at SaaS Expo 2025.',
    createdAt: '2025-05-20T11:00:00Z',
    duplicateMatchIds: ['lead-1']
  },
  {
    id: 'lead-4',
    tenantId: 'tenant-acme',
    firstName: 'Kavita',
    lastName: 'Patel',
    email: 'k.patel@finovate.tech',
    phone: '+1 (555) 329-8472',
    company: 'Finovate Capital',
    title: 'VP of Technology',
    status: 'Proposal',
    source: 'Referral',
    score: 88,
    scoreTier: 'Hot',
    estimatedValue: 120000,
    assignedTo: 'usr-1',
    tags: ['FinTech', 'High-Value'],
    notes: 'Sent enterprise proposal and SLA agreement.',
    createdAt: '2025-05-04T09:00:00Z',
    lastContactedAt: '2025-05-20T15:30:00Z',
    customFields: { decisionMaker: true, currentCrm: 'Pipedrive' }
  },
  {
    id: 'lead-5',
    tenantId: 'tenant-acme',
    firstName: 'Derek',
    lastName: 'Sterling',
    email: 'derek@stratolabs.co',
    phone: '+1 (555) 819-2741',
    company: 'Strato Labs',
    title: 'Founder & CEO',
    status: 'New',
    source: 'LinkedIn',
    score: 42,
    scoreTier: 'Cold',
    estimatedValue: 15000,
    assignedTo: 'usr-3',
    tags: ['Startup', 'SMB'],
    notes: 'Connected via sales outreach on LinkedIn.',
    createdAt: '2025-05-19T16:20:00Z'
  },
  {
    id: 'lead-6',
    tenantId: 'tenant-acme',
    firstName: 'Kavita',
    lastName: 'Patel', // DUPLICATE CANDIDATE of lead-4!
    email: 'kavita@finovate.tech',
    phone: '+1 (555) 329-8472',
    company: 'Finovate Capital Group',
    title: 'VP Tech',
    status: 'New',
    source: 'Website',
    score: 55,
    scoreTier: 'Warm',
    estimatedValue: 120000,
    assignedTo: 'usr-2',
    tags: ['Duplicate Candidate'],
    notes: 'Re-entered through pricing calculator.',
    createdAt: '2025-05-21T08:15:00Z',
    duplicateMatchIds: ['lead-4']
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-1',
    tenantId: 'tenant-acme',
    title: 'Acme Corp Deal - Global Enterprise Suite',
    companyId: 'comp-1',
    companyName: 'Acme Corporation',
    contactId: 'cnt-1',
    contactName: 'Jake Williams',
    value: 75000,
    currency: '$',
    stageId: 'stage-proposal',
    probability: 60,
    expectedCloseDate: '2025-06-30',
    assignedTo: 'usr-1',
    priority: 'Urgent',
    tags: ['Enterprise', 'Multi-Year', 'Renewal'],
    createdAt: '2025-04-10T10:00:00Z',
    updatedAt: '2025-05-20T14:00:00Z',
    customFields: { paymentTerms: 'Annual Upfront', discountApplied: '15%' }
  },
  {
    id: 'deal-2',
    tenantId: 'tenant-acme',
    title: 'Beta Industries - Production Monitoring Suite',
    companyId: 'comp-2',
    companyName: 'Beta Industries',
    contactId: 'cnt-3',
    contactName: 'Michael Johnson',
    value: 45000,
    currency: '$',
    stageId: 'stage-qualify',
    probability: 40,
    expectedCloseDate: '2025-07-15',
    assignedTo: 'usr-2',
    priority: 'High',
    tags: ['Manufacturing', 'IoT'],
    createdAt: '2025-04-18T11:20:00Z',
    updatedAt: '2025-05-15T09:30:00Z'
  },
  {
    id: 'deal-3',
    tenantId: 'tenant-acme',
    title: 'Omega Partners - FinTech Gateway Integration',
    companyId: 'comp-3',
    companyName: 'Omega Partners Tech',
    contactId: 'cnt-4',
    contactName: 'Chloe Taylor',
    value: 95000,
    currency: '$',
    stageId: 'stage-negotiate',
    probability: 80,
    expectedCloseDate: '2025-06-15',
    assignedTo: 'usr-3',
    priority: 'Urgent',
    tags: ['FinTech', 'High-Yield'],
    createdAt: '2025-03-25T14:40:00Z',
    updatedAt: '2025-05-19T11:00:00Z'
  },
  {
    id: 'deal-4',
    tenantId: 'tenant-acme',
    title: 'Zenith Systems - Hybrid Cloud Orchestration',
    companyId: 'comp-4',
    companyName: 'Zenith Systems Global',
    contactId: 'cnt-5',
    contactName: 'Alexander Novak',
    value: 140000,
    currency: '$',
    stageId: 'stage-won',
    probability: 100,
    expectedCloseDate: '2025-05-14',
    assignedTo: 'usr-1',
    priority: 'Urgent',
    tags: ['Cloud', 'Closed-Won', 'Tier 1'],
    createdAt: '2025-02-10T09:00:00Z',
    updatedAt: '2025-05-14T17:00:00Z'
  },
  {
    id: 'deal-5',
    tenantId: 'tenant-acme',
    title: 'TechSolutions Inquiry - Starter Tier',
    companyId: 'comp-5',
    companyName: 'Delta Group Logistics',
    value: 18000,
    currency: '$',
    stageId: 'stage-prospect',
    probability: 20,
    expectedCloseDate: '2025-08-30',
    assignedTo: 'usr-2',
    priority: 'Medium',
    tags: ['Inbound', 'Discovery'],
    createdAt: '2025-05-02T13:15:00Z',
    updatedAt: '2025-05-18T10:00:00Z'
  },
  {
    id: 'deal-6',
    tenantId: 'tenant-acme',
    title: 'Apex Innovations - Advanced Analytics Engine',
    companyId: 'comp-2',
    companyName: 'Beta Industries',
    value: 60000,
    currency: '$',
    stageId: 'stage-proposal',
    probability: 60,
    expectedCloseDate: '2025-07-01',
    assignedTo: 'usr-3',
    priority: 'High',
    tags: ['Analytics', 'Expansion'],
    createdAt: '2025-04-22T15:30:00Z',
    updatedAt: '2025-05-16T14:20:00Z'
  },
  {
    id: 'deal-7',
    tenantId: 'tenant-acme',
    title: 'Summit Holdings - Multi-Branch License',
    companyId: 'comp-1',
    companyName: 'Acme Corporation',
    value: 125000,
    currency: '$',
    stageId: 'stage-negotiate',
    probability: 80,
    expectedCloseDate: '2025-06-20',
    assignedTo: 'usr-1',
    priority: 'Urgent',
    tags: ['Key-Account', 'Expansion'],
    createdAt: '2025-03-15T11:00:00Z',
    updatedAt: '2025-05-20T16:45:00Z'
  },
  {
    id: 'deal-8',
    tenantId: 'tenant-acme',
    title: 'Stellar Services - Data Pipeline API',
    companyId: 'comp-4',
    companyName: 'Zenith Systems Global',
    value: 35000,
    currency: '$',
    stageId: 'stage-lost',
    probability: 0,
    expectedCloseDate: '2025-05-01',
    assignedTo: 'usr-3',
    priority: 'Low',
    tags: ['API', 'Lost'],
    lostReason: 'Budget postponed to Q4',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-05-01T15:00:00Z'
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    tenantId: 'tenant-acme',
    type: 'meeting',
    title: 'Discovery & Platform Deep-Dive',
    description: 'Technical discovery call with Jake Williams & Sarah Chen. Discussed SAML SSO, audit logging, and SLA requirements.',
    timestamp: '2025-05-20T13:30:00Z',
    userId: 'usr-1',
    userName: 'Jessica Miller',
    relatedType: 'deal',
    relatedId: 'deal-1',
    relatedTitle: 'Acme Corp Deal',
    metadata: {
      durationMinutes: 45,
      meetingLocation: 'Google Meet / Zoom Room 4',
      isCompleted: true
    }
  },
  {
    id: 'act-2',
    tenantId: 'tenant-acme',
    type: 'email',
    title: 'Email Sent: Proposal & Security Whitepaper',
    description: 'Sent enterprise SLA breakdown, SOC2 summary, and pricing proposal deck to Jake Williams.',
    timestamp: '2025-05-20T11:15:00Z',
    userId: 'usr-1',
    userName: 'Jessica Miller',
    relatedType: 'deal',
    relatedId: 'deal-1',
    relatedTitle: 'Acme Corp Deal',
    metadata: {
      emailSubject: 'Octax Enterprise Proposal & Architecture Overview',
      emailTo: 'jake.williams@acmecorp.com'
    }
  },
  {
    id: 'act-3',
    tenantId: 'tenant-acme',
    type: 'call',
    title: 'Phone Call: Initial Requirements Alignment',
    description: 'Spoke with Jake Williams about enterprise plan seating requirements. Confirmed 45 seat licenses needed for July kickoff.',
    timestamp: '2025-05-20T10:30:00Z',
    userId: 'usr-1',
    userName: 'Jessica Miller',
    relatedType: 'deal',
    relatedId: 'deal-1',
    relatedTitle: 'Acme Corp Deal',
    metadata: {
      durationMinutes: 18,
      callOutcome: 'Connected'
    }
  },
  {
    id: 'act-4',
    tenantId: 'tenant-acme',
    type: 'task',
    title: 'Follow-up Meeting: Demo Platform Q&A',
    description: 'Schedule engineering demo with VP of Security before contract signoff.',
    timestamp: '2025-05-20T15:00:00Z',
    userId: 'usr-1',
    userName: 'Jessica Miller',
    relatedType: 'deal',
    relatedId: 'deal-1',
    relatedTitle: 'Acme Corp Deal',
    metadata: {
      dueDate: '2025-05-24',
      priority: 'High',
      isCompleted: false
    }
  },
  {
    id: 'act-5',
    tenantId: 'tenant-acme',
    type: 'note',
    title: 'Internal Strategy Note',
    description: 'Procurement requested net 45 payment terms. Approved by finance as deal value exceeds $70k.',
    timestamp: '2025-05-20T16:30:00Z',
    userId: 'usr-2',
    userName: 'Marcus Vance',
    relatedType: 'deal',
    relatedId: 'deal-1',
    relatedTitle: 'Acme Corp Deal'
  },
  {
    id: 'act-6',
    tenantId: 'tenant-acme',
    type: 'stage_change',
    title: 'Stage Moved to Closed Won 🎉',
    description: 'Deal was closed and won by Jessica Miller! Automated onboarding email and setup task triggered.',
    timestamp: '2025-05-14T17:00:00Z',
    userId: 'usr-1',
    userName: 'Jessica Miller',
    relatedType: 'deal',
    relatedId: 'deal-4',
    relatedTitle: 'Zenith Systems Hybrid Cloud',
    metadata: {
      stageFrom: 'Negotiation',
      stageTo: 'Closed Won'
    }
  }
];

export const INITIAL_TASKS: TaskReminder[] = [
  {
    id: 'tsk-1',
    tenantId: 'tenant-acme',
    title: 'Follow-up on Acme Corp MSA Redlines',
    dueDate: '2025-05-22',
    dueTime: '14:00',
    priority: 'Urgent',
    completed: false,
    assignedTo: 'usr-1',
    relatedType: 'deal',
    relatedId: 'deal-1',
    relatedName: 'Acme Corp Deal'
  },
  {
    id: 'tsk-2',
    tenantId: 'tenant-acme',
    title: 'Send Custom API Pricing Matrix to Chloe',
    dueDate: '2025-05-23',
    dueTime: '11:30',
    priority: 'High',
    completed: false,
    assignedTo: 'usr-3',
    relatedType: 'deal',
    relatedId: 'deal-3',
    relatedName: 'Omega Partners Tech'
  },
  {
    id: 'tsk-3',
    tenantId: 'tenant-acme',
    title: 'Lead Outreach: Call Harrison at CyberApex',
    dueDate: '2025-05-21',
    dueTime: '16:00',
    priority: 'High',
    completed: false,
    assignedTo: 'usr-1',
    relatedType: 'lead',
    relatedId: 'lead-1',
    relatedName: 'CyberApex Security'
  },
  {
    id: 'tsk-4',
    tenantId: 'tenant-acme',
    title: 'Resolve Duplicate Lead Records (Finovate Capital)',
    dueDate: '2025-05-24',
    dueTime: '17:00',
    priority: 'Medium',
    completed: false,
    assignedTo: 'usr-2',
    relatedType: 'lead',
    relatedId: 'lead-6',
    relatedName: 'Finovate Capital Group'
  }
];

export const INITIAL_WORKFLOWS: WorkflowRule[] = [
  {
    id: 'wf-1',
    tenantId: 'tenant-acme',
    name: 'Closed-Won Automated Client Welcome & Team Alert',
    description: 'When a deal enters "Closed Won", immediately send simulated onboarding email to client and notify sales team.',
    trigger: 'deal_stage_changed',
    conditions: [
      { field: 'stageId', operator: 'equals', value: 'stage-won' }
    ],
    actions: [
      {
        type: 'send_simulated_email',
        params: {
          template: 'Welcome & Next Steps',
          subject: 'Welcome to Octax Cloud - Your Onboarding Journey Begins!'
        }
      },
      {
        type: 'create_task',
        params: {
          title: 'Schedule Executive Onboarding Kickoff Call',
          priority: 'Urgent'
        }
      },
      {
        type: 'show_toast',
        params: {
          message: '🎉 Deal Closed Won! Automated onboarding workflow initiated.'
        }
      }
    ],
    enabled: true,
    executionsCount: 14,
    lastExecutedAt: '2025-05-14T17:00:00Z'
  },
  {
    id: 'wf-2',
    tenantId: 'tenant-acme',
    name: 'High-Intent Hot Lead Escalation (Score >= 80)',
    description: 'Automatically elevate priority to Urgent and create follow-up task when a lead score reaches 80 or above.',
    trigger: 'lead_score_exceeded',
    conditions: [
      { field: 'score', operator: 'greater_than', value: 79 }
    ],
    actions: [
      {
        type: 'create_task',
        params: {
          title: 'Immediate 1-Hour Outreach for Hot Inbound Lead',
          priority: 'Urgent'
        }
      },
      {
        type: 'send_simulated_email',
        params: {
          template: 'Fast Track Demo Confirmation',
          subject: 'Priority Access: Your Octax Platform Demo is Scheduled'
        }
      }
    ],
    enabled: true,
    executionsCount: 38,
    lastExecutedAt: '2025-05-18T10:15:00Z'
  },
  {
    id: 'wf-3',
    tenantId: 'tenant-acme',
    name: 'Enterprise Deal High-Value Flag (> $50,000)',
    description: 'Automatically tag deal as Urgent and alert Sales VP when value exceeds $50,000.',
    trigger: 'deal_created',
    conditions: [
      { field: 'value', operator: 'greater_than', value: 50000 }
    ],
    actions: [
      {
        type: 'change_deal_priority',
        params: { priority: 'Urgent' }
      },
      {
        type: 'show_toast',
        params: { message: '🚀 High-value enterprise opportunity registered ($50k+)' }
      }
    ],
    enabled: true,
    executionsCount: 9,
    lastExecutedAt: '2025-05-20T14:00:00Z'
  }
];

export const INITIAL_ASSIGNMENT_RULES: LeadAssignmentRule[] = [
  {
    id: 'rule-1',
    tenantId: 'tenant-acme',
    name: 'Round-Robin Inbound Routing',
    strategy: 'round_robin',
    assignToUserIds: ['usr-1', 'usr-2', 'usr-3'],
    active: true
  },
  {
    id: 'rule-2',
    tenantId: 'tenant-acme',
    name: 'Enterprise VIP Routing (Score > 85)',
    strategy: 'lead_score_tier',
    criteria: {
      field: 'score',
      operator: 'greater_than',
      value: 85
    },
    assignToUserIds: ['usr-1'], // Assign to Jessica (VP)
    active: true
  }
];

export const INITIAL_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-1',
    tenantId: 'tenant-acme',
    entity: 'deal',
    key: 'paymentTerms',
    label: 'Payment Terms',
    type: 'select',
    options: ['Net 30', 'Net 45', 'Annual Upfront', 'Quarterly'],
    required: false
  },
  {
    id: 'cf-2',
    tenantId: 'tenant-acme',
    entity: 'deal',
    key: 'discountApplied',
    label: 'Discount Percentage',
    type: 'text',
    required: false
  },
  {
    id: 'cf-3',
    tenantId: 'tenant-acme',
    entity: 'lead',
    key: 'currentCrm',
    label: 'Current CRM System',
    type: 'select',
    options: ['Salesforce', 'HubSpot', 'Pipedrive', 'Spreadsheets', 'None'],
    required: false
  },
  {
    id: 'cf-4',
    tenantId: 'tenant-acme',
    entity: 'lead',
    key: 'decisionMaker',
    label: 'Is Decision Maker?',
    type: 'boolean',
    required: false
  },
  {
    id: 'cf-5',
    tenantId: 'tenant-acme',
    entity: 'company',
    key: 'securityClearance',
    label: 'Compliance Level',
    type: 'select',
    options: ['SOC2 Type II', 'ISO 27001', 'HIPAA', 'FedRAMP Ready', 'Standard'],
    required: false
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    tenantId: 'tenant-acme',
    title: 'Automated Email Dispatched',
    message: 'Proposal & Whitepaper sent to Jake Williams (Acme Corp). Logged to Activity Timeline.',
    type: 'email',
    timestamp: '2025-05-20T11:15:00Z',
    read: false,
    link: '/pipeline'
  },
  {
    id: 'notif-2',
    tenantId: 'tenant-acme',
    title: 'Deal Won: Zenith Systems',
    message: 'Congratulations! $140,000 deal moved to Closed Won. Onboarding workflow triggered.',
    type: 'deal',
    timestamp: '2025-05-14T17:00:00Z',
    read: false,
    link: '/pipeline'
  },
  {
    id: 'notif-3',
    tenantId: 'tenant-acme',
    title: 'Duplicate Lead Detected',
    message: 'Potential duplicate lead detected for "CyberApex Security". Review merge recommendations.',
    type: 'lead',
    timestamp: '2025-05-20T11:05:00Z',
    read: false,
    link: '/leads'
  },
  {
    id: 'notif-4',
    tenantId: 'tenant-acme',
    title: 'Workflow Executed',
    message: 'High-Intent Hot Lead Escalation triggered for Harrison Fordham (Score: 92).',
    type: 'workflow',
    timestamp: '2025-05-18T10:15:00Z',
    read: true,
    link: '/workflows'
  }
];
