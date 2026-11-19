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
        maxWidth="580px"
        (close)="isComposerOpen = false">

        <form (ngSubmit)="submitActivity()" class="space-y-4">
          
          <!-- Mock Email Composer -->
          @if (composerType === 'email') {
            <!-- Template Quick Select -->
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Template Preset</label>
              <select
                [(ngModel)]="emailTemplate"
                (ngModelChange)="applyEmailTemplate($event)"
                name="template"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
                <option value="custom">-- Custom Message --</option>
                <option value="proposal">Enterprise Proposal & Pricing SLA</option>
                <option value="recap">Executive Meeting Recap & Next Steps</option>
                <option value="welcome">Welcome to Platform Onboarding</option>
                <option value="contract">Master Service Agreement (MSA) Attached</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">To Email *</label>
                <input
                  type="email"
                  [(ngModel)]="formTo"
                  name="to"
                  required
                  placeholder="jake.williams@acmecorp.com"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">CC / Team</label>
                <input
                  type="text"
                  [(ngModel)]="formCc"
                  name="cc"
                  placeholder="sales-ops@octax.cloud"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Line *</label>
              <input
                type="text"
                [(ngModel)]="formSubject"
                name="subject"
                required
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none">
            </div>
          }

          <!-- Phone Call specific fields -->
          @if (composerType === 'call') {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Call Outcome</label>
                <select
                  [(ngModel)]="callOutcome"
                  name="outcome"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="Connected">Connected & Spoke</option>
                  <option value="Left Voicemail">Left Voicemail</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Busy">Busy</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  [(ngModel)]="callDuration"
                  name="duration"
                  placeholder="15"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              </div>
            </div>
          }

          <!-- Meeting specific fields -->
          @if (composerType === 'meeting') {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Location / Platform</label>
                <input
                  type="text"
                  [(ngModel)]="meetingLocation"
                  name="location"
                  placeholder="Google Meet / Zoom Room 2"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Meeting Time</label>
                <input
                  type="datetime-local"
                  [(ngModel)]="meetingTime"
                  name="time"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              </div>
            </div>
          }

          <!-- Main Note / Body Area -->
          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {{ composerType === 'email' ? 'Email Message' : 'Discussion Notes & Key Next Steps' }}
            </label>
            <textarea
              [(ngModel)]="formBody"
              name="body"
              rows="5"
              required
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"></textarea>
          </div>

          <!-- Attachments Mock -->
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
            <span class="font-medium text-indigo-600 dark:text-indigo-400">Attach Document</span> (Enterprise_Proposal.pdf, SLA_Terms.docx)
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              (click)="isComposerOpen = false"
              class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5">
              @if (composerType === 'email') {
                <app-icon name="mail" [size]="14"></app-icon>
                <span>Mock Send & Log Email</span>
              } @else {
                <span>Save to Timeline</span>
              }
            </button>
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
