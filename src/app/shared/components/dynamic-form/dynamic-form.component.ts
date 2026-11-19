import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmStateService } from '../../../core/services/crm-state.service';
import { CustomFieldDefinition } from '../../../core/models/crm.models';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-dynamic-fields',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    @if (entityFields().length > 0) {
      <div class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
        <!-- Section Header -->
        <div class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <app-icon name="settings" [size]="13"></app-icon>
            </span>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Tenant Custom Attributes
            </h4>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            Dynamic Schema
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          @for (field of entityFields(); track field.id) {
            <div class="form-group space-y-1">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {{ field.label }}
                @if (field.required) {
                  <span class="text-rose-500">*</span>
                }
              </label>

              <!-- Text Input -->
              @if (field.type === 'text') {
                <input
                  type="text"
                  [ngModel]="values[field.key]"
                  (ngModelChange)="onFieldChange(field.key, $event)"
                  class="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:outline-none transition shadow-2xs"
                  [placeholder]="'Enter ' + field.label">
              }

              <!-- Number Input -->
              @if (field.type === 'number') {
                <input
                  type="number"
                  [ngModel]="values[field.key]"
                  (ngModelChange)="onFieldChange(field.key, $event)"
                  class="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:outline-none transition shadow-2xs"
                  [placeholder]="'0'">
              }

              <!-- Select Dropdown -->
              @if (field.type === 'select') {
                <div class="relative">
                  <select
                    [ngModel]="values[field.key]"
                    (ngModelChange)="onFieldChange(field.key, $event)"
                    class="w-full appearance-none px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:outline-none transition shadow-2xs pr-8">
                    <option value="">-- Select {{ field.label }} --</option>
                    @for (opt of field.options; track opt) {
                      <option [value]="opt">{{ opt }}</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="14"></app-icon>
                  </span>
                </div>
              }

              <!-- Boolean Switch -->
              @if (field.type === 'boolean') {
                <div class="pt-1.5">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      [ngModel]="values[field.key]"
                      (ngModelChange)="onFieldChange(field.key, $event)"
                      class="sr-only peer">
                    <div class="w-10 h-5.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span class="ml-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {{ values[field.key] ? 'Enabled' : 'Disabled' }}
                    </span>
                  </label>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `
})
export class DynamicFieldsComponent {
  private crmState = inject(CrmStateService);

  @Input() entityType: CustomFieldDefinition['entity'] = 'lead';
  @Input() values: Record<string, any> = {};
  @Output() valuesChange = new EventEmitter<Record<string, any>>();

  entityFields() {
    return this.crmState.tenantCustomFields().filter(f => f.entity === this.entityType);
  }

  onFieldChange(key: string, val: any) {
    const updated = { ...this.values, [key]: val };
    this.valuesChange.emit(updated);
  }
}
