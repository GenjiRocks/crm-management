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
        subtitle="Establish an enterprise account profile for sales opportunities and key contacts"
        icon="companies"
        badge="Account Hub"
        maxWidth="720px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitCreateCompany()" class="flex-1 flex flex-col min-h-0 overflow-hidden">

          <!-- Scrollable Middle Section (Between Top Header & Bottom Footer) -->
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1 space-y-4">

            <!-- 1. Live Account Intelligence Preview Card (Reference Image 3 Style) -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50/80 to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-purple-950/30 border border-indigo-100/90 dark:border-indigo-900/50 shadow-xs">
            <div class="flex items-center justify-between gap-3 mb-3">
              <div class="flex items-center gap-3">
                <!-- Squircle Monogram Avatar -->
                <div class="w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center text-white shadow-md transition-all duration-300"
                  [ngClass]="{
                    'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-indigo-500/25': tier === 'Enterprise',
                    'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-blue-500/25': tier === 'Mid-Market',
                    'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/25': tier === 'SMB'
                  }">
                  {{ getAccountMonogram() }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {{ name.trim() || 'New Customer Account' }}
                    </h4>
                    <span
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs"
                      [ngClass]="{
                        'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800': tier === 'Enterprise',
                        'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800': tier === 'Mid-Market',
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800': tier === 'SMB'
                      }">
                      {{ tier }} Account
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ industry }} • {{ size }} scale • {{ website.replace('https://', '').replace('http://', '') || 'company.com' }}
                  </p>
                </div>
              </div>

              <div class="text-right hidden sm:block">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Estimated SLA</span>
                <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {{ tier === 'Enterprise' ? '24/7 Dedicated Exec' : (tier === 'Mid-Market' ? 'Priority 8-Hour SLA' : 'Standard Business SLA') }}
                </span>
              </div>
            </div>

            <!-- Mini Metrics Row -->
            <div class="grid grid-cols-3 gap-2 pt-2.5 border-t border-indigo-100/70 dark:border-indigo-900/40 text-center">
              <div class="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Annual Revenue</span>
                <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {{ annualRevenue | crmCurrency }}
                </span>
              </div>
              <div class="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Pipeline Target</span>
                <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {{ getEstimatedCapacity() }}
                </span>
              </div>
              <div class="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Account Owner</span>
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {{ getSelectedOwnerName() }}
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Account Profile Form Fields -->
          <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <app-icon name="building" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Organization & Commercial Terms</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <!-- Row 1: Name & Website -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="building" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="name"
                    name="name"
                    required
                    placeholder="e.g. Acme Corporation"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Website / Domain <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="globe" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="website"
                    name="website"
                    required
                    placeholder="https://company.com"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            </div>

            <!-- Row 2: Industry & Size -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Industry Sector</label>
                <div class="relative">
                  <select
                    [(ngModel)]="industry"
                    name="industry"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="Technology & Cloud">Technology & Cloud SaaS</option>
                    <option value="Financial Services & FinTech">Financial Services & FinTech</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                    <option value="Enterprise AI & Data">Enterprise AI & Data</option>
                    <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Headcount Scale</label>
                <div class="relative">
                  <select
                    [(ngModel)]="size"
                    name="size"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="1-10">1-10 Employees (Seed / Early)</option>
                    <option value="11-50">11-50 Employees (Emerging Growth)</option>
                    <option value="51-200">51-200 Employees (Scale-up)</option>
                    <option value="201-1000">201-1000 Employees (Mid-Market)</option>
                    <option value="1000+">1000+ Employees (Global Enterprise)</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>
            </div>

            <!-- Row 3: Account Tier & Annual Revenue -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Commercial Tier</label>
                <div class="relative">
                  <select
                    [(ngModel)]="tier"
                    name="tier"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="Enterprise">🏢 Enterprise Account ($10M+ ARR)</option>
                    <option value="Mid-Market">⚡ Mid-Market Account ($1M-$10M ARR)</option>
                    <option value="SMB">🌱 SMB Growth Account (&lt; $1M ARR)</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Annual Revenue ({{ crmState.currencySymbol() }})
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    {{ crmState.currencySymbol() }}
                  </span>
                  <input
                    type="number"
                    [(ngModel)]="annualRevenue"
                    name="annualRevenue"
                    placeholder="20000000"
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            </div>

            <!-- Row 4: Dedicated Owner & Region -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dedicated Account Owner</label>
                <div class="relative">
                  <select
                    [(ngModel)]="assignedTo"
                    name="assignedTo"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    @for (u of crmState.users(); track u.id) {
                      <option [value]="u.id">{{ u.name }} ({{ u.role }})</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Corporate HQ / Region</label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="address"
                    name="address"
                    placeholder="e.g. New York, NY (North America)"
                    class="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            </div>

          </div>

          <!-- 3. Dynamic Custom Fields for Company -->
          <app-dynamic-fields
            entityType="company"
            [values]="customFields"
            (valuesChange)="customFields = $event">
          </app-dynamic-fields>

        </div>

        <!-- FIXED PINNED BOTTOM SECTION (Matching Reference Image 2) -->
        <div class="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span class="text-[11px] text-slate-400 flex items-center gap-1.5">
            <app-icon name="shield" [size]="13" class="text-indigo-500"></app-icon>
            <span>Multi-tenant encrypted profile</span>
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
              <span>Save Customer Account</span>
            </button>
          </div>
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
  industry = 'Technology & Cloud';
  size: Company['size'] = '201-1000';
  tier: Company['tier'] = 'Enterprise';
  website = 'https://';
  annualRevenue = 20000000;
  assignedTo = '';
  address = 'New York, NY (HQ)';
  customFields: Record<string, any> = {};

  getAccountMonogram(): string {
    const n = (this.name || '').trim();
    if (!n) return 'CO';
    const parts = n.split(' ').filter(p => p.length > 0);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : n.substring(0, 2).toUpperCase();
  }

  getEstimatedCapacity(): string {
    if (this.tier === 'Enterprise') return '$150k - $500k+';
    if (this.tier === 'Mid-Market') return '$50k - $150k';
    return '$10k - $50k';
  }

  getSelectedOwnerName(): string {
    const ownerId = this.assignedTo || this.crmState.currentUserId();
    const u = this.crmState.users().find(x => x.id === ownerId);
    return u ? u.name : 'Jessica Miller';
  }

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
    this.size = '201-1000';
    this.tier = 'Enterprise';
    this.website = 'https://';
    this.annualRevenue = 20000000;
    this.assignedTo = this.crmState.currentUserId();
    this.address = 'New York, NY (HQ)';
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
      size: this.size,
      website: this.website,
      phone: '+1 (555) 000-0000',
      address: this.address,
      tier: this.tier,
      annualRevenue: this.annualRevenue,
      assignedTo: this.assignedTo || this.crmState.currentUserId(),
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
