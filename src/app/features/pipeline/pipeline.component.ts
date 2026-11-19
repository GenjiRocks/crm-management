import { Component, inject, signal, computed, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CrmStateService } from '../../core/services/crm-state.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { Deal, DealPriority, PipelineStage, Activity, ActivityType } from '../../core/models/crm.models';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { DynamicFieldsComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DragDropModule, AppIconComponent,
    ModalComponent, DynamicFieldsComponent, CurrencyFormatPipe, TimeAgoPipe
  ],
  template: `
    <div class="space-y-4 animate-fade-in flex flex-col flex-1 min-h-0">
      
      <!-- Top Header & Pipeline Controls -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Pipeline</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Drag & Drop Kanban
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total Pipeline: <strong class="text-slate-800 dark:text-slate-200">{{ totalPipelineValue() | crmCurrency }}</strong> across {{ filteredDeals().length }} active opportunities
          </p>
        </div>

        <!-- Filters & Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Search in board -->
          <div class="relative w-48">
            <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <app-icon name="search" [size]="14"></app-icon>
            </span>
            <input
              type="text"
              [(ngModel)]="searchFilter"
              placeholder="Filter deals..."
              class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          </div>

          <!-- Priority Filter -->
          <select
            [(ngModel)]="priorityFilter"
            class="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none">
            <option value="ALL">All Priorities</option>
            <option value="Urgent">🔥 Urgent Only</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <!-- Export Buttons -->
          <button
            (click)="exportDealsCsv()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition">
            <app-icon name="download" [size]="14"></app-icon>
            <span>CSV</span>
          </button>
          <button
            (click)="exportDealsExcel()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition shadow-sm">
            <app-icon name="download" [size]="14"></app-icon>
            <span>Excel</span>
          </button>

          <!-- New Deal Trigger -->
          <button
            (click)="openCreateModal()"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>New Deal</span>
          </button>
        </div>
      </div>

      <!-- Drag & Drop Kanban Columns Container -->
      <div
        #boardContainer
        (scroll)="onBoardScroll()"
        cdkDropListGroup
        class="kanban-scroll-container flex gap-4 overflow-x-auto pb-3 select-none flex-1 min-h-[440px] scroll-smooth">
        
        @for (stage of crmState.pipelineStages(); track stage.id) {
          <div
            [id]="stage.id"
            class="w-80 shrink-0 flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-3 shadow-sm max-h-[calc(100vh-270px)]">
            
            <!-- Column Header -->
            <div class="flex items-center justify-between mb-3 px-1 shrink-0">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" [style.background-color]="stage.color"></span>
                <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {{ stage.name }}
                </h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-xs">
                  {{ getDealsForStage(stage.id).length }}
                </span>
              </div>
              <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {{ getStageSum(stage.id) | crmCurrency }}
              </div>
            </div>

            <!-- Drop List Area -->
            <div
              cdkDropList
              [id]="'droplist-' + stage.id"
              [cdkDropListData]="getDealsForStage(stage.id)"
              (cdkDropListDropped)="onDealDrop($event, stage.id)"
              class="flex-1 space-y-3 overflow-y-auto pr-1 rounded-xl p-1 transition-colors min-h-[160px]">

              @for (deal of getDealsForStage(stage.id); track deal.id) {
                <div
                  cdkDrag
                  (click)="openDealDetails(deal)"
                  class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/50 cursor-pointer transition-all duration-200 active:scale-98 group">
                  
                  <!-- Top Row: Company & Priority -->
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                      {{ deal.companyName }}
                    </span>
                    <span
                      class="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      [ngClass]="{
                        'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': deal.priority === 'Urgent',
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300': deal.priority === 'High',
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': deal.priority === 'Medium',
                        'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400': deal.priority === 'Low'
                      }">
                      {{ deal.priority }}
                    </span>
                  </div>

                  <!-- Deal Title -->
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {{ deal.title }}
                  </h4>

                  <!-- Value & Probability -->
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      {{ deal.value | crmCurrency }}
                    </span>
                    <span class="text-[10px] font-semibold text-slate-400">
                      {{ deal.probability }}% win prob
                    </span>
                  </div>

                  <!-- Probability Bar -->
                  <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [style.background-color]="stage.color"
                      [style.width.%]="deal.probability"></div>
                  </div>

                  <!-- Footer: Assigned Avatar & Close Date -->
                  <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                    <div class="flex items-center gap-1.5">
                      @if (getAssigneeAvatar(deal.assignedTo)) {
                        <img
                          [src]="getAssigneeAvatar(deal.assignedTo)"
                          [alt]="crmState.getUserName(deal.assignedTo)"
                          class="w-5 h-5 rounded-full object-cover">
                      }
                      <span class="truncate max-w-[90px]">{{ crmState.getUserName(deal.assignedTo).split(' ')[0] }}</span>
                    </div>

                    <div class="flex items-center gap-1" title="Expected close date">
                      <app-icon name="calendar" [size]="12"></app-icon>
                      <span>{{ deal.expectedCloseDate | date:'MMM d' }}</span>
                    </div>
                  </div>

                </div>
              }

              @if (getDealsForStage(stage.id).length === 0) {
                <div class="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  Drag deals here
                </div>
              }

            </div>

          </div>
        }

      </div>

      <!-- Floating / Docked Bottom Horizontal Scroll Controller (Matching Image 2) -->
      <div class="sticky bottom-0 z-20 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4 select-none shrink-0">
        
        <!-- Left: Stage Quick Jump Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 pr-2">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline mr-1">
            Jump to Stage:
          </span>
          @for (stage of crmState.pipelineStages(); track stage.id) {
            <button
              type="button"
              (click)="scrollToStage(stage.id)"
              class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center gap-1.5 whitespace-nowrap hover:scale-105 active:scale-95 shadow-xs"
              [style.border-color]="stage.color + '66'"
              [style.color]="stage.color"
              [style.background]="stage.color + '15'">
              <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="stage.color"></span>
              <span>{{ stage.name }}</span>
              <span class="opacity-75 text-[10px]">({{ getDealsForStage(stage.id).length }})</span>
            </button>
          }
        </div>

        <!-- Right: Image 2 Custom Scrollbar Controller with Left/Right arrows -->
        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Scroll Left Button -->
          <button
            type="button"
            (click)="scrollLeft()"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm active:scale-90"
            title="Scroll Left">
            ◀
          </button>

          <!-- Custom Pill Scroll Track Widget (EXACTLY like Image 2!) -->
          <div
            #trackElement
            (click)="onTrackClick($event)"
            class="custom-scroll-track relative h-8 w-44 bg-[#161a2e] dark:bg-[#0c1020] border border-slate-700/80 rounded-xl overflow-hidden cursor-pointer select-none flex items-center px-1 shadow-inner"
            title="Drag or click to scroll horizontally">
            
            <!-- Background vertical segmented lines -->
            <div class="absolute inset-0 flex items-center justify-between px-2 pointer-events-none opacity-40">
              @for (seg of trackSegments; track $index) {
                <span class="w-[2px] h-4 bg-slate-500 rounded-full"></span>
              }
            </div>

            <!-- Blue-bordered Slider Thumb (Image 2 design) -->
            <div
              #thumbElement
              (mousedown)="onThumbMouseDown($event)"
              class="custom-scroll-thumb absolute top-1 bottom-1 border-2 border-blue-500 rounded-lg bg-slate-900/90 cursor-grab active:cursor-grabbing shadow-lg shadow-blue-500/40 flex items-center justify-center transition-[left] duration-75"
              [style.left.px]="thumbLeft"
              [style.width.px]="thumbWidth">
              <!-- Vertical grip lines inside the blue box -->
              <div class="flex items-center gap-[2.5px] pointer-events-none opacity-90">
                <span class="w-[2px] h-3.5 bg-blue-400 rounded-full"></span>
                <span class="w-[2px] h-3.5 bg-blue-400 rounded-full"></span>
                <span class="w-[2px] h-3.5 bg-blue-400 rounded-full"></span>
                <span class="w-[2px] h-3.5 bg-blue-400 rounded-full"></span>
                <span class="w-[2px] h-3.5 bg-blue-400 rounded-full"></span>
              </div>
            </div>
          </div>

          <!-- Scroll Right Button -->
          <button
            type="button"
            (click)="scrollRight()"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm active:scale-90"
            title="Scroll Right">
            ▶
          </button>
        </div>

      </div>

      <!-- MODAL: Deal Details & Activity Drawer -->
      <app-modal
        [isOpen]="isDetailsOpen"
        [title]="selectedDeal?.title || 'Deal Overview'"
        [subtitle]="selectedDeal ? (selectedDeal.companyName + ' • ' + (selectedDeal.value | crmCurrency)) : ''"
        icon="pipeline"
        maxWidth="720px"
        (close)="isDetailsOpen = false">

        @if (selectedDeal) {
          <div class="space-y-6">
            
            <!-- Quick Action Pills -->
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500 font-medium">Stage:</span>
                <select
                  [ngModel]="selectedDeal.stageId"
                  (ngModelChange)="onModalStageChange($event)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  @for (s of crmState.pipelineStages(); track s.id) {
                    <option [value]="s.id">{{ s.name }} ({{ s.defaultProbability }}%)</option>
                  }
                </select>
              </div>

              <!-- Action triggers -->
              <div class="flex items-center gap-2">
                <button
                  (click)="openQuickLog('email')"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1.5">
                  <app-icon name="mail" [size]="12"></app-icon>
                  <span>Send Email</span>
                </button>
                <button
                  (click)="openQuickLog('call')"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5">
                  <app-icon name="phone" [size]="12"></app-icon>
                  <span>Log Call</span>
                </button>
                <button
                  (click)="openQuickLog('meeting')"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1.5">
                  <app-icon name="calendar" [size]="12"></app-icon>
                  <span>Meeting</span>
                </button>
              </div>
            </div>

            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Deal Value</span>
                <span class="font-extrabold text-slate-900 dark:text-white text-base">
                  {{ selectedDeal.value | crmCurrency }}
                </span>
              </div>

              <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Close Date</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ selectedDeal.expectedCloseDate }}
                </span>
              </div>

              <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Assigned Rep</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ crmState.getUserName(selectedDeal.assignedTo) }}
                </span>
              </div>

              <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Priority</span>
                <span class="font-bold text-rose-600 dark:text-rose-400">
                  {{ selectedDeal.priority }}
                </span>
              </div>
            </div>

            <!-- Dynamic Custom Fields Form -->
            <app-dynamic-fields
              entityType="deal"
              [values]="selectedDeal.customFields || {}"
              (valuesChange)="onDealCustomFieldsChange($event)">
            </app-dynamic-fields>

            <!-- Activity Timeline Section for this Deal -->
            <div class="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Deal Activity History & Communications
                </h4>
                <span class="text-[11px] text-slate-400">
                  {{ getDealActivities(selectedDeal.id).length }} logged events
                </span>
              </div>

              <!-- Vertical Timeline -->
              <div class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                @for (act of getDealActivities(selectedDeal.id); track act.id) {
                  <div class="relative flex items-start gap-3">
                    <!-- Icon Dot -->
                    <div
                      class="absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-white dark:ring-slate-900"
                      [ngClass]="{
                        'bg-blue-500': act.type === 'email',
                        'bg-emerald-500': act.type === 'call',
                        'bg-amber-500': act.type === 'meeting',
                        'bg-indigo-600': act.type === 'stage_change',
                        'bg-slate-500': act.type === 'note'
                      }">
                      <app-icon [name]="getActivityIcon(act.type)" [size]="10"></app-icon>
                    </div>

                    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 w-full">
                      <div class="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                        <span>{{ act.title }}</span>
                        <span class="text-[10px] text-slate-400 font-normal">{{ act.timestamp | timeAgo }}</span>
                      </div>
                      <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {{ act.description }}
                      </p>
                      @if (act.metadata?.emailTo) {
                        <div class="mt-2 text-[10px] text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded inline-block">
                          Delivered to: {{ act.metadata?.emailTo }}
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Delete Deal option (Admin or Sales Manager) -->
            @if (crmState.currentRole() === 'Admin' || crmState.currentRole() === 'Sales Manager') {
              <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  (click)="deleteSelectedDeal()"
                  class="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium">
                  <app-icon name="trash" [size]="14"></app-icon>
                  <span>Delete Deal</span>
                </button>
              </div>
            }

          </div>
        }
      </app-modal>

      <!-- MODAL: Quick Log (Mock Email / Call / Meeting) -->
      <app-modal
        [isOpen]="isQuickLogOpen"
        [title]="quickLogTitle"
        icon="mail"
        maxWidth="500px"
        (close)="isQuickLogOpen = false">

        <form (ngSubmit)="submitQuickLog()" class="space-y-4">
          @if (quickLogType === 'email') {
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">To Email</label>
              <input
                type="email"
                [(ngModel)]="quickLogTo"
                name="to"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                [(ngModel)]="quickLogSubject"
                name="subject"
                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          }

          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {{ quickLogType === 'email' ? 'Email Body' : 'Activity Notes & Summary' }}
            </label>
            <textarea
              [(ngModel)]="quickLogNote"
              name="note"
              rows="4"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              (click)="isQuickLogOpen = false"
              class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              {{ quickLogType === 'email' ? 'Send Email Simulation' : 'Save Activity' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL: Create New Deal -->
      <app-modal
        [isOpen]="isCreateModalOpen"
        title="Create New Sales Opportunity"
        subtitle="Add deal directly into the active tenant pipeline"
        icon="plus"
        badge="Deal Flow"
        maxWidth="680px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitCreateDeal()" class="space-y-4">
          <!-- Card 1: Deal Scope -->
          <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800">
              <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <app-icon name="briefcase" [size]="13"></app-icon>
              </span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Deal Terms & Organization</span>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deal Title <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="briefcase" [size]="14"></app-icon>
                </span>
                <input
                  type="text"
                  [(ngModel)]="newDealTitle"
                  name="title"
                  required
                  placeholder="e.g. Acme Corp - Multi-Year Enterprise Rollout"
                  class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Account <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="building" [size]="14"></app-icon>
                  </span>
                  <select
                    [(ngModel)]="newDealCompanyId"
                    (ngModelChange)="onNewDealCompanySelect($event)"
                    name="company"
                    required
                    class="w-full appearance-none pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs">
                    <option value="">-- Select Target Account --</option>
                    @for (comp of crmState.tenantCompanies(); track comp.id) {
                      <option [value]="comp.id">{{ comp.name }} ({{ comp.tier }})</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deal Value ({{ crmState.currencySymbol() }}) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    {{ crmState.currencySymbol() }}
                  </span>
                  <input
                    type="number"
                    [(ngModel)]="newDealValue"
                    name="value"
                    required
                    placeholder="75000"
                    class="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs">
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Pipeline Stage</label>
                <div class="relative">
                  <select
                    [(ngModel)]="newDealStageId"
                    name="stage"
                    class="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-8 shadow-2xs">
                    @for (s of crmState.pipelineStages(); track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Urgency Priority</label>
                <div class="relative">
                  <select
                    [(ngModel)]="newDealPriority"
                    name="priority"
                    class="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-8 shadow-2xs">
                    <option value="Urgent">🔥 Urgent Priority</option>
                    <option value="High">⚡ High Priority</option>
                    <option value="Medium">Standard Medium</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Close Date</label>
                <input
                  type="date"
                  [(ngModel)]="newDealCloseDate"
                  name="closeDate"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs">
              </div>
            </div>
          </div>

          <!-- Dynamic Custom Fields for Deal -->
          <app-dynamic-fields
            entityType="deal"
            [values]="newDealCustomFields"
            (valuesChange)="newDealCustomFields = $event">
          </app-dynamic-fields>

          <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span class="text-[11px] text-slate-400 hidden sm:inline">
              Added to active tenant sales pipeline
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
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-1.5">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Create Opportunity</span>
              </button>
            </div>
          </div>
        </form>
      </app-modal>

    </div>
  `
})
export class PipelineComponent implements AfterViewInit, OnDestroy {
  crmState = inject(CrmStateService);
  exportService = inject(ExportService);
  notificationService = inject(NotificationService);

