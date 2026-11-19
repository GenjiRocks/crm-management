import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../core/services/crm-state.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { Company } from '../../core/models/crm.models';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { DynamicFieldsComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ModalComponent, DynamicFieldsComponent, CurrencyFormatPipe],
  template: `
    <div class="space-y-5 animate-fade-in">
      
      <!-- Top Header & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customer & Company Directory</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Account Management
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage client accounts, tiers, annual contract values, and linked opportunities.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            (click)="exportCompaniesCsv()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-sm transition">
            <app-icon name="download" [size]="14"></app-icon>
            <span>CSV</span>
          </button>
          <button
            (click)="exportCompaniesExcel()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-sm">
            <app-icon name="download" [size]="14"></app-icon>
            <span>Excel</span>
          </button>
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Add Company</span>
          </button>
        </div>
      </div>

      <!-- Companies Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (comp of crmState.tenantCompanies(); track comp.id) {
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4">
            
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                  {{ comp.name.substring(0, 2).toUpperCase() }}
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">{{ comp.name }}</h3>
                  <a [href]="comp.website" target="_blank" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    {{ comp.website.replace('https://', '') }}
                  </a>
                </div>
              </div>

              <span
                class="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                [ngClass]="{
                  'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300': comp.tier === 'Enterprise',
                  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300': comp.tier === 'Mid-Market',
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': comp.tier === 'SMB'
                }">
                {{ comp.tier }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 dark:border-slate-800 py-3">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Industry</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">{{ comp.industry }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Employees</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">{{ comp.size }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Annual Rev.</span>
                <span class="font-bold text-emerald-600">{{ comp.annualRevenue | crmCurrency }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Lead Rep</span>
                <span class="font-medium text-slate-700 dark:text-slate-300">{{ crmState.getUserName(comp.assignedTo).split(' ')[0] }}</span>
              </div>
            </div>

            <!-- Associated Deals count -->
            <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{{ getCompanyDealsCount(comp.id) }} Linked Deals</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ getCompanyDealsTotal(comp.id) | crmCurrency }} Pipeline
              </span>
            </div>

          </div>
        }
      </div>

      <!-- MODAL: Add Company -->
      <app-modal
        [isOpen]="isCreateModalOpen"
        title="Register Customer Account"
        subtitle="Establish an account profile for sales opportunities and key contacts"
        icon="companies"
        badge="Account Hub"
        maxWidth="640px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitCreateCompany()" class="space-y-4">
          <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="building" [size]="14"></app-icon>
                </span>
                <input
                  type="text"
                  [(ngModel)]="name"
                  name="name"
                  required
                  placeholder="e.g. Acme Corporation"
                  class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry Sector</label>
                <input
                  type="text"
                  [(ngModel)]="industry"
                  name="industry"
                  placeholder="Enterprise Software / SaaS"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs">
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Tier</label>
                <div class="relative">
                  <select
                    [(ngModel)]="tier"
                    name="tier"
                    class="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-8 shadow-2xs">
                    <option value="Enterprise">🏢 Enterprise Tier</option>
                    <option value="Mid-Market">⚡ Mid-Market</option>
                    <option value="SMB">🌱 SMB Growth</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Website</label>
                <input
                  type="text"
                  [(ngModel)]="website"
                  name="website"
                  placeholder="https://company.com"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs">
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Annual Revenue ({{ crmState.currencySymbol() }})
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    {{ crmState.currencySymbol() }}
                  </span>
                  <input
                    type="number"
                    [(ngModel)]="annualRevenue"
                    name="rev"
                    placeholder="25000000"
                    class="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs">
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Custom Fields for Company -->
          <app-dynamic-fields
            entityType="company"
            [values]="customFields"
            (valuesChange)="customFields = $event">
          </app-dynamic-fields>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              (click)="isCreateModalOpen = false"
              class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-1.5">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>Save Account</span>
            </button>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class CompaniesComponent {
  crmState = inject(CrmStateService);
  exportService = inject(ExportService);
  notificationService = inject(NotificationService);

  isCreateModalOpen = false;
  name = '';
  industry = 'Enterprise Cloud';
  tier: Company['tier'] = 'Enterprise';
  website = 'https://';
  annualRevenue = 25000000;
  customFields: Record<string, any> = {};

  getCompanyDealsCount(companyId: string): number {
    return this.crmState.tenantDeals().filter(d => d.companyId === companyId).length;
  }

  getCompanyDealsTotal(companyId: string): number {
    return this.crmState.tenantDeals()
      .filter(d => d.companyId === companyId)
      .reduce((sum, d) => sum + d.value, 0);
  }

  openCreateModal() {
    this.name = '';
    this.industry = 'Technology & Cloud';
    this.tier = 'Enterprise';
    this.website = 'https://';
    this.annualRevenue = 20000000;
    this.customFields = { securityClearance: 'SOC2 Type II' };
    this.isCreateModalOpen = true;
  }

  submitCreateCompany() {
    if (!this.name) {
      this.notificationService.showToast('error', 'Validation Error', 'Company name required.');
      return;
    }

    this.crmState.createCompany({
      name: this.name,
      industry: this.industry,
      size: '201-1000',
      website: this.website,
      phone: '+1 (555) 000-0000',
      address: 'Corporate HQ',
      tier: this.tier,
      annualRevenue: this.annualRevenue,
      assignedTo: this.crmState.currentUserId(),
      customFields: this.customFields
    });

    this.isCreateModalOpen = false;
  }

  exportCompaniesCsv() {
    const data = this.crmState.tenantCompanies().map(c => ({
      'Company Name': c.name,
      'Industry': c.industry,
      'Size': c.size,
      'Tier': c.tier,
      'Website': c.website,
      'Annual Revenue': c.annualRevenue
    }));
    this.exportService.exportToCsv(data, `${this.crmState.currentTenant().slug}_companies`);
  }

  exportCompaniesExcel() {
    const data = this.crmState.tenantCompanies().map(c => ({
      'Company Name': c.name,
      'Industry': c.industry,
      'Size': c.size,
      'Tier': c.tier,
      'Website': c.website,
      'Annual Revenue': c.annualRevenue
    }));
    this.exportService.exportToExcel(data, `${this.crmState.currentTenant().slug}_companies`, 'Companies');
  }
}
