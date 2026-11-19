import { Component, inject, computed, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { CrmStateService } from '../../core/services/crm-state.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, CurrencyFormatPipe],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Top Header & Export -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Revenue Analytics & Sales Forecasting</h1>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Interactive Forecast Models
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quarterly revenue projection, sales team quotas, and pipeline velocity metrics.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="exportAnalyticsCsv()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-sm transition">
            <app-icon name="download" [size]="14"></app-icon>
            <span>CSV</span>
          </button>
          <button
            (click)="exportAnalyticsExcel()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-sm">
            <app-icon name="download" [size]="14"></app-icon>
            <span>Excel (.xls)</span>
          </button>
        </div>
      </div>

      <!-- Forecast Summary KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span class="text-xs font-semibold text-slate-400">Total Pipeline Value</span>
          <div class="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {{ totalPipeline() | crmCurrency }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">Unweighted gross volume</div>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span class="text-xs font-semibold text-slate-400">Weighted Forecast</span>
          <div class="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {{ (crmState.weightedForecastValue() + 250000) | crmCurrency }}
          </div>
          <div class="text-[11px] text-emerald-600 font-semibold mt-1">82% Confidence Interval</div>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span class="text-xs font-semibold text-slate-400">Average Deal Size</span>
          <div class="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {{ avgDealSize() | crmCurrency }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">Enterprise B2B scope</div>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span class="text-xs font-semibold text-slate-400">Win Rate Percentage</span>
          <div class="mt-2 text-2xl font-black text-emerald-600">
            68.4%
          </div>
          <div class="text-[11px] text-slate-400 mt-1">+4.2% vs previous quarter</div>
        </div>
      </div>

      <!-- Forecasting Projections & Target Comparison -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Interactive Chart.js Forecast Chart -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Quarterly Revenue Forecast vs Target</h3>
              <p class="text-xs text-slate-500">Projected closed revenue against executive quota</p>
            </div>
            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">106% Quota</span>
          </div>

          <div class="relative h-64 w-full">
            <canvas #forecastCanvas></canvas>
          </div>
        </div>

        <!-- Sales Team Performance Leaderboard -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Sales Team Leaderboard</h3>
              <p class="text-xs text-slate-500">Rep performance, deal velocity, and closed volume</p>
            </div>
            <span class="text-xs text-slate-400 font-medium">Q2 Rankings</span>
          </div>

          <div class="space-y-3">
            @for (rep of teamPerformance; track rep.name) {
              <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-indigo-200 transition">
                <div class="flex items-center gap-3">
                  <img [src]="rep.avatar" class="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20">
                  <div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">{{ rep.name }}</div>
                    <div class="text-[10px] text-slate-400">{{ rep.dealsCount }} Deals • {{ rep.winRate }}% Win Rate</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-slate-900 dark:text-white">{{ rep.revenue | crmCurrency }}</div>
                  <div class="text-[10px] text-emerald-600 font-semibold">{{ rep.quotaAttainment }}% Quota</div>
                </div>
              </div>
            }
          </div>
        </div>

      </div>

    </div>
  `
})
export class AnalyticsComponent implements AfterViewInit, OnDestroy {
  crmState = inject(CrmStateService);
  exportService = inject(ExportService);
  notificationService = inject(NotificationService);

  @ViewChild('forecastCanvas') forecastCanvas?: ElementRef<HTMLCanvasElement>;
  forecastChart?: Chart;

  totalPipeline = computed(() => {
    return this.crmState.tenantDeals().reduce((sum, d) => sum + d.value, 0);
  });

  avgDealSize = computed(() => {
    const deals = this.crmState.tenantDeals();
    if (deals.length === 0) return 0;
    return Math.round(this.totalPipeline() / deals.length);
  });

  teamPerformance = [
    {
      name: 'Jessica Miller',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      dealsCount: 18,
      revenue: 840000,
      winRate: 74,
      quotaAttainment: 114
    },
    {
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      dealsCount: 14,
      revenue: 520000,
      winRate: 68,
      quotaAttainment: 104
    },
    {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      dealsCount: 11,
      revenue: 380000,
      winRate: 62,
      quotaAttainment: 96
    }
  ];

  ngAfterViewInit() {
    this.initForecastChart();
  }

  ngOnDestroy() {
    this.forecastChart?.destroy();
  }

  private initForecastChart() {
    if (!this.forecastCanvas) return;
    const ctx = this.forecastCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.forecastChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Q1 2026', 'Q2 2026 (Proj)', 'Q3 2026', 'Q4 2026'],
        datasets: [
          {
            label: 'Actual / Forecast Revenue',
            data: [640, 820, 580, 720],
            backgroundColor: '#4f46e5',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Target Quota',
            data: [600, 750, 700, 800],
            backgroundColor: 'rgba(203, 213, 225, 0.7)',
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const y = ctx.parsed.y ?? 0;
                return ` ${ctx.dataset.label}: ${this.crmState.currencySymbol()}${y}k`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              font: { size: 11 },
              color: '#94a3b8',
              callback: (v) => `${this.crmState.currencySymbol()}${v}k`
            }
          }
        }
      }
    });
  }

  exportAnalyticsCsv() {
    const data = this.teamPerformance.map(r => ({
      'Sales Rep': r.name,
      'Closed Revenue': r.revenue,
      'Deals Count': r.dealsCount,
      'Win Rate': r.winRate + '%',
      'Quota Attainment': r.quotaAttainment + '%'
    }));
    this.exportService.exportToCsv(data, `${this.crmState.currentTenant().slug}_revenue_analytics`);
    this.notificationService.showToast('success', 'Export Complete', 'Revenue report downloaded as CSV.');
  }

  exportAnalyticsExcel() {
    const data = this.teamPerformance.map(r => ({
      'Sales Rep': r.name,
      'Closed Revenue': r.revenue,
      'Deals Count': r.dealsCount,
      'Win Rate': r.winRate + '%',
      'Quota Attainment': r.quotaAttainment + '%'
    }));
    this.exportService.exportToExcel(data, `${this.crmState.currentTenant().slug}_revenue_analytics`, 'Analytics');
    this.notificationService.showToast('success', 'Excel Spreadsheet Exported', 'Revenue report downloaded in Excel format.');
  }
}
