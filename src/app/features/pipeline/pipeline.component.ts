import { Component, inject, signal, computed, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CrmStateService } from '../../core/services/crm-state.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { Deal, DealPriority, PipelineStage, Activity, ActivityType, Company, Contact } from '../../core/models/crm.models';
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

      <!-- MODAL: Deal Details & Activity Drawer (Matching Reference Image 3) -->
      <app-modal
        [isOpen]="isDetailsOpen"
        [title]="selectedDeal?.title || 'Deal Overview'"
        [subtitle]="selectedDeal ? (selectedDeal.companyName + ' • ' + (selectedDeal.value | crmCurrency)) : ''"
        icon="pipeline"
        badge="Deal Flow & History"
        maxWidth="1040px"
        (close)="isDetailsOpen = false">

        @if (selectedDeal) {
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <!-- LEFT PANEL (7 cols): Activity Timeline & Omnichannel Communications (Image 3) -->
            <div class="lg:col-span-7 space-y-4">
              <!-- Timeline Header & Quick Action Pills -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800 flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Activity Timeline</h3>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    {{ getDealActivities(selectedDeal.id).length }} Events
                  </span>
                </div>

                <!-- Quick Log Action Triggers -->
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="openQuickLog('email')"
                    title="Send Email"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1.5 shadow-2xs">
                    <app-icon name="mail" [size]="12"></app-icon>
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    (click)="openQuickLog('call')"
                    title="Log Phone Call"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs">
                    <app-icon name="phone" [size]="12"></app-icon>
                    <span>Call</span>
                  </button>
                  <button
                    type="button"
                    (click)="openQuickLog('meeting')"
                    title="Schedule Meeting"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1.5 shadow-2xs">
                    <app-icon name="calendar" [size]="12"></app-icon>
                    <span>Meeting</span>
                  </button>
                </div>
              </div>

              <!-- Vertical Timeline with Soft Floating Cards (Image 3) -->
              <div class="relative pl-12 sm:pl-14 space-y-3.5 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                @for (act of getDealActivities(selectedDeal.id); track act.id) {
                  <div class="relative">
                    <!-- Left Timeline Colored Circle / Squircle (Image 3) -->
                    <div
                      class="absolute -left-12 sm:-left-14 top-1 w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ring-4 ring-white dark:ring-slate-900 z-10 transition transform hover:scale-105"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800': act.type === 'call',
                        'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800': act.type === 'email',
                        'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800': act.type === 'meeting',
                        'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800': act.type === 'stage_change',
                        'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700': act.type === 'note' || act.type === 'task'
                      }">
                      <app-icon [name]="getActivityIcon(act.type)" [size]="15"></app-icon>
                    </div>

                    <!-- Event Content Card -->
                    @if (act.type === 'meeting') {
                      <!-- Highlighted Discovery Meeting Box (Like Image 3) -->
                      <div class="p-4 rounded-2xl border-2 border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs space-y-2">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-slate-900 dark:text-white">{{ act.title }}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                              {{ act.metadata?.isCompleted ? 'Completed' : 'Upcoming' }}
                            </span>
                          </div>
                          <span class="text-[10px] text-slate-400 font-medium">{{ act.timestamp | timeAgo }}</span>
                        </div>

                        <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {{ act.description }}
                        </p>

                        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500">
                          <span class="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <app-icon name="calendar" [size]="12"></app-icon>
                            <span>45 min</span>
                          </span>
                          <span>•</span>
                          <span class="flex items-center gap-1">
                            <app-icon name="user" [size]="12"></app-icon>
                            <span>Host: {{ act.userName }}</span>
                          </span>
                          <span class="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 font-semibold border border-indigo-200/60 dark:border-indigo-800">
                            Platform Walkthrough
                          </span>
                        </div>
                      </div>
                    } @else {
                      <!-- Standard Event Card -->
                      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-slate-900 dark:text-white">{{ act.title }}</span>
                            @if (act.type === 'email') {
                              <span class="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                                Delivered
                              </span>
                            }
                          </div>
                          <span class="text-[10px] text-slate-400 font-medium">{{ act.timestamp | timeAgo }}</span>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {{ act.description }}
                        </p>
                        @if (act.metadata?.emailTo) {
                          <div class="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                            <app-icon name="mail" [size]="11"></app-icon>
                            <span>Sent to: {{ act.metadata?.emailTo }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- + Log Activity CTA Button at Bottom of Timeline (Image 3) -->
              <div class="pt-2">
                <button
                  type="button"
                  (click)="openQuickLog('email')"
                  class="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-98 transition flex items-center justify-center gap-2">
                  <app-icon name="plus" [size]="14"></app-icon>
                  <span>+ Log Activity or Communication</span>
                </button>
              </div>
            </div>

            <!-- RIGHT PANEL (5 cols): Floating Company & Opportunity Insight Card (Image 3) -->
            <div class="lg:col-span-5 space-y-4">
              <div class="p-5 rounded-3xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 shadow-sm space-y-4">

                <!-- Company Header & Monogram Avatar (Image 3) -->
                <div class="flex items-start gap-3.5">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0">
                    {{ getCompanyInitials(selectedDeal.companyName) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {{ selectedDeal.companyName }}
                    </h4>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {{ selectedDealCompany?.tier || 'Enterprise Account' }}
                      </span>
                      <span class="text-xs text-slate-400">•</span>
                      <span class="text-xs text-slate-500 truncate">{{ selectedDealCompany?.industry || 'Technology & Logistics' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Stage & Probability Progress Meter (Image 3) -->
                <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-slate-500">Pipeline Stage</span>
                    <select
                      [ngModel]="selectedDeal.stageId"
                      (ngModelChange)="onModalStageChange($event)"
                      class="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 focus:outline-none">
                      @for (s of crmState.pipelineStages(); track s.id) {
                        <option [value]="s.id">{{ s.name }} ({{ s.defaultProbability }}%)</option>
                      }
                    </select>
                  </div>

                  <div>
                    <div class="flex items-center justify-between text-xs font-semibold mb-1">
                      <span class="text-slate-500 text-[11px]">Win Probability</span>
                      <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ selectedDeal.probability }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-300"
                        [style.width.%]="selectedDeal.probability">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Key Deal Attributes 2-Column Grid (Image 3) -->
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Deal Size</span>
                    <span class="text-base font-extrabold text-slate-900 dark:text-white">
                      {{ selectedDeal.value | crmCurrency }}
                    </span>
                  </div>

                  <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Close Date</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {{ selectedDeal.expectedCloseDate }}
                    </span>
                  </div>

                  <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Account Owner</span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                        {{ getCompanyInitials(crmState.getUserName(selectedDeal.assignedTo)) }}
                      </span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {{ crmState.getUserName(selectedDeal.assignedTo) }}
                      </span>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Priority</span>
                    <span
                      class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                      [ngClass]="{
                        'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300': selectedDeal.priority === 'Urgent',
                        'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300': selectedDeal.priority === 'High',
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': selectedDeal.priority === 'Medium' || selectedDeal.priority === 'Low'
                      }">
                      {{ selectedDeal.priority }}
                    </span>
                  </div>
                </div>

                <!-- About Account -->
                <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">About Account</span>
                  <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {{ selectedDeal.companyName }} is an active enterprise partner evaluating CRM automation, workflow rules, and automated lead scoring.
                  </p>
                </div>

                <!-- Tenant Dynamic Custom Fields -->
                <app-dynamic-fields
                  entityType="deal"
                  [values]="selectedDeal.customFields || {}"
                  (valuesChange)="onDealCustomFieldsChange($event)">
                </app-dynamic-fields>

                <!-- Related Stakeholders / Contacts (Image 3) -->
                <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Related Contacts ({{ getDealContacts(selectedDeal.companyId).length }})
                    </span>
                    <span class="text-[10px] text-slate-400 font-semibold">Stakeholders</span>
                  </div>

                  <div class="space-y-2">
                    @for (cnt of getDealContacts(selectedDeal.companyId); track cnt.id) {
                      <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div class="flex items-center gap-2 min-w-0">
                          <div class="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {{ cnt.firstName[0] }}{{ cnt.lastName[0] }}
                          </div>
                          <div class="min-w-0">
                            <div class="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {{ cnt.firstName }} {{ cnt.lastName }}
                            </div>
                            <div class="text-[10px] text-slate-400 truncate">{{ cnt.title || 'Decision Maker' }}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="openQuickLog('email')"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition">
                          <app-icon name="mail" [size]="13"></app-icon>
                        </button>
                      </div>
                    }
                    @if (getDealContacts(selectedDeal.companyId).length === 0) {
                      <div class="text-[11px] text-slate-400 text-center py-2">
                        Primary Contact: <strong>{{ selectedDeal.contactName || 'Primary Lead Contact' }}</strong>
                      </div>
                    }
                  </div>
                </div>

                <!-- Danger Zone / Delete Deal -->
                @if (crmState.currentRole() === 'Admin' || crmState.currentRole() === 'Sales Manager') {
                  <div class="pt-2 flex justify-between items-center text-xs">
                    <span class="text-[11px] text-slate-400">Manage record lifecycle</span>
                    <button
                      type="button"
                      (click)="deleteSelectedDeal()"
                      class="px-3 py-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition">
                      <app-icon name="trash" [size]="13"></app-icon>
                      <span>Delete Deal</span>
                    </button>
                  </div>
                }

              </div>
            </div>

            </div>

          </div>
        }
      </app-modal>

      <!-- MODAL: Quick Log (Mock Email / Call / Meeting) -->
      <app-modal
        [isOpen]="isQuickLogOpen"
        [title]="quickLogTitle"
        icon="mail"
        badge="Quick Activity"
        maxWidth="600px"
        (close)="isQuickLogOpen = false">

        <form (ngSubmit)="submitQuickLog()" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          <!-- Middle Scrollable Section -->
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1 space-y-4">

            <!-- Live Activity Preview Banner -->
          <div class="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-900/40 flex items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                <app-icon [name]="quickLogType === 'email' ? 'mail' : quickLogType === 'call' ? 'phone' : 'calendar'" [size]="16"></app-icon>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white">
                  {{ quickLogType === 'email' ? (quickLogSubject || 'Direct Client Outreach') : 'Client Interaction Record' }}
                </h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ quickLogType === 'email' ? ('Recipient: ' + (quickLogTo || 'client@company.com')) : 'Logged to Deal Activity Timeline' }}
                </p>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Deal Timeline
            </span>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
            @if (quickLogType === 'email') {
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="mail" [size]="14"></app-icon>
                  </span>
                  <input
                    type="email"
                    [(ngModel)]="quickLogTo"
                    name="to"
                    required
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
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
                    [(ngModel)]="quickLogSubject"
                    name="subject"
                    required
                    class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
                </div>
              </div>
            }

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {{ quickLogType === 'email' ? 'Email Payload & Message Body' : 'Activity Notes & Summary' }} <span class="text-rose-500">*</span>
              </label>
              <textarea
                [(ngModel)]="quickLogNote"
                name="note"
                rows="4"
                required
                class="w-full p-3 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs resize-none"></textarea>
            </div>
          </div>

          </div>

          <!-- FIXED PINNED BOTTOM SECTION -->
          <div class="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-slate-400">Recorded with automated timestamp</span>
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                (click)="isQuickLogOpen = false"
                class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                <app-icon [name]="quickLogType === 'email' ? 'mail' : 'check'" [size]="14"></app-icon>
                <span>{{ quickLogType === 'email' ? 'Send Email Simulation' : 'Save Activity' }}</span>
              </button>
            </div>
          </div>
        </form>
      </app-modal>

      <!-- MODAL: Create New Deal -->
      <app-modal
        [isOpen]="isCreateModalOpen"
        title="Create Sales Opportunity"
        subtitle="Add deal directly into the active tenant pipeline with automated win forecasting"
        icon="pipeline"
        badge="Live Pipeline"
        maxWidth="740px"
        (close)="isCreateModalOpen = false">

        <form (ngSubmit)="submitCreateDeal()" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          <!-- Middle Scrollable Section (Between Top Header & Bottom Footer) -->
          <div class="p-6 overflow-y-auto min-h-0 modal-content-scroll flex-1 space-y-4">

            <!-- Card 1: Core Opportunity Details -->
          <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <app-icon name="briefcase" [size]="13"></app-icon>
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Deal Terms & Scope</span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">* Required fields</span>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deal Title <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <app-icon name="briefcase" [size]="14"></app-icon>
                </span>
                <input
                  type="text"
                  [(ngModel)]="newDealTitle"
                  name="title"
                  required
                  placeholder="e.g. Acme Corp - Multi-Year Enterprise Rollout"
                  class="w-full pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition shadow-2xs">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Account / Company <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="building" [size]="14"></app-icon>
                  </span>
                  <select
                    [(ngModel)]="newDealCompanyId"
                    (ngModelChange)="onNewDealCompanySelect($event)"
                    name="company"
                    required
                    class="w-full appearance-none pl-10 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs">
                    <option value="">-- Select Target Account --</option>
                    @for (comp of crmState.tenantCompanies(); track comp.id) {
                      <option [value]="comp.id">{{ comp.name }} ({{ comp.tier }})</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deal Value ({{ crmState.currencySymbol() }}) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    {{ crmState.currencySymbol() }}
                  </span>
                  <input
                    type="number"
                    [(ngModel)]="newDealValue"
                    name="value"
                    required
                    placeholder="50000"
                    class="w-full pl-9 pr-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs">
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pipeline Stage</label>
                <div class="relative">
                  <select
                    [(ngModel)]="newDealStageId"
                    name="stage"
                    class="w-full appearance-none px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
                    @for (s of crmState.pipelineStages(); track s.id) {
                      <option [value]="s.id">{{ s.name }} ({{ s.defaultProbability }}%)</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="13"></app-icon>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Urgency Priority</label>
                <div class="relative">
                  <select
                    [(ngModel)]="newDealPriority"
                    name="priority"
                    class="w-full appearance-none px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 pr-8 shadow-2xs">
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
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Close Date</label>
                <input
                  type="date"
                  [(ngModel)]="newDealCloseDate"
                  name="closeDate"
                  class="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs">
              </div>
            </div>
          </div>

          <!-- Card 2: Live Deal Forecast & Revenue Impact (Interactive Widget!) -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-3 relative overflow-hidden">
            <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-bold uppercase tracking-wider text-indigo-200">Pipeline Revenue Forecast</span>
              </div>

              <!-- Probability Badge -->
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                {{ newDealForecast.probability }}% Win Probability
              </span>
            </div>

            <!-- Progress Meter -->
            <div class="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
              <div
                class="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300"
                [style.width.%]="newDealForecast.probability">
              </div>
            </div>

            <!-- Revenue Impact Details -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                <app-icon name="dollar" [size]="12"></app-icon>
                <span>Weighted: <strong class="text-emerald-400 font-bold">{{ newDealForecast.weightedValue | crmCurrency }}</strong></span>
              </div>

              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                <app-icon name="user" [size]="12"></app-icon>
                <span class="truncate">Owner: <strong class="text-white">{{ newDealForecast.repName }}</strong></span>
              </div>

              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                <app-icon name="pipeline" [size]="12"></app-icon>
                <span class="truncate">Stage: <strong class="text-indigo-300">{{ newDealForecast.stageName }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Dynamic Custom Fields for Deal -->
          <app-dynamic-fields
            entityType="deal"
            [values]="newDealCustomFields"
            (valuesChange)="newDealCustomFields = $event">
          </app-dynamic-fields>

          </div>

          <!-- FIXED PINNED BOTTOM SECTION (Always visible, never scrolled) -->
          <div class="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <app-icon name="shield" [size]="12"></app-icon>
              <span>Added to tenant active pipeline & audit timeline</span>
            </span>
            <div class="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                (click)="isCreateModalOpen = false"
                class="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95 shadow-2xs">
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                <app-icon name="sparkles" [size]="14"></app-icon>
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

  get selectedDealCompany(): Company | undefined {
    if (!this.selectedDeal) return undefined;
    return this.crmState.tenantCompanies().find(c => c.id === this.selectedDeal?.companyId);
  }

  getDealContacts(companyId?: string): Contact[] {
    if (!companyId) return [];
    return this.crmState.tenantContacts().filter(c => c.companyId === companyId);
  }

  getCompanyInitials(name?: string): string {
    if (!name) return 'CR';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getDealActivities(dealId: string): Activity[] {
    const existing = this.crmState.tenantActivities().filter(a => a.relatedId === dealId);
    if (existing.length > 0) return existing;

    // Realistic fallback activities matching the omnichannel timeline design
    if (this.selectedDeal) {
      const compName = this.selectedDeal.companyName || 'Enterprise Partner';
      const contactName = this.selectedDeal.contactName || 'Lead Stakeholder';
      const repName = this.crmState.getUserName(this.selectedDeal.assignedTo);

      return [
        {
          id: 'mock-1-' + dealId,
          tenantId: this.selectedDeal.tenantId,
          type: 'call',
          title: 'Phone Call',
          description: `Spoke with ${contactName} about technical evaluation and requirements for ${compName}.`,
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          userId: this.selectedDeal.assignedTo,
          userName: repName,
          relatedType: 'deal',
          relatedId: dealId
        },
        {
          id: 'mock-2-' + dealId,
          tenantId: this.selectedDeal.tenantId,
          type: 'email',
          title: 'Email Sent',
          description: `Sent platform proposal deck, SOC2 certification summary, and contract redlines.`,
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          userId: this.selectedDeal.assignedTo,
          userName: repName,
          relatedType: 'deal',
          relatedId: dealId,
          metadata: { emailTo: `${compName.toLowerCase().replace(/\s+/g, '')}@enterprise.io` }
        },
        {
          id: 'mock-3-' + dealId,
          tenantId: this.selectedDeal.tenantId,
          type: 'meeting',
          title: 'Discovery & Solution Architecture Review',
          description: `Technical discovery call with ${compName} team. Discussed custom workflow automation, SLA guarantees, and lead scoring rules. Attendees: ${contactName}, ${repName} + 2 stakeholders.`,
          timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
          userId: this.selectedDeal.assignedTo,
          userName: repName,
          relatedType: 'deal',
          relatedId: dealId,
          metadata: { isCompleted: true, durationMinutes: 45 }
        },
        {
          id: 'mock-4-' + dealId,
          tenantId: this.selectedDeal.tenantId,
          type: 'meeting',
          title: 'Follow-up Alignment Meeting',
          description: `Platform deep-dive, enterprise SSO integration discussion, and commercial terms review.`,
          timestamp: new Date(Date.now() + 3600000 * 18).toISOString(),
          userId: this.selectedDeal.assignedTo,
          userName: repName,
          relatedType: 'deal',
          relatedId: dealId
        },
        {
          id: 'mock-5-' + dealId,
          tenantId: this.selectedDeal.tenantId,
          type: 'note',
          title: 'Internal Note',
          description: `Prepare revised quotation with multi-tenant custom fields and volume discount schedule.`,
          timestamp: new Date(Date.now() + 3600000 * 24).toISOString(),
          userId: this.selectedDeal.assignedTo,
          userName: repName,
          relatedType: 'deal',
          relatedId: dealId
        }
      ];
    }
    return [];
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

  get newDealForecast() {
    const stage = this.crmState.pipelineStages().find(s => s.id === this.newDealStageId);
    const prob = stage ? stage.defaultProbability : 20;
    const val = Number(this.newDealValue) || 0;
    const weighted = Math.round(val * (prob / 100));
    return {
      stageName: stage ? stage.name : 'Prospecting',
      probability: prob,
      weightedValue: weighted,
      repName: this.crmState.getUserName(this.crmState.currentUserId())
    };
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
