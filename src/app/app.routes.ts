import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'leads',
    loadComponent: () => import('./features/leads/leads.component').then(m => m.LeadsComponent)
  },
  {
    path: 'pipeline',
    loadComponent: () => import('./features/pipeline/pipeline.component').then(m => m.PipelineComponent)
  },
  {
    path: 'companies',
    loadComponent: () => import('./features/companies/companies.component').then(m => m.CompaniesComponent)
  },
  {
    path: 'contacts',
    loadComponent: () => import('./features/contacts/contacts.component').then(m => m.ContactsComponent)
  },
  {
    path: 'activities',
    loadComponent: () => import('./features/activities/activities.component').then(m => m.ActivitiesComponent)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent)
  },
  {
    path: 'workflows',
    loadComponent: () => import('./features/workflows/workflows.component').then(m => m.WorkflowsComponent)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
