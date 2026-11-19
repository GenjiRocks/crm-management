import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../core/services/crm-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { Activity, ActivityType, Deal } from '../../core/models/crm.models';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ModalComponent, CurrencyFormatPipe, TimeAgoPipe],
  template: `
    <div class="space-y-5 animate-fade-in">
      
      <!-- Top Header & Action Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Activity Timeline</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Omnichannel Log & Email Simulator
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time feed of client emails, discovery calls, demos, and automated workflow triggers.
          </p>
        </div>

        <!-- Quick Log Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <button
            (click)="openModal('email')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition active:scale-95">
            <app-icon name="mail" [size]="14"></app-icon>
            <span>Mock Send Email</span>
          </button>
          <button
            (click)="openModal('call')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition active:scale-95">
            <app-icon name="phone" [size]="14"></app-icon>
            <span>Log Call</span>
          </button>
          <button
            (click)="openModal('meeting')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 transition active:scale-95">
            <app-icon name="calendar" [size]="14"></app-icon>
            <span>Schedule Meeting</span>
          </button>
          <button
            (click)="openModal('note')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <app-icon name="note" [size]="14"></app-icon>
            <span>Add Note</span>
          </button>
        </div>
      </div>

      <!-- Main Layout: 2 Columns (Timeline Feed + Key Account Inspector) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: The Vertical Activity Timeline -->
        <div class="lg:col-span-2 space-y-4">
          
          <!-- Filter Tabs -->
          <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium overflow-x-auto">
            @for (tab of filterTabs; track tab.id) {
              <button
                (click)="selectedFilter.set(tab.id)"
                class="px-3 py-1 rounded-lg transition whitespace-nowrap"
                [class.bg-white]="selectedFilter() === tab.id"
                [class.dark:bg-slate-700]="selectedFilter() === tab.id"
                [class.shadow-sm]="selectedFilter() === tab.id"
                [class.text-indigo-600]="selectedFilter() === tab.id"
                [class.font-semibold]="selectedFilter() === tab.id">
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- Vertical Timeline Card -->
          <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              
              @for (act of filteredActivities(); track act.id) {
                <div class="relative flex items-start gap-4 group">
                  
                  <!-- Timeline Node Circle -->
                  <div
                    class="absolute -left-8 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-white ring-4 ring-white dark:ring-slate-900 shadow-sm"
                    [ngClass]="{
                      'bg-emerald-500': act.type === 'call',
                      'bg-indigo-600': act.type === 'email',
                      'bg-amber-500': act.type === 'meeting',
                      'bg-violet-600': act.type === 'stage_change',
                      'bg-slate-500': act.type === 'note',
                      'bg-sky-500': act.type === 'task'
                    }">
                    <app-icon [name]="getActivityIcon(act.type)" [size]="14"></app-icon>
                  </div>

                  <!-- Activity Box -->
                  <div class="w-full p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                    
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-900 dark:text-white">{{ act.title }}</span>
                        @if (act.metadata?.isCompleted !== undefined) {
                          <span
                            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            [ngClass]="act.metadata?.isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'">
                            {{ act.metadata?.isCompleted ? 'Completed' : 'Upcoming' }}
                          </span>
                        }
                      </div>

                      <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <app-icon name="activities" [size]="12"></app-icon>
                        <span>{{ act.timestamp | timeAgo }}</span>
                      </div>
                    </div>

                    <!-- Description -->
                    <p class="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {{ act.description }}
                    </p>

                    <!-- Extra Metadata Tags -->
                    @if (act.metadata) {
                      <div class="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
                        @if (act.metadata.emailTo) {
                          <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <app-icon name="mail" [size]="12"></app-icon>
                            To: {{ act.metadata.emailTo }}
                          </span>
                        }
                        @if (act.metadata.durationMinutes) {
                          <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <app-icon name="phone" [size]="12"></app-icon>
                            Duration: {{ act.metadata.durationMinutes }} mins
                          </span>
                        }
                        @if (act.metadata.meetingLocation) {
                          <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <app-icon name="calendar" [size]="12"></app-icon>
                            Location: {{ act.metadata.meetingLocation }}
                          </span>
                        }
                        @if (act.metadata.callOutcome) {
                          <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                            Outcome: {{ act.metadata.callOutcome }}
                          </span>
                        }
                      </div>
                    }

                    <!-- Author Footer -->
                    <div class="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Logged by: <strong class="text-slate-700 dark:text-slate-300">{{ act.userName }}</strong></span>
                      <span class="uppercase tracking-wider font-semibold text-[10px] text-indigo-600 dark:text-indigo-400">
                        {{ act.relatedType }} #{{ act.relatedId }}
                      </span>
                    </div>

                  </div>

                </div>
              }

              @if (filteredActivities().length === 0) {
                <div class="p-8 text-center text-xs text-slate-400">
                  No activities found for selected filter.
                </div>
              }

            </div>
          </div>

        </div>

        <!-- Right 1 Col: Key Account / Deal Inspector (Design inspired by Image 3) -->
        <div class="space-y-4">
          @if (featuredDeal()) {
            <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              
              <!-- Company Header Card -->
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
                  AC
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {{ featuredDeal()!.companyName }}
                  </h3>
                  <span class="text-xs text-slate-400">Enterprise Strategic Account</span>
                </div>
              </div>

              <!-- Key Account Attributes -->
              <div class="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 dark:border-slate-800 py-4">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Industry</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200">Enterprise SaaS</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Account Owner</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ crmState.getUserName(featuredDeal()!.assignedTo) }}
                  </span>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Lifecycle Stage</span>
                  <span class="font-semibold text-indigo-600 dark:text-indigo-400">Sales Qualified</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Close Date</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ featuredDeal()!.expectedCloseDate }}
                  </span>
                </div>
              </div>

              <!-- Deal Size & Probability Bar -->
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-500 font-medium">Deal Size</span>
                  <span class="text-base font-extrabold text-slate-900 dark:text-white">
                    {{ featuredDeal()!.value | crmCurrency }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Win Probability</span>
                  <span class="font-bold text-emerald-600">{{ featuredDeal()!.probability }}%</span>
                </div>
                <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    [style.width.%]="featuredDeal()!.probability"></div>
                </div>
              </div>

              <!-- About Description -->
              <div class="text-xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">About Account</span>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Acme Corporation is a fast-growing enterprise SaaS company looking to streamline their sales operations and improve team productivity with Octax Cloud.
                </p>
              </div>

              <!-- Related Contacts (3) -->
              <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Related Contacts (3)</span>
                </div>

                @for (c of crmState.tenantContacts().slice(0, 3); track c.id) {
                  <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                        {{ c.firstName.substring(0, 1) }}{{ c.lastName.substring(0, 1) }}
                      </div>
                      <div>
                        <div class="font-semibold text-slate-800 dark:text-slate-200">{{ c.firstName }} {{ c.lastName }}</div>
                        <div class="text-[10px] text-slate-400">{{ c.title }}</div>
                      </div>
                    </div>
                  </div>
                }
              </div>

            </div>
          }
        </div>

      </div>

      <!-- MODAL: Composer for Mock Email, Call, Meeting, or Note -->
      <app-modal
        [isOpen]="isComposerOpen"
        [title]="composerTitle"
        [icon]="composerType === 'email' ? 'mail' : composerType === 'call' ? 'phone' : 'calendar'"
        badge="Activity Center"
        maxWidth="680px"
        (close)="isComposerOpen = false">

        <form (ngSubmit)="submitActivity()" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          <!-- Middle Scrollable Section (between top header and bottom footer) -->
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1 space-y-4">

            <!-- 1. Live Activity Intelligence Preview Card (Reference Image 3 Style) -->
          <div class="p-4 rounded-2xl border shadow-xs transition-all"
            [ngClass]="{
              'bg-gradient-to-br from-indigo-50/90 via-slate-50/80 to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-purple-950/30 border-indigo-200/80 dark:border-indigo-900/40': composerType === 'email',
              'bg-gradient-to-br from-teal-50/90 via-slate-50/80 to-cyan-50/60 dark:from-teal-950/40 dark:via-slate-900/60 dark:to-cyan-950/30 border-teal-200/80 dark:border-teal-900/40': composerType === 'call',
              'bg-gradient-to-br from-amber-50/90 via-slate-50/80 to-orange-50/60 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-orange-950/30 border-amber-200/80 dark:border-amber-900/40': composerType === 'meeting',
              'bg-gradient-to-br from-slate-50/90 via-indigo-50/80 to-slate-50/60 dark:from-slate-900/60 dark:via-indigo-950/40 dark:to-slate-900/60 border-slate-200/80 dark:border-slate-800': composerType === 'note'
            }">
            
            <div class="flex items-center justify-between gap-3 mb-2.5">
              <div class="flex items-center gap-3">
                <!-- Squircle Avatar Icon -->
                <div class="w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center text-white shadow-md transition-all"
                  [ngClass]="{
                    'bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 shadow-indigo-500/25': composerType === 'email',
                    'bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 shadow-teal-500/25': composerType === 'call',
                    'bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 shadow-amber-500/25': composerType === 'meeting',
                    'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-500/25': composerType === 'note'
                  }">
                  <app-icon [name]="composerType === 'email' ? 'mail' : composerType === 'call' ? 'phone' : 'calendar'" [size]="18"></app-icon>
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      @if (composerType === 'email') {
                        {{ formSubject.trim() || 'Client Communication Message' }}
                      } @else if (composerType === 'call') {
                        Phone Conversation with Stakeholder
                      } @else if (composerType === 'meeting') {
                        {{ formSubject.trim() || 'Strategy & Review Sync' }}
                      } @else {
                        Internal Account Strategy Note
                      }
                    </h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      [ngClass]="{
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200': composerType === 'email',
                        'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200': composerType === 'call',
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200': composerType === 'meeting',
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200': composerType === 'note'
                      }">
                      @if (composerType === 'email') { Mock Dispatch }
                      @else if (composerType === 'call') { {{ callOutcome }} }
                      @else if (composerType === 'meeting') { Scheduled Sync }
                      @else { Confidential }
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    @if (composerType === 'email') {
                      To: {{ formTo || 'jake.williams@acmecorp.com' }} • CC: {{ formCc || 'sales-ops@octax.cloud' }}
                    } @else if (composerType === 'call') {
                      Duration: {{ callDuration }} mins • Connected rep: Jessica Miller
                    } @else if (composerType === 'meeting') {
                      {{ meetingLocation || 'Google Meet' }} • Target: {{ meetingTime || 'Upcoming' }}
                    } @else {
                      Restricted to authorized account team
                    }
                  </p>
                </div>
              </div>

              <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hidden sm:flex items-center gap-1 shadow-2xs">
                <span>⚡ Omnichannel Timeline</span>
              </span>
            </div>

            <!-- Mini Quick Chips -->
            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                @if (composerType === 'email') { ✉️ Live Mock SMTP }
                @else if (composerType === 'call') { ⏱️ {{ callDuration }}m Call Log }
                @else if (composerType === 'meeting') { 📅 {{ meetingTime ? (meetingTime | date:'short') : 'Scheduled Time' }} }
                @else { 🔒 Encrypted Note }
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                📎 2 Document Attachments
              </div>
              <div class="p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold truncate">
                👤 Jessica Miller
              </div>
            </div>
          </div>

          <!-- 2. Form Inputs Section -->
          <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <app-icon name="edit" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Activity Details & Payload</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <!-- Mock Email Composer Specifics -->
            @if (composerType === 'email') {
              <!-- Template Quick Select -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Email Template Preset</label>
                <div class="relative">
                  <select
                    [(ngModel)]="emailTemplate"
                    (ngModelChange)="applyEmailTemplate($event)"
                    name="template"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    <option value="custom">-- Custom Personalized Message --</option>
                    <option value="proposal">Enterprise Proposal & Pricing SLA</option>
                    <option value="recap">Executive Meeting Recap & Next Steps</option>
                    <option value="welcome">Welcome to Platform Onboarding</option>
                    <option value="contract">Master Service Agreement (MSA) Attached</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To Recipient Email <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="mail" [size]="14"></app-icon>
                    </span>
                    <input
                      type="email"
                      [(ngModel)]="formTo"
                      name="to"
                      required
                      placeholder="jake.williams@acmecorp.com"
                      class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CC / Team Sync</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="user" [size]="14"></app-icon>
                    </span>
                    <input
                      type="text"
                      [(ngModel)]="formCc"
                      name="cc"
                      placeholder="sales-ops@octax.cloud"
                      class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="bookmark" [size]="14"></app-icon>
                  </span>
                  <input
                    type="text"
                    [(ngModel)]="formSubject"
                    name="subject"
                    required
                    placeholder="Enter email subject line..."
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            }

            <!-- Phone Call Specific Fields -->
            @if (composerType === 'call') {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Call Outcome</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="phone" [size]="14"></app-icon>
                    </span>
                    <select
                      [(ngModel)]="callOutcome"
                      name="outcome"
                      class="w-full appearance-none pl-10 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs">
                      <option value="Connected">Connected & Spoke</option>
                      <option value="Left Voicemail">Left Voicemail</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Busy">Busy</option>
                    </select>
                    <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="chevron-down" [size]="13"></app-icon>
                    </span>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (minutes)</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="clock" [size]="14"></app-icon>
                    </span>
                    <input
                      type="number"
                      [(ngModel)]="callDuration"
                      name="duration"
                      placeholder="15"
                      class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                  </div>
                </div>
              </div>
            }

            <!-- Meeting Specific Fields -->
            @if (composerType === 'meeting') {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Meeting Location / Video Conference</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="link" [size]="14"></app-icon>
                    </span>
                    <input
                      type="text"
                      [(ngModel)]="meetingLocation"
                      name="location"
                      placeholder="Google Meet / Zoom Room 2"
                      class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Scheduled Time</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <app-icon name="calendar" [size]="14"></app-icon>
                    </span>
                    <input
                      type="datetime-local"
                      [(ngModel)]="meetingTime"
                      name="time"
                      class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                  </div>
                </div>
              </div>
            }

            <!-- Main Message / Notes Textarea -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {{ composerType === 'email' ? 'Email Message Body' : 'Discussion Notes & Key Next Steps' }} <span class="text-rose-500">*</span>
              </label>
              <textarea
                [(ngModel)]="formBody"
                name="body"
                rows="5"
                required
                placeholder="Write detailed notes, context, or email payload..."
                class="w-full p-3.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs resize-none"></textarea>
            </div>

            <!-- Attachments Showcase -->
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <app-icon name="download" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Mock Document Attachments</span>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                  📄 Enterprise_Proposal.pdf (2.4 MB)
                </span>
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                  🛡️ SLA_Security_Terms.docx
                </span>
              </div>
            </div>

          </div>

          </div>

          <!-- FIXED PINNED BOTTOM SECTION (Always visible, never scrolled) -->
          <div class="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <app-icon name="check" [size]="13" class="text-indigo-500"></app-icon>
              <span>Instant sound effect & omnichannel timeline dispatch</span>
            </span>
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                (click)="isComposerOpen = false"
                class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                @if (composerType === 'email') {
                  <app-icon name="mail" [size]="14"></app-icon>
                  <span>Mock Send & Log Email</span>
                } @else if (composerType === 'call') {
                  <app-icon name="phone" [size]="14"></app-icon>
                  <span>Save Call to Timeline</span>
                } @else if (composerType === 'meeting') {
                  <app-icon name="calendar" [size]="14"></app-icon>
                  <span>Schedule Meeting & Sync</span>
                } @else {
                  <app-icon name="check" [size]="14"></app-icon>
                  <span>Save Strategy Note</span>
                }
              </button>
            </div>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class ActivitiesComponent {
  crmState = inject(CrmStateService);
  notificationService = inject(NotificationService);

  selectedFilter = signal<string>('all');

  filterTabs = [
    { id: 'all', label: 'All Activities' },
    { id: 'email', label: '✉️ Emails (Mock Sent)' },
    { id: 'call', label: '📞 Phone Calls' },
    { id: 'meeting', label: '📅 Meetings' },
    { id: 'note', label: '📝 Internal Notes' },
    { id: 'stage_change', label: '🎯 Pipeline Moves' }
  ];

  // Composer Modal
  isComposerOpen = false;
  composerType: ActivityType = 'email';
  composerTitle = 'Mock Send Email';
  emailTemplate = 'proposal';
  formTo = 'jake.williams@acmecorp.com';
  formCc = 'sales-ops@octax.cloud';
  formSubject = 'Octax Enterprise Proposal & Security Review';
  formBody = 'Hi Jake,\n\nFollowing up on our discovery discussion earlier today. Please find our enterprise deployment breakdown and SOC2 security whitepaper attached.\n\nBest,\nJessica';
  callOutcome: 'Connected' | 'Left Voicemail' | 'No Answer' = 'Connected';
  callDuration = 20;
  meetingLocation = 'Google Meet';
  meetingTime = '';

  featuredDeal = computed(() => {
    return this.crmState.tenantDeals()[0] || null;
  });

  filteredActivities = computed(() => {
    const list = this.crmState.tenantActivities();
    const filter = this.selectedFilter();
    if (filter === 'all') return list;
    return list.filter(a => a.type === filter);
  });

  getActivityIcon(type: string): string {
    switch (type) {
      case 'email': return 'mail';
      case 'call': return 'phone';
      case 'meeting': return 'calendar';
      case 'stage_change': return 'check';
      default: return 'note';
    }
  }

  openModal(type: ActivityType) {
    this.composerType = type;
    if (type === 'email') {
      this.composerTitle = 'Compose & Mock Send Email';
      this.applyEmailTemplate('proposal');
    } else if (type === 'call') {
      this.composerTitle = 'Log Phone Call Conversation';
      this.formBody = 'Spoke with key executive regarding Q3 license scope. Target go-live date is August 1st.';
    } else if (type === 'meeting') {
      this.composerTitle = 'Schedule Executive Demo or Discovery Meeting';
      this.formBody = 'Platform deep-dive with security and engineering architecture review.';
    } else {
      this.composerTitle = 'Log Internal Strategy Note';
      this.formBody = 'Pricing approved by finance. 15% discount for annual upfront payment.';
    }
    this.isComposerOpen = true;
  }

  applyEmailTemplate(key: string) {
    if (key === 'proposal') {
      this.formSubject = 'Octax Enterprise Architecture & Custom Proposal';
      this.formBody = 'Hi Jake,\n\nPlease review our tailored proposal for Acme Corporation. Includes 45 seat licenses, 99.99% uptime SLA, and dedicated engineering onboarding.\n\nBest,\nJessica';
    } else if (key === 'recap') {
      this.formSubject = 'Meeting Summary: Discovery Call & Next Steps';
      this.formBody = 'Thank you for your time today! Key takeaways:\n1. SSO & SAML support required\n2. Security questionnaire submitted\n3. Scheduled follow-up for next Tuesday.';
    } else if (key === 'welcome') {
      this.formSubject = 'Welcome to Octax Cloud - Onboarding Kickoff';
      this.formBody = 'We are thrilled to welcome your team! Here is your quickstart guide and kickoff call link.';
    } else if (key === 'contract') {
      this.formSubject = 'Executed Master Services Agreement (MSA)';
      this.formBody = 'Please find the countersigned agreement attached for your procurement archives.';
    }
  }

  async submitActivity() {
    if (this.composerType === 'email') {
      await this.notificationService.simulateSendEmail(this.formTo, this.formSubject, this.formBody);
      this.crmState.logActivity({
        type: 'email',
        title: `Email Sent: ${this.formSubject}`,
        description: this.formBody,
        relatedType: 'deal',
        relatedId: this.featuredDeal()?.id || 'deal-1',
        metadata: {
          emailSubject: this.formSubject,
          emailTo: this.formTo
        }
      });
    } else if (this.composerType === 'call') {
      this.crmState.logActivity({
        type: 'call',
        title: `Phone Call: Spoke with ${this.featuredDeal()?.contactName || 'Client'}`,
        description: this.formBody,
        relatedType: 'deal',
        relatedId: this.featuredDeal()?.id || 'deal-1',
        metadata: {
          callOutcome: this.callOutcome,
          durationMinutes: this.callDuration
        }
      });
      this.notificationService.showToast('success', 'Call Logged', 'Phone interaction recorded to timeline.');
    } else if (this.composerType === 'meeting') {
      this.crmState.logActivity({
        type: 'meeting',
        title: `Meeting Scheduled: ${this.formBody.substring(0, 35)}...`,
        description: this.formBody,
        relatedType: 'deal',
        relatedId: this.featuredDeal()?.id || 'deal-1',
        metadata: {
          meetingLocation: this.meetingLocation,
          isCompleted: false
        }
      });
      this.notificationService.showToast('success', 'Meeting Scheduled', 'Calendar invite event logged.');
    } else {
      this.crmState.logActivity({
        type: 'note',
        title: 'Internal Account Note',
        description: this.formBody,
        relatedType: 'deal',
        relatedId: this.featuredDeal()?.id || 'deal-1'
      });
      this.notificationService.showToast('success', 'Note Added', 'Internal note saved.');
    }

    this.isComposerOpen = false;
  }
}
