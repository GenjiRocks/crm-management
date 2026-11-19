import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../core/services/crm-state.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { Lead, LeadSource, LeadStatus } from '../../core/models/crm.models';
import { DuplicateGroup, LeadScoringService } from '../../core/services/lead-scoring.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { DynamicFieldsComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule, FormsModule, AppIconComponent, ModalComponent,
    DynamicFieldsComponent, CurrencyFormatPipe
  ],
  template: `
    <div class="space-y-5 animate-fade-in">
      
      <!-- Top Header & Actions -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Lead Management</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Scoring & Deduplication Active
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ crmState.tenantLeads().length }} total leads • {{ hotLeadsCount() }} high-intent hot opportunities
          </p>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Search input -->
          <div class="relative w-48">
            <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <app-icon name="search" [size]="14"></app-icon>
            </span>
            <input
              type="text"
              [(ngModel)]="searchFilter"
              placeholder="Search leads..."
              class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          </div>

          <!-- Status Filter -->
          <select
            [(ngModel)]="statusFilter"
            class="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none">
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Converted">Converted</option>
          </select>

          <!-- Export -->
          <button
            (click)="exportLeadsCsv()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition">
            <app-icon name="download" [size]="14"></app-icon>
            <span>CSV</span>
          </button>
          <button
            (click)="exportLeadsExcel()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition shadow-sm">
            <app-icon name="download" [size]="14"></app-icon>
            <span>Excel</span>
          </button>

          <!-- Add Lead Trigger -->
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      <!-- Duplicate Detection Alert Banner -->
      @if (duplicateGroups().length > 0) {
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4 animate-dropdown">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <app-icon name="copy" [size]="18"></app-icon>
            </div>
            <div>
              <div class="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Duplicate Lead Warning ({{ duplicateGroups().length }} Cluster Found)
              </div>
              <div class="text-xs text-amber-800 dark:text-amber-200/90 mt-0.5">
                Our deduplication engine detected identical emails/phones across multiple entries.
              </div>
            </div>
          </div>

          <button
            (click)="openDeduplicateModal()"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition whitespace-nowrap">
            Review & Merge Duplicates
          </button>
        </div>
      }

      <!-- Leads Data Table Card -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th class="py-3.5 px-4">Lead Name & Title</th>
                <th class="py-3.5 px-4">Company</th>
                <th class="py-3.5 px-4">Lead Score</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4">Estimated Value</th>
                <th class="py-3.5 px-4">Source</th>
                <th class="py-3.5 px-4">Assigned Rep</th>
                <th class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              @for (lead of filteredLeads(); track lead.id) {
                <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  
                  <!-- Lead Name & Title -->
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{{ lead.firstName }} {{ lead.lastName }}</span>
                      @if (lead.scoreTier === 'Hot') {
                        <span title="Hot Lead" class="text-sm">🔥</span>
                      }
                    </div>
                    <div class="text-[11px] text-slate-400">{{ lead.title }} • {{ lead.email }}</div>
                  </td>

                  <!-- Company -->
                  <td class="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {{ lead.company }}
                  </td>

                  <!-- Lead Score Badge -->
                  <td class="py-3 px-4">
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      [ngClass]="{
                        'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800': lead.scoreTier === 'Hot',
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800': lead.scoreTier === 'Warm',
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400': lead.scoreTier === 'Cold'
                      }">
                      <span>{{ lead.score }}/100</span>
                      <span class="text-[10px] uppercase font-semibold">({{ lead.scoreTier }})</span>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="py-3 px-4">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      [ngClass]="{
                        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300': lead.status === 'New',
                        'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300': lead.status === 'Contacted',
                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300': lead.status === 'Qualified',
                        'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300': lead.status === 'Proposal',
                        'bg-slate-100 text-slate-500 dark:bg-slate-800': lead.status === 'Converted'
                      }">
                      {{ lead.status }}
                    </span>
                  </td>

                  <!-- Value -->
                  <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {{ lead.estimatedValue | crmCurrency }}
                  </td>

                  <!-- Source -->
                  <td class="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                    {{ lead.source }}
                  </td>

                  <!-- Assigned Rep -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <span>{{ crmState.getUserName(lead.assignedTo) }}</span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      @if (lead.status !== 'Converted') {
                        <button
                          type="button"
                          (click)="convertLead(lead)"
                          title="Convert to Deal + Company + Contact"
                          class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition flex items-center gap-1">
                          <app-icon name="sparkles" [size]="12"></app-icon>
                          <span>Convert</span>
                        </button>
                      } @else {
                        <span class="text-[10px] text-slate-400 font-medium">Converted</span>
                      }

                      <button
                        type="button"
                        (click)="editLead(lead)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>

                      <button
                        type="button"
                        (click)="deleteLead(lead.id)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <app-icon name="trash" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>

                </tr>
              }

              @if (filteredLeads().length === 0) {
                <tr>
                  <td colspan="8" class="p-8 text-center text-slate-400">
                    No leads match current filter criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: Duplicate Detection & Merge Tool -->
      <app-modal
        [isOpen]="isDeduplicateModalOpen"
        title="Duplicate Lead Resolution"
        subtitle="Side-by-side comparison & intelligent merge"
        icon="copy"
        maxWidth="680px"
        (close)="isDeduplicateModalOpen = false">

        <div class="space-y-6">
          @for (grp of duplicateGroups(); track grp.lead.id) {
            <div class="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Cluster Match: {{ grp.lead.company }}
                  </span>
                  <div class="text-xs text-slate-500">
                    Reason: <strong class="text-slate-800 dark:text-slate-200">{{ grp.matchReasons.join(', ') }}</strong>
                  </div>
                </div>
                <button
                  (click)="executeMerge(grp)"
                  class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                  Consolidate & Merge
                </button>
              </div>

              <!-- Side by side preview -->
              <div class="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-amber-200/50">
                <!-- Master record -->
                <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                    Primary Lead
                  </span>
                  <div class="font-bold text-slate-900 dark:text-white mt-1">
                    {{ grp.lead.firstName }} {{ grp.lead.lastName }}
                  </div>
                  <div class="text-[11px] text-slate-500">{{ grp.lead.email }}</div>
                  <div class="text-[11px] text-slate-500">{{ grp.lead.phone }}</div>
                  <div class="mt-1 font-semibold text-emerald-600">Score: {{ grp.lead.score }} ({{ grp.lead.scoreTier }})</div>
                </div>

                <!-- Duplicate record -->
                @for (dup of grp.duplicates; track dup.id) {
                  <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span class="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                      Duplicate Candidate
                    </span>
                    <div class="font-bold text-slate-900 dark:text-white mt-1">
                      {{ dup.firstName }} {{ dup.lastName }}
                    </div>
                    <div class="text-[11px] text-slate-500">{{ dup.email }}</div>
                    <div class="text-[11px] text-slate-500">{{ dup.phone }}</div>
                    <div class="mt-1 font-semibold text-slate-600">Score: {{ dup.score }} ({{ dup.scoreTier }})</div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </app-modal>

      <!-- MODAL: Add / Edit Lead -->
      <app-modal
        [isOpen]="isCreateModalOpen"
        [title]="editingLeadId ? 'Edit Prospect Record' : 'Register New Lead'"
        subtitle="Dynamic AI scoring engine with automatic round-robin routing"
        icon="leads"
        badge="AI Assisted"
        maxWidth="720px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitLeadForm()" class="space-y-4">

          <!-- Section 1: Contact Identity -->
          <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-800">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <app-icon name="user" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Contact Identity</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="user" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="formFirstName"
                    name="firstName"
                    required
                    placeholder="e.g. Jessica"
                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="user" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="formLastName"
                    name="lastName"
                    required
                    placeholder="e.g. Miller"
                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="mail" [size]="14"></app-icon>
                  </span>
                  <input
                    type="email"
                    [(ngModel)]="formEmail"
                    name="email"
                    required
                    placeholder="name@company.com"
                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="phone" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="formPhone"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Company & Commercial Scope -->
          <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800">
              <span class="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <app-icon name="building" [size]="13"></app-icon>
              </span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Organization & Commercials</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="building" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="formCompany"
                    name="company"
                    required
                    placeholder="e.g. Acme Corporation"
                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="briefcase" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="formTitle"
                    name="title"
                    placeholder="e.g. VP of Technology / CTO"
                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Source Intent</label>
                <div class="relative">
                  <select
                    [(ngModel)]="formSource"
                    name="source"
                    class="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-8 shadow-2xs">
                    <option value="Website">🌐 Website</option>
                    <option value="Inbound Demo">🎯 Inbound Demo</option>
                    <option value="Referral">🤝 Referral</option>
                    <option value="LinkedIn">💼 LinkedIn</option>
                    <option value="Event">🎪 Event / Summit</option>
                    <option value="Partner">🏢 Strategic Partner</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Stage Status</label>
                <div class="relative">
                  <select
                    [(ngModel)]="formStatus"
                    name="status"
                    class="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-8 shadow-2xs">
                    <option value="New">✨ New Prospect</option>
                    <option value="Contacted">💬 Contacted</option>
                    <option value="Qualified">🎯 Qualified</option>
                    <option value="Proposal">📝 Proposal Out</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Est. Value ({{ crmState.currencySymbol() }})
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    {{ crmState.currencySymbol() }}
                  </span>
                  <input
                    type="number"
                    [(ngModel)]="formValue"
                    name="value"
                    placeholder="50000"
                    class="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs">
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Dynamic Custom Fields -->
          <app-dynamic-fields
            entityType="lead"
            [values]="formCustomFields"
            (valuesChange)="formCustomFields = $event">
          </app-dynamic-fields>

          <!-- Section 4: Live Predictive Score & Assignment Intelligence (Real-time AI Card) -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-3 relative overflow-hidden">
            <!-- Glow background circle -->
            <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-bold uppercase tracking-wider text-indigo-200">Live Predictive AI Score</span>
              </div>

              <!-- Score Badge -->
              <div class="flex items-center gap-2">
                <span class="text-sm font-extrabold text-white">
                  {{ predictedScoring.score }} / 100
                </span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-xs"
                  [ngClass]="{
                    'bg-rose-500/20 text-rose-300 border-rose-500/40': predictedScoring.tier === 'Hot',
                    'bg-amber-500/20 text-amber-300 border-amber-500/40': predictedScoring.tier === 'Warm',
                    'bg-slate-500/20 text-slate-300 border-slate-500/40': predictedScoring.tier === 'Cold'
                  }">
                  {{ predictedScoring.tier === 'Hot' ? '🔥 Hot Lead' : (predictedScoring.tier === 'Warm' ? '⚡ Warm Lead' : '❄️ Cold Lead') }}
                </span>
              </div>
            </div>

            <!-- Progress Meter -->
            <div class="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
              <div
                class="h-full rounded-full transition-all duration-300"
                [style.width.%]="predictedScoring.score"
                [ngClass]="{
                  'bg-gradient-to-r from-rose-500 to-orange-400': predictedScoring.tier === 'Hot',
                  'bg-gradient-to-r from-amber-400 to-yellow-300': predictedScoring.tier === 'Warm',
                  'bg-gradient-to-r from-slate-400 to-slate-300': predictedScoring.tier === 'Cold'
                }">
              </div>
            </div>

            <!-- Details Chips -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                <app-icon name="user" [size]="12"></app-icon>
                <span class="truncate">Auto-Rep: <strong class="text-white">{{ predictedScoring.repName }}</strong></span>
              </div>

              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                <app-icon name="analytics" [size]="12"></app-icon>
                <span>Win Prob: <strong class="text-emerald-400">~{{ predictedScoring.winProb }}%</strong></span>
              </div>

              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                <app-icon name="sparkles" [size]="12"></app-icon>
                <span>Rule: <strong class="text-indigo-300">Round-Robin v2</strong></span>
              </div>
            </div>
          </div>

          <!-- Section 5: Footer Actions -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span class="text-[11px] text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <app-icon name="shield" [size]="13"></app-icon>
              <span>Duplicate check and audit trail automatically registered.</span>
            </span>

            <div class="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                (click)="isCreateModalOpen = false"
                class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                <app-icon name="sparkles" [size]="14"></app-icon>
                <span>{{ editingLeadId ? 'Update Prospect Record' : 'Save & Route Prospect' }}</span>
              </button>
            </div>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class LeadsComponent {
  crmState = inject(CrmStateService);
  exportService = inject(ExportService);
  notificationService = inject(NotificationService);
  leadScoringService = inject(LeadScoringService);

  searchFilter = '';
  statusFilter = 'ALL';

  isCreateModalOpen = false;
  isDeduplicateModalOpen = false;
  editingLeadId: string | null = null;

  get predictedScoring() {
    const res = this.leadScoringService.calculateLeadScore({
      title: this.formTitle,
      source: this.formSource,
      estimatedValue: this.formValue,
      customFields: this.formCustomFields
    });
    const repId = this.crmState.autoAssignLead(res.score);
    const repName = this.crmState.getUserName(repId);
    return {
      score: res.score,
      tier: res.tier,
      repName,
      winProb: Math.min(95, Math.max(15, Math.round(res.score * 0.85)))
    };
  }

  // Form fields
  formFirstName = '';
  formLastName = '';
  formEmail = '';
  formPhone = '';
  formCompany = '';
  formTitle = '';
  formSource: LeadSource = 'Inbound Demo';
  formStatus: LeadStatus = 'New';
  formValue = 50000;
  formCustomFields: Record<string, any> = {};

  filteredLeads = computed(() => {
    let list = this.crmState.tenantLeads();

    if (this.searchFilter.trim()) {
      const q = this.searchFilter.toLowerCase();
      list = list.filter(l =>
        l.firstName.toLowerCase().includes(q) ||
        l.lastName.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(l => l.status === this.statusFilter);
    }

    return list;
  });

  duplicateGroups = computed(() => {
    return this.crmState.duplicateLeadGroups();
  });

  hotLeadsCount() {
    return this.crmState.tenantLeads().filter(l => l.scoreTier === 'Hot').length;
  }

  openCreateModal() {
    this.editingLeadId = null;
    this.formFirstName = '';
    this.formLastName = '';
    this.formEmail = '';
    this.formPhone = '+1 (555) ';
    this.formCompany = '';
    this.formTitle = '';
    this.formSource = 'Inbound Demo';
    this.formStatus = 'New';
    this.formValue = 60000;
    this.formCustomFields = { decisionMaker: true, currentCrm: 'Salesforce' };
    this.isCreateModalOpen = true;
  }

  editLead(lead: Lead) {
    this.editingLeadId = lead.id;
    this.formFirstName = lead.firstName;
    this.formLastName = lead.lastName;
    this.formEmail = lead.email;
    this.formPhone = lead.phone;
    this.formCompany = lead.company;
    this.formTitle = lead.title;
    this.formSource = lead.source;
    this.formStatus = lead.status;
    this.formValue = lead.estimatedValue;
    this.formCustomFields = { ...(lead.customFields || {}) };
    this.isCreateModalOpen = true;
  }

  submitLeadForm() {
    if (!this.formFirstName || !this.formEmail || !this.formCompany) {
      this.notificationService.showToast('error', 'Required Fields Missing', 'Please specify Name, Email, and Company.');
      return;
    }

    if (this.editingLeadId) {
      this.crmState.updateLead(this.editingLeadId, {
        firstName: this.formFirstName,
        lastName: this.formLastName,
        email: this.formEmail,
        phone: this.formPhone,
        company: this.formCompany,
        title: this.formTitle,
        source: this.formSource,
        status: this.formStatus,
        estimatedValue: this.formValue,
        customFields: this.formCustomFields
      });
    } else {
      this.crmState.createLead({
        firstName: this.formFirstName,
        lastName: this.formLastName,
        email: this.formEmail,
        phone: this.formPhone,
        company: this.formCompany,
        title: this.formTitle,
        source: this.formSource,
        status: this.formStatus,
        estimatedValue: this.formValue,
        assignedTo: this.crmState.currentUserId(),
        tags: [this.formSource],
        notes: 'Inbound prospect submitted via CRM portal.',
        customFields: this.formCustomFields
      });
    }

    this.isCreateModalOpen = false;
  }

  convertLead(lead: Lead) {
    this.crmState.convertLeadToDeal(lead.id);
  }

  deleteLead(id: string) {
    this.crmState.deleteLead(id);
  }

  openDeduplicateModal() {
    this.isDeduplicateModalOpen = true;
  }

  executeMerge(grp: DuplicateGroup) {
    const dupIds = grp.duplicates.map(d => d.id);
    this.crmState.mergeDuplicates(grp.lead.id, dupIds);
    this.isDeduplicateModalOpen = false;
  }

  exportLeadsCsv() {
    const data = this.filteredLeads().map(l => ({
      'First Name': l.firstName,
      'Last Name': l.lastName,
      'Email': l.email,
      'Phone': l.phone,
      'Company': l.company,
      'Title': l.title,
      'Status': l.status,
      'Score': l.score,
      'Tier': l.scoreTier,
      'Estimated Value': l.estimatedValue,
      'Source': l.source,
      'Assigned Rep': this.crmState.getUserName(l.assignedTo)
    }));
    this.exportService.exportToCsv(data, `${this.crmState.currentTenant().slug}_leads`);
    this.notificationService.showToast('success', 'Leads Exported', 'CSV file saved.');
  }

  exportLeadsExcel() {
    const data = this.filteredLeads().map(l => ({
      'First Name': l.firstName,
      'Last Name': l.lastName,
      'Email': l.email,
      'Phone': l.phone,
      'Company': l.company,
      'Title': l.title,
      'Status': l.status,
      'Score': l.score,
      'Tier': l.scoreTier,
      'Estimated Value': l.estimatedValue,
      'Source': l.source,
      'Assigned Rep': this.crmState.getUserName(l.assignedTo)
    }));
    this.exportService.exportToExcel(data, `${this.crmState.currentTenant().slug}_leads`, 'Leads');
    this.notificationService.showToast('success', 'Excel Spreadsheet Exported', 'Leads downloaded in Excel format.');
  }
}
