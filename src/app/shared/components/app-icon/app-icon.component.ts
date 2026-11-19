import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center justify-center icon-wrapper" [style.width.px]="size" [style.height.px]="size">
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        [attr.stroke-width]="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        [ngSwitch]="name">

        <!-- Dashboard -->
        <g *ngSwitchCase="'dashboard'">
          <rect width="7" height="9" x="3" y="3" rx="1"/>
          <rect width="7" height="5" x="14" y="3" rx="1"/>
          <rect width="7" height="9" x="14" y="12" rx="1"/>
          <rect width="7" height="5" x="3" y="16" rx="1"/>
        </g>

        <!-- Leads / Users -->
        <g *ngSwitchCase="'leads'">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </g>

        <!-- User (Single) -->
        <g *ngSwitchCase="'user'">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </g>

        <!-- Briefcase / Job Title -->
        <g *ngSwitchCase="'briefcase'">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </g>

        <!-- Building / Company -->
        <g *ngSwitchCase="'building'">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
          <path d="M9 22v-4h6v4"/>
          <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
          <path d="M12 10h.01"/><path d="M12 14h.01"/>
          <path d="M16 10h.01"/><path d="M16 14h.01"/>
          <path d="M8 10h.01"/><path d="M8 14h.01"/>
        </g>

        <!-- Pipeline / Kanban -->
        <g *ngSwitchCase="'pipeline'">
          <rect width="6" height="18" x="3" y="3" rx="1"/>
          <rect width="6" height="12" x="10" y="3" rx="1"/>
          <rect width="6" height="8" x="17" y="3" rx="1"/>
        </g>

        <!-- Companies / Building -->
        <g *ngSwitchCase="'companies'">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
          <path d="M9 22v-4h6v4"/>
          <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
          <path d="M12 10h.01"/><path d="M12 14h.01"/>
          <path d="M16 10h.01"/><path d="M16 14h.01"/>
          <path d="M8 10h.01"/><path d="M8 14h.01"/>
        </g>

        <!-- Contacts / Contact Card -->
        <g *ngSwitchCase="'contacts'">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </g>

        <!-- Activities / Clock / Timeline -->
        <g *ngSwitchCase="'activities'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </g>

        <!-- Workflows / Zap -->
        <g *ngSwitchCase="'workflows'">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </g>

        <!-- Analytics / Trending -->
        <g *ngSwitchCase="'analytics'">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </g>

        <!-- Settings -->
        <g *ngSwitchCase="'settings'">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </g>

        <!-- Bell -->
        <g *ngSwitchCase="'bell'">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </g>

        <!-- Mail -->
        <g *ngSwitchCase="'mail'">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </g>

        <!-- Phone -->
        <g *ngSwitchCase="'phone'">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </g>

        <!-- Calendar -->
        <g *ngSwitchCase="'calendar'">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </g>

        <!-- Search -->
        <g *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </g>

        <!-- Plus -->
        <g *ngSwitchCase="'plus'">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </g>

        <!-- Check -->
        <g *ngSwitchCase="'check'">
          <polyline points="20 6 9 17 4 12"/>
        </g>

        <!-- Download -->
        <g *ngSwitchCase="'download'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" x2="12" y1="15" y2="3"/>
        </g>

        <!-- Trash -->
        <g *ngSwitchCase="'trash'">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </g>

        <!-- Edit -->
        <g *ngSwitchCase="'edit'">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        </g>

        <!-- Filter -->
        <g *ngSwitchCase="'filter'">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </g>

        <!-- Close / X -->
        <g *ngSwitchCase="'x'">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </g>

        <!-- Chevron Down -->
        <g *ngSwitchCase="'chevron-down'">
          <path d="m6 9 6 6 6-6"/>
        </g>

        <!-- Sparkles / AI -->
        <g *ngSwitchCase="'sparkles'">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </g>

        <!-- Shield -->
        <g *ngSwitchCase="'shield'">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
        </g>

        <!-- Copy -->
        <g *ngSwitchCase="'copy'">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </g>

        <!-- Dollar / Revenue -->
        <g *ngSwitchCase="'dollar'">
          <line x1="12" x2="12" y1="2" y2="22"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </g>

        <!-- Note -->
        <g *ngSwitchCase="'note'">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" x2="8" y1="13" y2="13"/>
          <line x1="16" x2="8" y1="17" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </g>

        <!-- Default fallback -->
        <g *ngSwitchDefault>
          <circle cx="12" cy="12" r="10"/>
        </g>
      </svg>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      vertical-align: middle;
      line-height: 1;
    }
    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class AppIconComponent {
  @Input() name: string = 'dashboard';
  @Input() size: number = 18;
  @Input() strokeWidth: number = 2;
}
