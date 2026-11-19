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
      <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
        <!-- Section Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tenant Custom Fields
            </h4>
          </div>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Dynamic Schema
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          @for (field of entityFields(); track field.id) {
            <div class="form-group space-y-1">
              <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
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
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition shadow-2xs"
                  [placeholder]="'Enter ' + field.label">
              }

              <!-- Number Input -->
              @if (field.type === 'number') {
                <input
                  type="number"
                  [ngModel]="values[field.key]"
                  (ngModelChange)="onFieldChange(field.key, $event)"
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition shadow-2xs"
                  [placeholder]="'0'">
              }

              <!-- Select Dropdown -->
              @if (field.type === 'select') {
                <div class="relative">
                  <select
                    [ngModel]="values[field.key]"
                    (ngModelChange)="onFieldChange(field.key, $event)"
                    class="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition shadow-2xs pr-8">
                    <option value="">-- Select {{ field.label }} --</option>
                    @for (opt of field.options; track opt) {
                      <option [value]="opt">{{ opt }}</option>
                    }
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <app-icon name="chevron-down" [size]="14"></app-icon>
                  </span>
                </div>
              }

              <!-- Boolean Switch -->
              @if (field.type === 'boolean') {
                <div class="pt-1">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      [ngModel]="values[field.key]"
                      (ngModelChange)="onFieldChange(field.key, $event)"
                      class="sr-only peer">
                    <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span class="ml-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
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