  @ViewChild('boardContainer') boardContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('trackElement') trackElement?: ElementRef<HTMLDivElement>;

  // Custom Scrollbar state (Image 2 design)
  thumbLeft = 0;
  thumbWidth = 56;
  trackSegments = Array(16).fill(0);
  isDraggingThumb = false;
  dragStartX = 0;
  dragStartThumbLeft = 0;
  private resizeObserver?: ResizeObserver;

  searchFilter = '';
  priorityFilter: string = 'ALL';

  // Detail Modal State
  isDetailsOpen = false;
  selectedDeal: Deal | null = null;

  // Quick Log Modal
  isQuickLogOpen = false;
  quickLogType: ActivityType = 'email';
  quickLogTitle = 'Quick Email';
  quickLogTo = '';
  quickLogSubject = '';
  quickLogNote = '';

  // Create Modal
  isCreateModalOpen = false;
  newDealTitle = '';
  newDealCompanyId = '';
  newDealCompanyName = '';
  newDealValue = 50000;
  newDealStageId = 'stage-prospect';
  newDealPriority: DealPriority = 'High';
  newDealCloseDate = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
  newDealCustomFields: Record<string, any> = {};

  filteredDeals = computed(() => {
    let deals = this.crmState.tenantDeals();

    if (this.searchFilter.trim()) {
      const q = this.searchFilter.toLowerCase();
      deals = deals.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        (d.contactName && d.contactName.toLowerCase().includes(q))
      );
    }

    if (this.priorityFilter !== 'ALL') {
      deals = deals.filter(d => d.priority === this.priorityFilter);
    }

    return deals;
  });

  totalPipelineValue = computed(() => {
    return this.filteredDeals().reduce((sum, d) => sum + d.value, 0);
  });

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateThumbMetrics();
    }, 100);

    if (typeof ResizeObserver !== 'undefined' && this.boardContainer) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateThumbMetrics();
      });
      this.resizeObserver.observe(this.boardContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.updateThumbMetrics();
  }

  onBoardScroll() {
    if (this.isDraggingThumb || !this.boardContainer || !this.trackElement) return;
    const board = this.boardContainer.nativeElement;
    const track = this.trackElement.nativeElement;
    const maxScroll = board.scrollWidth - board.clientWidth;
    if (maxScroll <= 0) {
      this.thumbLeft = 0;
      return;
    }
    const ratio = board.scrollLeft / maxScroll;
    const maxThumbLeft = Math.max(0, track.clientWidth - this.thumbWidth);
    this.thumbLeft = Math.max(0, Math.min(maxThumbLeft, ratio * maxThumbLeft));
  }

  updateThumbMetrics() {
    if (!this.boardContainer || !this.trackElement) return;
    const board = this.boardContainer.nativeElement;
    const track = this.trackElement.nativeElement;
    if (board.scrollWidth <= 0 || track.clientWidth <= 0) return;

    const visibleRatio = board.clientWidth / board.scrollWidth;
    this.thumbWidth = Math.max(42, Math.min(track.clientWidth * 0.75, visibleRatio * track.clientWidth));
    this.onBoardScroll();
  }

  onThumbMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingThumb = true;
    this.dragStartX = e.clientX;
    this.dragStartThumbLeft = this.thumbLeft;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isDraggingThumb || !this.boardContainer || !this.trackElement) return;
      const deltaX = moveEvent.clientX - this.dragStartX;
      const track = this.trackElement.nativeElement;
      const maxThumbLeft = Math.max(1, track.clientWidth - this.thumbWidth);
      const newLeft = Math.max(0, Math.min(maxThumbLeft, this.dragStartThumbLeft + deltaX));
      this.thumbLeft = newLeft;

      const scrollRatio = maxThumbLeft > 0 ? newLeft / maxThumbLeft : 0;
      const board = this.boardContainer.nativeElement;
      const maxScroll = board.scrollWidth - board.clientWidth;
      board.scrollLeft = scrollRatio * maxScroll;
    };

    const onMouseUp = () => {
      this.isDraggingThumb = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  onTrackClick(e: MouseEvent) {
    if (!this.boardContainer || !this.trackElement) return;
    const track = this.trackElement.nativeElement;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const maxThumbLeft = Math.max(1, track.clientWidth - this.thumbWidth);
    const targetLeft = Math.max(0, Math.min(maxThumbLeft, clickX - (this.thumbWidth / 2)));
    this.thumbLeft = targetLeft;

    const scrollRatio = maxThumbLeft > 0 ? targetLeft / maxThumbLeft : 0;
    const board = this.boardContainer.nativeElement;
    const maxScroll = board.scrollWidth - board.clientWidth;
    board.scrollTo({ left: scrollRatio * maxScroll, behavior: 'smooth' });
  }

  scrollLeft() {
    if (this.boardContainer) {
      this.boardContainer.nativeElement.scrollBy({ left: -340, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.boardContainer) {
      this.boardContainer.nativeElement.scrollBy({ left: 340, behavior: 'smooth' });
    }
  }

  scrollToStage(stageId: string) {
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  getDealsForStage(stageId: string): Deal[] {
    return this.filteredDeals().filter(d => d.stageId === stageId);
  }

  getStageSum(stageId: string): number {
    return this.getDealsForStage(stageId).reduce((sum, d) => sum + d.value, 0);
  }

  getAssigneeAvatar(userId: string): string {
    const u = this.crmState.getUser(userId);
    return u ? u.avatar : '';
  }

  onDealDrop(event: CdkDragDrop<Deal[]>, targetStageId: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const deal = event.previousContainer.data[event.previousIndex];
      if (deal) {
        this.crmState.moveDealStage(deal.id, targetStageId);
      }
    }
  }

  openDealDetails(deal: Deal) {
    this.selectedDeal = deal;
    this.isDetailsOpen = true;
  }

  onModalStageChange(newStageId: string) {
    if (this.selectedDeal) {
      this.crmState.moveDealStage(this.selectedDeal.id, newStageId);
      this.selectedDeal.stageId = newStageId;
    }
  }

  onDealCustomFieldsChange(fields: Record<string, any>) {
    if (this.selectedDeal) {
      this.selectedDeal.customFields = fields;
      this.crmState.updateDeal(this.selectedDeal.id, { customFields: fields });
    }
  }

  getDealActivities(dealId: string): Activity[] {
    return this.crmState.tenantActivities().filter(a => a.relatedId === dealId);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'email': return 'mail';
      case 'call': return 'phone';
      case 'meeting': return 'calendar';
      case 'stage_change': return 'check';
      default: return 'note';
    }
  }

  openQuickLog(type: ActivityType) {
    this.quickLogType = type;
    this.quickLogTo = this.selectedDeal?.contactName ? `${this.selectedDeal.contactName.toLowerCase().replace(' ', '.')}@${this.selectedDeal.companyName.toLowerCase().replace(/\s+/g, '')}.com` : 'client@company.com';
    this.quickLogSubject = type === 'email' ? `Follow-up: ${this.selectedDeal?.title}` : '';
    this.quickLogTitle = type === 'email' ? 'Compose & Mock Send Email' : type === 'call' ? 'Log Phone Conversation' : 'Schedule Meeting';
    this.quickLogNote = '';
    this.isQuickLogOpen = true;
  }

  async submitQuickLog() {
    if (!this.selectedDeal) return;

    if (this.quickLogType === 'email') {
      await this.notificationService.simulateSendEmail(this.quickLogTo, this.quickLogSubject, this.quickLogNote);
      this.crmState.logActivity({
        type: 'email',
        title: `Email Sent: ${this.quickLogSubject}`,
        description: this.quickLogNote || 'Email dispatched to client.',
        relatedType: 'deal',
        relatedId: this.selectedDeal.id,
        metadata: { emailSubject: this.quickLogSubject, emailTo: this.quickLogTo }
      });
    } else {
      this.crmState.logActivity({
        type: this.quickLogType,
        title: `${this.quickLogType.toUpperCase()}: ${this.selectedDeal.title}`,
        description: this.quickLogNote,
        relatedType: 'deal',
        relatedId: this.selectedDeal.id
      });
      this.notificationService.showToast('success', 'Activity Recorded', 'Saved to deal activity timeline.');
    }

    this.isQuickLogOpen = false;
  }

  deleteSelectedDeal() {
    if (this.selectedDeal) {
      this.crmState.deleteDeal(this.selectedDeal.id);
      this.isDetailsOpen = false;
      this.selectedDeal = null;
    }
  }

  openCreateModal() {
    this.newDealTitle = '';
    this.newDealCompanyId = '';
    this.newDealCompanyName = '';
    this.newDealValue = 50000;
    this.newDealCustomFields = {};
    this.isCreateModalOpen = true;
  }

  onNewDealCompanySelect(companyId: string) {
    const comp = this.crmState.tenantCompanies().find(c => c.id === companyId);
    if (comp) {
      this.newDealCompanyName = comp.name;
    }
  }

  submitCreateDeal() {
    if (!this.newDealTitle || !this.newDealCompanyId) {
      this.notificationService.showToast('error', 'Validation Error', 'Please enter a deal title and select a company.');
      return;
    }

    const created = this.crmState.createDeal({
      title: this.newDealTitle,
      companyId: this.newDealCompanyId,
      companyName: this.newDealCompanyName,
      value: this.newDealValue,
      currency: this.crmState.currencySymbol(),
      stageId: this.newDealStageId,
      probability: 40,
      expectedCloseDate: this.newDealCloseDate,
      assignedTo: this.crmState.currentUserId(),
      priority: this.newDealPriority,
      tags: ['Sales Pipeline'],
      customFields: this.newDealCustomFields
    });

    this.isCreateModalOpen = false;
  }

  exportDealsCsv() {
    const data = this.filteredDeals().map(d => ({
      'Title': d.title,
      'Company': d.companyName,
      'Value': d.value,
      'Currency': d.currency,
      'Stage': this.crmState.getStageName(d.stageId),
      'Probability': d.probability + '%',
      'Priority': d.priority,
      'Close Date': d.expectedCloseDate,
      'Assigned Rep': this.crmState.getUserName(d.assignedTo)
    }));
    this.exportService.exportToCsv(data, `${this.crmState.currentTenant().slug}_pipeline_deals`);
    this.notificationService.showToast('success', 'Deals Exported', 'CSV file generated.');
  }

  exportDealsExcel() {
    const data = this.filteredDeals().map(d => ({
      'Title': d.title,
      'Company': d.companyName,
      'Value': d.value,
      'Currency': d.currency,
      'Stage': this.crmState.getStageName(d.stageId),
      'Probability': d.probability + '%',
      'Priority': d.priority,
      'Close Date': d.expectedCloseDate,
      'Assigned Rep': this.crmState.getUserName(d.assignedTo)
    }));
    this.exportService.exportToExcel(data, `${this.crmState.currentTenant().slug}_pipeline_deals`, 'Deals');
    this.notificationService.showToast('success', 'Excel Spreadsheet Exported', 'Deals exported to Excel.');
  }
}
