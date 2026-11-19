import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../core/services/crm-state.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { Contact } from '../../core/models/crm.models';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { DynamicFieldsComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ModalComponent, DynamicFieldsComponent, TimeAgoPipe],
  template: `
    <div class="space-y-5 animate-fade-in">
      
      <!-- Top Header & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Contacts Management</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              People & Stakeholders
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ crmState.tenantContacts().length }} decision makers & team contacts across active client accounts.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            (click)="exportContactsCsv()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-sm transition">
            <app-icon name="download" [size]="14"></app-icon>
            <span>CSV</span>
          </button>
          <button
            (click)="exportContactsExcel()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-sm">
            <app-icon name="download" [size]="14"></app-icon>
            <span>Excel</span>
          </button>
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      <!-- Contacts Table -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th class="py-3.5 px-4">Contact</th>
                <th class="py-3.5 px-4">Company</th>
                <th class="py-3.5 px-4">Title & Dept</th>
                <th class="py-3.5 px-4">Email</th>
                <th class="py-3.5 px-4">Phone</th>
                <th class="py-3.5 px-4">Lifecycle Stage</th>
                <th class="py-3.5 px-4 text-right">Quick Communication</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              @for (contact of crmState.tenantContacts(); track contact.id) {
                <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                        {{ contact.firstName.substring(0, 1) }}{{ contact.lastName.substring(0, 1) }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 dark:text-white">{{ contact.firstName }} {{ contact.lastName }}</div>
                        <div class="text-[10px] text-slate-400">Last touch: {{ contact.lastContacted | timeAgo }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {{ contact.companyName }}
                  </td>
                  <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {{ contact.title }}
                  </td>
                  <td class="py-3 px-4 text-indigo-600 dark:text-indigo-400">
                    {{ contact.email }}
                  </td>
                  <td class="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {{ contact.phone }}
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {{ contact.lifecycleStage }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button
                      type="button"
                      (click)="mockSendEmailTo(contact)"
                      class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] font-semibold transition inline-flex items-center gap-1">
                      <app-icon name="mail" [size]="12"></app-icon>
                      <span>Simulate Email</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: Add Contact -->
      <app-modal
        [isOpen]="isCreateModalOpen"
        title="Add Stakeholder Contact"
        subtitle="Associate a key decision maker or stakeholder with an active customer account"
        icon="contacts"
        badge="Stakeholder Hub"
        maxWidth="680px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitCreateContact()" class="flex-1 flex flex-col min-h-0 overflow-hidden">

          <!-- Middle Scrollable Section (Between Top Header & Bottom Footer) -->
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1 space-y-4">

            <!-- 1. Live Stakeholder Profile Preview Card (Reference Image 3 Style) -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50/80 to-blue-50/60 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-blue-950/30 border border-indigo-100/90 dark:border-indigo-900/50 shadow-xs">
            <div class="flex items-center justify-between gap-3 mb-2.5">
              <div class="flex items-center gap-3">
                <!-- Squircle Monogram Avatar -->
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/25">
                  {{ getContactInitials() }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {{ (firstName + ' ' + lastName).trim() || 'New Stakeholder' }}
                    </h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {{ title || 'Decision Maker' }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    🏢 {{ getSelectedCompanyName() }} • {{ email || 'email@company.com' }}
                  </p>
                </div>
              </div>

              <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Profile</span>
              </span>
            </div>

            <!-- Mini Quick Chips -->
            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/70 dark:border-indigo-900/40 text-center">
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                📞 {{ phone || '+1 (555) 000-0000' }}
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                ✉️ Direct Dispatches
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold truncate">
                ⚡ Opportunity Stage
              </div>
            </div>
          </div>

          <!-- 2. Form Inputs Section -->
          <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <app-icon name="user" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Stakeholder Information</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <!-- Name Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="user" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="firstName"
                    name="firstName"
                    required
                    placeholder="e.g. Alex"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="user" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="lastName"
                    name="lastName"
                    required
                    placeholder="e.g. Mercer"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            </div>

            <!-- Company Select -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Associated Customer Account <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="building" [size]="14"></app-icon>
                </span>
                <select
                  [(ngModel)]="companyId"
                  name="companyId"
                  required
                  class="w-full appearance-none pl-10 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs">
                  <option value="">-- Select Company --</option>
                  @for (comp of crmState.tenantCompanies(); track comp.id) {
                    <option [value]="comp.id">{{ comp.name }} ({{ comp.tier }})</option>
                  }
                </select>
                <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="chevron-down" [size]="13"></app-icon>
                </span>
              </div>
            </div>

            <!-- Email & Phone -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="mail" [size]="14"></app-icon>
                  </span>
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    placeholder="alex@company.com"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Direct Phone</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="phone" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="phone"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            </div>

            <!-- Job Title, Department & Lifecycle -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="briefcase" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="title"
                    name="title"
                    placeholder="e.g. Chief Operating Officer"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <div class="relative">
                  <select
                    [(ngModel)]="department"
                    name="department"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="Executive Leadership">Executive Leadership</option>
                    <option value="Engineering & Product">Engineering & Product</option>
                    <option value="Finance & Procurement">Finance & Procurement</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                    <option value="Sales & Operations">Sales & Operations</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lifecycle Stage</label>
                <div class="relative">
                  <select
                    [(ngModel)]="lifecycleStage"
                    name="lifecycleStage"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="Opportunity">Opportunity</option>
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                    <option value="Advocate">Advocate</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Dynamic Custom Fields for Contact -->
          <app-dynamic-fields
            entityType="contact"
            [values]="customFields"
            (valuesChange)="customFields = $event">
          </app-dynamic-fields>

          </div>

          <!-- FIXED PINNED BOTTOM SECTION (Always visible, never scrolled) -->
          <div class="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <app-icon name="shield" [size]="13" class="text-indigo-500"></app-icon>
              <span>Encrypted stakeholder contact profile</span>
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
                <span>Save Stakeholder</span>
              </button>
            </div>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class ContactsComponent {
  crmState = inject(CrmStateService);
  exportService = inject(ExportService);
  notificationService = inject(NotificationService);

  isCreateModalOpen = false;
  firstName = '';
  lastName = '';
  companyId = '';
  email = '';
  phone = '+1 (555) ';
  title = '';
  department = 'Executive Leadership';
  lifecycleStage: Contact['lifecycleStage'] = 'Opportunity';
  customFields: Record<string, any> = {};

  getContactInitials(): string {
    const f = (this.firstName || '').trim();
    const l = (this.lastName || '').trim();
    if (!f && !l) return 'SC';
    return ((f ? f[0] : '') + (l ? l[0] : '')).toUpperCase();
  }

  getSelectedCompanyName(): string {
    const c = this.crmState.tenantCompanies().find(comp => comp.id === this.companyId);
    return c ? c.name : 'Select Company';
  }

  openCreateModal() {
    this.firstName = '';
    this.lastName = '';
    this.companyId = this.crmState.tenantCompanies()[0]?.id || '';
    this.email = '';
    this.phone = '+1 (555) 234-5678';
    this.title = 'Director of Operations';
    this.department = 'Executive Leadership';
    this.lifecycleStage = 'Opportunity';
    this.customFields = {};
    this.isCreateModalOpen = true;
  }

  submitCreateContact() {
    if (!this.firstName || !this.email || !this.companyId) {
      this.notificationService.showToast('error', 'Validation Error', 'Name, email, and company required.');
      return;
    }

    const company = this.crmState.tenantCompanies().find(c => c.id === this.companyId);

    this.crmState.createContact({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      companyId: this.companyId,
      companyName: company ? company.name : 'Client Co',
      title: this.title || 'Stakeholder',
      department: this.department,
      lifecycleStage: this.lifecycleStage,
      customFields: this.customFields
    });

    this.isCreateModalOpen = false;
  }

  async mockSendEmailTo(contact: Contact) {
    const subject = `Octax Platform Sync: ${contact.companyName}`;
    await this.notificationService.simulateSendEmail(contact.email, subject, `Hi ${contact.firstName}, touching base on our platform requirements.`);
    this.crmState.logActivity({
      type: 'email',
      title: `Email Sent to ${contact.firstName} ${contact.lastName}`,
      description: `Dispatched direct sync message to ${contact.email}.`,
      relatedType: 'contact',
      relatedId: contact.id,
      metadata: { emailSubject: subject, emailTo: contact.email }
    });
  }

  exportContactsCsv() {
    const data = this.crmState.tenantContacts().map(c => ({
      'Name': `${c.firstName} ${c.lastName}`,
      'Email': c.email,
      'Phone': c.phone,
      'Company': c.companyName,
      'Title': c.title,
      'Stage': c.lifecycleStage
    }));
    this.exportService.exportToCsv(data, `${this.crmState.currentTenant().slug}_contacts`);
  }

  exportContactsExcel() {
    const data = this.crmState.tenantContacts().map(c => ({
      'Name': `${c.firstName} ${c.lastName}`,
      'Email': c.email,
      'Phone': c.phone,
      'Company': c.companyName,
      'Title': c.title,
      'Stage': c.lifecycleStage
    }));
    this.exportService.exportToExcel(data, `${this.crmState.currentTenant().slug}_contacts`, 'Contacts');
  }
}
