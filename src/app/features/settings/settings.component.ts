import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../core/services/crm-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomFieldDefinition, UserRole } from '../../core/models/crm.models';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ModalComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Top Header -->
      <div class="pb-2 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tenant Settings & Configurations</h1>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Multi-Tenant Administration
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Tenant-specific settings, dynamic custom field schemas, lead assignment rules, and role-based permissions.
        </p>
      </div>

      <!-- Navigation tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          (click)="activeTab.set('tenant')"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition"
          [class.bg-indigo-600]="activeTab() === 'tenant'"
          [class.text-white]="activeTab() === 'tenant'"
          [class.text-slate-600]="activeTab() !== 'tenant'">
          Tenant Organization
        </button>
        <button
          (click)="activeTab.set('custom_fields')"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition"
          [class.bg-indigo-600]="activeTab() === 'custom_fields'"
          [class.text-white]="activeTab() === 'custom_fields'"
          [class.text-slate-600]="activeTab() !== 'custom_fields'">
          Custom Fields & Dynamic Forms ({{ crmState.tenantCustomFields().length }})
        </button>
        <button
          (click)="activeTab.set('assignment')"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition"
          [class.bg-indigo-600]="activeTab() === 'assignment'"
          [class.text-white]="activeTab() === 'assignment'"
          [class.text-slate-600]="activeTab() !== 'assignment'">
          Lead Assignment Rules
        </button>
        <button
          (click)="activeTab.set('roles')"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition"
          [class.bg-indigo-600]="activeTab() === 'roles'"
          [class.text-white]="activeTab() === 'roles'"
          [class.text-slate-600]="activeTab() !== 'roles'">
          Role-Based Access (RBAC)
        </button>
      </div>

      <!-- TAB 1: Tenant Organization Settings -->
      @if (activeTab() === 'tenant') {
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl space-y-5">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Active Tenant Profile</h3>
            <p class="text-xs text-slate-500">Settings apply strictly to {{ crmState.currentTenant().name }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
              <input
                type="text"
                [(ngModel)]="tenantName"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Currency Code & Symbol</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="currencySymbol"
                    class="w-16 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-bold">
                  <input
                    type="text"
                    [(ngModel)]="currencyCode"
                    class="w-24 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold text-center">
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Industry</label>
                <input
                  type="text"
                  [(ngModel)]="tenantIndustry"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
              <input
                type="text"
                [(ngModel)]="tenantTimezone"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                (click)="crmState.reloadPublicJson(true)"
                class="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5">
                <app-icon name="sparkles" [size]="14"></app-icon>
                <span>Reload from public/data JSON</span>
              </button>

              <button
                (click)="saveTenantSettings()"
                class="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                Save Tenant Configuration
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: Dynamic Custom Fields Manager -->
      @if (activeTab() === 'custom_fields') {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Dynamic Form & Schema Fields</h3>
              <p class="text-xs text-slate-500">Custom fields automatically render in creation and detail forms</p>
            </div>

            <button
              (click)="openAddFieldModal()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>Add Custom Field</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (field of crmState.tenantCustomFields(); track field.id) {
              <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">{{ field.label }}</span>
                    <span class="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      {{ field.entity }}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-400 mt-1">
                    Key: <code class="text-slate-600 dark:text-slate-300 font-mono">{{ field.key }}</code> • Type: {{ field.type }}
                  </div>
                  @if (field.options && field.options.length > 0) {
                    <div class="mt-2 text-[10px] text-slate-500">
                      Options: {{ field.options.join(', ') }}
                    </div>
                  }
                </div>

                <button
                  (click)="crmState.deleteCustomField(field.id)"
                  class="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Remove Field">
                  <app-icon name="trash" [size]="14"></app-icon>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 3: Lead Assignment Rules -->
      @if (activeTab() === 'assignment') {
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl space-y-5">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Automated Lead Routing Rules</h3>
            <p class="text-xs text-slate-500">Leads entering via web forms or API are automatically routed based on active policies.</p>
          </div>

          <div class="space-y-3">
            @for (rule of crmState.leadAssignmentRules(); track rule.id) {
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">{{ rule.name }}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {{ rule.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">
                    Strategy: <strong class="text-slate-700 dark:text-slate-300">{{ rule.strategy }}</strong>
                    @if (rule.criteria) {
                      • If {{ rule.criteria.field }} > {{ rule.criteria.value }}
                    }
                  </p>
                </div>

                <div class="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Assigned: {{ rule.assignToUserIds.length }} reps in pool
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 4: RBAC Role-Based Permissions Matrix -->
      @if (activeTab() === 'roles') {
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Role-Based Access Control (RBAC) Matrix</h3>
            <p class="text-xs text-slate-500">Permissions enforced across navigation, workflow editing, and exports</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th class="py-3 px-4">Feature / Action</th>
                  <th class="py-3 px-4">Admin</th>
                  <th class="py-3 px-4">Sales Manager</th>
                  <th class="py-3 px-4">Sales Rep</th>
                  <th class="py-3 px-4">Viewer</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">View Leads & Deals</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ All</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Team</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Assigned</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Read-only</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Create & Drag Deals on Kanban</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-slate-300 dark:text-slate-600 font-bold">✗</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Configure Workflow Automation</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-slate-300 dark:text-slate-600 font-bold">✗</td>
                  <td class="py-3 px-4 text-slate-300 dark:text-slate-600 font-bold">✗</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Export CSV / Excel</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-slate-300 dark:text-slate-600 font-bold">✗</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Manage Tenant Custom Fields</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">✓ Full</td>
                  <td class="py-3 px-4 text-slate-300 dark:text-slate-600 font-bold">✗</td>
                  <td class="py-3 px-4 text-slate-300 dark:text-slate-600 font-bold">✗</td>
                  <td class="py-3 px-4 text-slate-300 dark:text-slate-600 font-bold">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL: Add Custom Field -->
      <!-- MODAL: Add Dynamic Custom Field -->
      <app-modal
        [isOpen]="isAddFieldModalOpen"
        title="Add Dynamic Custom Field"
        subtitle="Define a custom schema attribute for leads, deals, contacts, or companies"
        icon="settings"
        badge="Schema Studio"
        maxWidth="640px"
        (close)="isAddFieldModalOpen = false">

        <form (ngSubmit)="submitCustomField()" class="flex-1 flex flex-col min-h-0 overflow-hidden">

          <!-- Middle Scrollable Section (Between Top Header & Bottom Footer) -->
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1 space-y-4">

            <!-- Live Schema Blueprint Preview Card (Reference Image 3 Style) -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50/80 to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs">
            <div class="flex items-center justify-between gap-3 mb-2.5">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/25">
                  <app-icon name="settings" [size]="18"></app-icon>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {{ newFieldLabel.trim() || 'New Schema Attribute' }}
                    </h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {{ newFieldEntity.toUpperCase() }} FORM
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Field Key: <code class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{{ newFieldKey || 'customAttribute' }}</code> • Type: {{ newFieldType }}
                  </p>
                </div>
              </div>

              <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:flex items-center gap-1 shadow-2xs">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tenant Scoped</span>
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/70 dark:border-indigo-900/40 text-center">
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                📋 Form Injection
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                ⚡ Instant Reactive
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold truncate">
                🔒 Isolated Schema
              </div>
            </div>
          </div>

          <!-- Form Inputs Section -->
          <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <app-icon name="settings" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Attribute Properties</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <!-- Target Entity & Label -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Entity Form <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <select
                    [(ngModel)]="newFieldEntity"
                    name="entity"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="lead">Lead Registration Form</option>
                    <option value="deal">Sales Opportunity Form</option>
                    <option value="company">Customer Company Form</option>
                    <option value="contact">Stakeholder Contact Form</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Human-Readable Field Label <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="newFieldLabel"
                  (ngModelChange)="onLabelChange($event)"
                  name="label"
                  required
                  placeholder="e.g. Current Tech Stack"
                  class="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
              </div>
            </div>

            <!-- Data Type & Schema Key -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Attribute Data Type</label>
                <div class="relative">
                  <select
                    [(ngModel)]="newFieldType"
                    name="type"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="text">📝 Text String</option>
                    <option value="number">🔢 Numeric Value</option>
                    <option value="select">📋 Dropdown Select Options</option>
                    <option value="boolean">🔘 Boolean Toggle (Enabled/Disabled)</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  JSON Schema Key <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="newFieldKey"
                  name="key"
                  required
                  placeholder="e.g. currentTechStack"
                  class="w-full font-mono px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
              </div>
            </div>

            <!-- Options if select -->
            @if (newFieldType === 'select') {
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dropdown Options (Comma-Separated)</label>
                <input
                  type="text"
                  [(ngModel)]="newFieldOptions"
                  name="options"
                  placeholder="Salesforce, HubSpot, Microsoft Dynamics, In-house Legacy"
                  class="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
              </div>
            }
          </div>

          </div>

          <!-- FIXED PINNED BOTTOM SECTION (Always visible, never scrolled) -->
          <div class="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <app-icon name="check" [size]="13" class="text-indigo-500"></app-icon>
              <span>Instant schema validation & form propagation</span>
            </span>
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                (click)="isAddFieldModalOpen = false"
                class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Register Custom Field</span>
              </button>
            </div>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class SettingsComponent {
  crmState = inject(CrmStateService);
  notificationService = inject(NotificationService);

  activeTab = signal<'tenant' | 'custom_fields' | 'assignment' | 'roles'>('tenant');

  // Tenant settings form
  tenantName = this.crmState.currentTenant().name;
  currencySymbol = this.crmState.currentTenant().currency;
  currencyCode = this.crmState.currentTenant().currencyCode;
  tenantIndustry = this.crmState.currentTenant().industry;
  tenantTimezone = this.crmState.currentTenant().timezone;

  // Custom field modal
  isAddFieldModalOpen = false;
  newFieldEntity: CustomFieldDefinition['entity'] = 'lead';
  newFieldLabel = '';
  newFieldType: CustomFieldDefinition['type'] = 'text';
  newFieldKey = '';
  newFieldOptions = '';

  saveTenantSettings() {
    this.crmState.tenants.update(tenants =>
      tenants.map(t => t.id === this.crmState.currentTenantId() ? {
        ...t,
        name: this.tenantName,
        currency: this.currencySymbol,
        currencyCode: this.currencyCode,
        industry: this.tenantIndustry,
        timezone: this.tenantTimezone
      } : t)
    );
    this.notificationService.showToast('success', 'Tenant Updated', 'Organization settings saved.');
  }

  openAddFieldModal() {
    this.newFieldLabel = '';
    this.newFieldKey = '';
    this.newFieldOptions = 'Enterprise, Mid-Market, SMB';
    this.isAddFieldModalOpen = true;
  }

  onLabelChange(val: string) {
    this.newFieldKey = (val || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  }

  submitCustomField() {
    if (!this.newFieldLabel) return;
    const key = this.newFieldKey || this.newFieldLabel.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

    const options = this.newFieldType === 'select'
      ? this.newFieldOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    this.crmState.addCustomField({
      entity: this.newFieldEntity,
      key,
      label: this.newFieldLabel,
      type: this.newFieldType,
      options
    });

    this.isAddFieldModalOpen = false;
  }
}
