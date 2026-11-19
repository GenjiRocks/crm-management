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
      <app-modal
        [isOpen]="isAddFieldModalOpen"
        title="Add Dynamic Custom Field"
        subtitle="Define a schema field for leads, deals, or companies"
        icon="plus"
        maxWidth="500px"
        (close)="isAddFieldModalOpen = false">

        <form (ngSubmit)="submitCustomField()" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Target Entity *</label>
            <select
              [(ngModel)]="newFieldEntity"
              name="entity"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="lead">Lead Form</option>
              <option value="deal">Deal Form</option>
              <option value="company">Company Form</option>
              <option value="contact">Contact Form</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Field Label *</label>
            <input
              type="text"
              [(ngModel)]="newFieldLabel"
              name="label"
              required
              placeholder="e.g. Current Tech Stack"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Data Type</label>
              <select
                [(ngModel)]="newFieldType"
                name="type"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Dropdown Select</option>
                <option value="boolean">Boolean Switch</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Schema Key</label>
              <input
                type="text"
                [(ngModel)]="newFieldKey"
                name="key"
                placeholder="techStack"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
            </div>
          </div>

          @if (newFieldType === 'select') {
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Options (comma separated)</label>
              <input
                type="text"
                [(ngModel)]="newFieldOptions"
                name="options"
                placeholder="Option 1, Option 2, Option 3"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
            </div>
          }

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              (click)="isAddFieldModalOpen = false"
              class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              Create Field
            </button>
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
