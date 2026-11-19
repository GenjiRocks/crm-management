import { Component, inject, signal, computed, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { CrmStateService } from '../../core/services/crm-state.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppIconComponent, CurrencyFormatPipe],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Top Welcome Banner & Controls -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Good Morning, {{ crmState.currentUser().name.split(' ')[0] }}
            </h1>
            <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              {{ crmState.currentTenant().name }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline overview, automated lead triggers, and revenue performance.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Time range toggle -->
          <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              (click)="changePeriod('monthly')"
              class="px-3 py-1 rounded-lg transition"
              [class.bg-white]="selectedPeriod() === 'monthly'"
              [class.dark:bg-slate-700]="selectedPeriod() === 'monthly'"
              [class.shadow-sm]="selectedPeriod() === 'monthly'"
              [class.text-indigo-600]="selectedPeriod() === 'monthly'"
              [class.font-semibold]="selectedPeriod() === 'monthly'">
              Monthly
            </button>
            <button
              (click)="changePeriod('quarterly')"
              class="px-3 py-1 rounded-lg transition"
              [class.bg-white]="selectedPeriod() === 'quarterly'"
              [class.dark:bg-slate-700]="selectedPeriod() === 'quarterly'"
              [class.shadow-sm]="selectedPeriod() === 'quarterly'"
              [class.text-indigo-600]="selectedPeriod() === 'quarterly'"
              [class.font-semibold]="selectedPeriod() === 'quarterly'">
              Quarterly
            </button>
            <button
              (click)="changePeriod('annually')"
              class="px-3 py-1 rounded-lg transition"
              [class.bg-white]="selectedPeriod() === 'annually'"
              [class.dark:bg-slate-700]="selectedPeriod() === 'annually'"
              [class.shadow-sm]="selectedPeriod() === 'annually'"
              [class.text-indigo-600]="selectedPeriod() === 'annually'"
              [class.font-semibold]="selectedPeriod() === 'annually'">
              Annually
            </button>
          </div>

          <!-- Export Dropdown -->
          <div class="flex items-center gap-1.5">
            <button
              (click)="exportSummaryCsv()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 shadow-sm">
              <app-icon name="download" [size]="14"></app-icon>
              <span>CSV</span>
            </button>
            <button
              (click)="exportSummaryExcel()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition shadow-sm">
              <app-icon name="download" [size]="14"></app-icon>
              <span>Excel</span>
            </button>
          </div>

          <!-- Customize Widgets Toggle -->
          <button
            (click)="toggleCustomizer()"
            class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Customize Dashboard Widgets">
            <app-icon name="settings" [size]="16"></app-icon>
          </button>
        </div>
      </div>

      <!-- Widget Customizer Drawer (when opened) -->
      @if (showCustomizer()) {
        <div class="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 animate-dropdown">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <app-icon name="sparkles" [size]="16" class="text-indigo-600 dark:text-indigo-400"></app-icon>
              <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Customize Dashboard Widgets
              </h3>
            </div>
            <button (click)="showCustomizer.set(false)" class="text-xs text-slate-400 hover:text-slate-600">
              Close
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            @for (widget of crmState.dashboardWidgets(); track widget.id) {
              <label class="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  [checked]="widget.visible"
                  (change)="toggleWidget(widget.id)"
                  class="rounded text-indigo-600 focus:ring-indigo-500">
                <span class="truncate text-slate-700 dark:text-slate-300">{{ widget.name }}</span>
              </label>
            }
          </div>
        </div>
      }

      <!-- KPI Executive Cards Grid -->
      @if (isWidgetVisible('kpi_cards')) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: Revenue YTD -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Revenue YTD</span>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                <app-icon name="analytics" [size]="12"></app-icon>
                +14.2%
              </span>
            </div>
            <div class="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              {{ (crmState.totalRevenueYtd() + 1850000) | crmCurrency }}
            </div>
            <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>01 Jan 2026 – Present</span>
              <a routerLink="/analytics" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View Details</a>
            </div>
          </div>

          <!-- Card 2: Active Pipeline Value -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Pipeline Value</span>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                <app-icon name="pipeline" [size]="12"></app-icon>
                +5.8%
              </span>
            </div>
            <div class="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              {{ (crmState.activePipelineValue() + 560000) | crmCurrency }}
            </div>
            <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>{{ crmState.tenantDeals().length }} Deals Open</span>
              <a routerLink="/pipeline" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Kanban Board</a>
            </div>
          </div>

          <!-- Card 3: Closed Won Count -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Deals Closed Won</span>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                <app-icon name="check" [size]="12"></app-icon>
                +14.2%
              </span>
            </div>
            <div class="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              {{ crmState.dealsClosedWonCount() + 141 }}
            </div>
            <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Avg cycle: 28 days</span>
              <span class="text-emerald-600 font-medium">94% Retention</span>
            </div>
          </div>

          <!-- Card 4: Weighted Forecast -->
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Weighted Forecast</span>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                <app-icon name="sparkles" [size]="12"></app-icon>
                Q2 Proj.
              </span>
            </div>
            <div class="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              {{ (crmState.weightedForecastValue() + 380000) | crmCurrency }}
            </div>
            <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Win Prob Weighted</span>
              <a routerLink="/analytics" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Forecast Model</a>
            </div>
          </div>

        </div>
      }

      <!-- Main Section: Chart.js Sales Overview + Lead Acquisition Doughnut -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: Interactive Chart.js Sales Overview -->
        @if (isWidgetVisible('sales_chart')) {
          <div class="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Sales Overview & Revenue Trajectory</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Monthly closed revenue & enterprise volume with Chart.js</p>
              </div>

              <!-- Legend info -->
              <div class="flex items-center gap-3 text-xs">
                <span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Enterprise Deals
                </span>
                <span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Mid-Market Accounts
                </span>
              </div>
            </div>

            <!-- Canvas for Chart.js -->
            <div class="relative h-64 w-full">
              <canvas #salesChartCanvas></canvas>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Annual Target Quota: <strong class="text-slate-800 dark:text-slate-200">{{ 2200000 | crmCurrency }}</strong></span>
              <span class="text-emerald-600 font-bold flex items-center gap-1">
                <app-icon name="check" [size]="14"></app-icon>
                108% to annual quota milestone
              </span>
            </div>
          </div>
        }

        <!-- Right 1 Col: Lead Acquisition Doughnut Chart -->
        @if (isWidgetVisible('lead_sources')) {
          <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Lead Acquisition</h3>
                <p class="text-xs text-slate-500">Originating channel distribution</p>
              </div>
              <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">32,300 Total</span>
            </div>

            <!-- Doughnut Canvas -->
            <div class="relative h-48 w-full flex items-center justify-center">
              <canvas #sourcesChartCanvas></canvas>
            </div>

            <!-- Channels Summary List -->
            <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5 font-medium">
                  <span class="w-2 h-2 rounded-full bg-indigo-600"></span> Website & Inbound SEO
                </span>
                <span class="font-bold text-slate-900 dark:text-white">12.1k (42%)</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5 font-medium">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span> Inbound Demo Requests
                </span>
                <span class="font-bold text-slate-900 dark:text-white">8.4k (28%)</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5 font-medium">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Referrals & Partners
                </span>
                <span class="font-bold text-slate-900 dark:text-white">4.8k (18%)</span>
              </div>
              <div class="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5 font-medium">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span> LinkedIn & Outbound
                </span>
                <span class="font-bold text-slate-900 dark:text-white">7.0k (12%)</span>
              </div>
            </div>
          </div>
        }

      </div>

      <!-- Secondary Section: Pipeline Funnel Breakdown & Recent Activity Feed -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Pipeline Stage Breakdown -->
        @if (isWidgetVisible('pipeline_summary')) {
          <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Sales Pipeline Funnel</h3>
                <p class="text-xs text-slate-500">Live deal volume by active stages</p>
              </div>
              <a routerLink="/pipeline" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Open Kanban →
              </a>
            </div>

            <div class="space-y-3">
              @for (stage of crmState.pipelineStages(); track stage.id) {
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-indigo-200 transition">
                  <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full" [style.background-color]="stage.color"></span>
                    <div>
                      <div class="text-xs font-semibold text-slate-900 dark:text-white">{{ stage.name }}</div>
                      <div class="text-[11px] text-slate-400">{{ getStageDealsCount(stage.id) }} deals ({{ stage.defaultProbability }}% win rate)</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-bold text-slate-900 dark:text-white">
                      {{ getStageValue(stage.id) | crmCurrency }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Live Activity & Follow-up Reminders -->
        @if (isWidgetVisible('activity_feed')) {
          <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Upcoming Tasks & Recent Feed</h3>
                <p class="text-xs text-slate-500">Scheduled calls, automated notifications, notes</p>
              </div>
              <a routerLink="/activities" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View Timeline →
              </a>
            </div>

            <!-- Task List -->
            <div class="space-y-2.5">
              @for (task of crmState.tenantTasks().slice(0, 4); track task.id) {
                <div class="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <div class="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      [checked]="task.completed"
                      (change)="crmState.toggleTaskCompleted(task.id)"
                      class="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                    <div>
                      <div class="text-xs font-medium text-slate-800 dark:text-slate-200" [class.line-through]="task.completed" [class.text-slate-400]="task.completed">
                        {{ task.title }}
                      </div>
                      <div class="text-[10px] text-slate-400">
                        Due {{ task.dueDate }} • {{ task.relatedName }}
                      </div>
                    </div>
                  </div>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    [ngClass]="{
                      'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': task.priority === 'Urgent',
                      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300': task.priority === 'High',
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400': task.priority === 'Medium' || task.priority === 'Low'
                    }">
                    {{ task.priority }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

      </div>

    </div>
  `
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  crmState = inject(CrmStateService);
  exportService = inject(ExportService);
  notificationService = inject(NotificationService);

  @ViewChild('salesChartCanvas') salesChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sourcesChartCanvas') sourcesChartCanvas?: ElementRef<HTMLCanvasElement>;

  salesChart?: Chart;
  sourcesChart?: Chart;

  selectedPeriod = signal<'monthly' | 'quarterly' | 'annually'>('monthly');
  showCustomizer = signal<boolean>(false);

  ngAfterViewInit() {
    this.initSalesChart();
    this.initSourcesChart();
  }

  ngOnDestroy() {
    this.salesChart?.destroy();
    this.sourcesChart?.destroy();
  }

  changePeriod(p: 'monthly' | 'quarterly' | 'annually') {
    this.selectedPeriod.set(p);
    this.updateSalesChartData();
  }

  private initSalesChart() {
    if (!this.salesChartCanvas) return;
    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Create Indigo gradient fill
    const gradientEnterprise = ctx.createLinearGradient(0, 0, 0, 260);
    gradientEnterprise.addColorStop(0, 'rgba(79, 70, 229, 0.45)');
    gradientEnterprise.addColorStop(1, 'rgba(79, 70, 229, 0.02)');

    // Create Emerald gradient fill
    const gradientMidMarket = ctx.createLinearGradient(0, 0, 0, 260);
    gradientMidMarket.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    gradientMidMarket.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Enterprise Deals',
            data: [195, 210, 180, 245, 290, 275, 230, 260, 310, 345, 320, 380],
            borderColor: '#4f46e5',
            backgroundColor: gradientEnterprise,
            borderWidth: 2.5,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#4f46e5',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Mid-Market Accounts',
            data: [85, 95, 75, 110, 130, 125, 105, 120, 145, 160, 150, 175],
            borderColor: '#10b981',
            backgroundColor: gradientMidMarket,
            borderWidth: 2,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 5.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (context) => {
                const y = context.parsed.y ?? 0;
                const val = (y * 1000).toLocaleString();
                return ` ${context.dataset.label}: ${this.crmState.currencySymbol()}${val}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 }
            }
          },
          y: {
            grid: {
              color: 'rgba(226, 232, 240, 0.6)'
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              callback: (value) => `${this.crmState.currencySymbol()}${value}k`
            }
          }
        }
      }
    });
  }

  private updateSalesChartData() {
    if (!this.salesChart) return;
    const period = this.selectedPeriod();

    if (period === 'monthly') {
      this.salesChart.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      this.salesChart.data.datasets[0].data = [195, 210, 180, 245, 290, 275, 230, 260, 310, 345, 320, 380];
      this.salesChart.data.datasets[1].data = [85, 95, 75, 110, 130, 125, 105, 120, 145, 160, 150, 175];
    } else if (period === 'quarterly') {
      this.salesChart.data.labels = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
      this.salesChart.data.datasets[0].data = [585, 810, 800, 1045];
      this.salesChart.data.datasets[1].data = [255, 365, 370, 485];
    } else {
      this.salesChart.data.labels = ['2023', '2024', '2025', '2026 (YTD)'];
      this.salesChart.data.datasets[0].data = [1420, 2180, 2940, 3240];
      this.salesChart.data.datasets[1].data = [650, 980, 1320, 1475];
    }
    this.salesChart.update();
  }

  private initSourcesChart() {
    if (!this.sourcesChartCanvas) return;
    const ctx = this.sourcesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.sourcesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Website & SEO', 'Inbound Demo', 'Referrals', 'LinkedIn'],
        datasets: [{
          data: [42, 28, 18, 12],
          backgroundColor: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });
  }

  isWidgetVisible(id: string): boolean {
    const w = this.crmState.dashboardWidgets().find(item => item.id === id);
    return w ? w.visible : true;
  }

  toggleWidget(id: string) {
    this.crmState.dashboardWidgets.update(widgets =>
      widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  }

  toggleCustomizer() {
    this.showCustomizer.set(!this.showCustomizer());
  }

  getStageDealsCount(stageId: string): number {
    return this.crmState.tenantDeals().filter(d => d.stageId === stageId).length;
  }

  getStageValue(stageId: string): number {
    return this.crmState.tenantDeals()
      .filter(d => d.stageId === stageId)
      .reduce((sum, d) => sum + d.value, 0);
  }

  exportSummaryCsv() {
    const data = this.crmState.tenantDeals().map(d => ({
      'Deal Title': d.title,
      'Company': d.companyName,
      'Contact': d.contactName || '',
      'Value': d.value,
      'Currency': d.currency,
      'Stage': this.crmState.getStageName(d.stageId),
      'Probability (%)': d.probability,
      'Priority': d.priority,
      'Close Date': d.expectedCloseDate,
      'Assigned To': this.crmState.getUserName(d.assignedTo)
    }));
    this.exportService.exportToCsv(data, `${this.crmState.currentTenant().slug}_pipeline_summary`);
    this.notificationService.showToast('success', 'CSV Downloaded', 'Sales overview data exported to CSV.');
  }

  exportSummaryExcel() {
    const data = this.crmState.tenantDeals().map(d => ({
      'Deal Title': d.title,
      'Company': d.companyName,
      'Contact': d.contactName || '',
      'Value': d.value,
      'Currency': d.currency,
      'Stage': this.crmState.getStageName(d.stageId),
      'Probability (%)': d.probability,
      'Priority': d.priority,
      'Close Date': d.expectedCloseDate,
      'Assigned To': this.crmState.getUserName(d.assignedTo)
    }));
    this.exportService.exportToExcel(data, `${this.crmState.currentTenant().slug}_pipeline_summary`, 'Pipeline');
    this.notificationService.showToast('success', 'Excel Spreadsheet Exported', 'Sales overview exported in Excel format.');
  }
}
