import { Pipe, PipeTransform, inject } from '@angular/core';
import { CrmStateService } from '../../core/services/crm-state.service';

@Pipe({
  name: 'crmCurrency',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  private crmState = inject(CrmStateService);

  transform(value: number | undefined | null, overrideSymbol?: string): string {
    if (value === undefined || value === null || isNaN(value)) {
      return `${overrideSymbol || this.crmState.currencySymbol()}0`;
    }
    const symbol = overrideSymbol || this.crmState.currencySymbol();
    return `${symbol}${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
}
