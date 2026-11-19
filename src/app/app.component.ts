import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ModalComponent } from './shared/components/modal/modal.component';
import { DynamicFieldsComponent } from './shared/components/dynamic-form/dynamic-form.component';
import { AppIconComponent } from './shared/components/app-icon/app-icon.component';
import { CrmStateService } from './core/services/crm-state.service';
import { NotificationService } from './core/services/notification.service';
import { DealPriority } from './core/models/crm.models';

import { CurrencyFormatPipe } from './shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, FormsModule,
    SidebarComponent, NavbarComponent, ToastContainerComponent,
    ModalComponent, DynamicFieldsComponent, AppIconComponent, CurrencyFormatPipe
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  crmState = inject(CrmStateService);
  notificationService = inject(NotificationService);

  isGlobalDealModalOpen = false;
  isGlobalEmailModalOpen = false;

  // New Deal form
  dealTitle = '';
  dealCompanyId = '';
  dealCompanyName = '';
  dealValue = 65000;
  dealStageId = 'stage-prospect';
  dealPriority: DealPriority = 'High';
  dealCloseDate = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
  dealCustomFields: Record<string, any> = {};

  get newDealForecast() {
    const stage = this.crmState.pipelineStages().find(s => s.id === this.dealStageId);
    const prob = stage ? stage.defaultProbability : 20;
    const val = Number(this.dealValue) || 0;
    const weighted = Math.round(val * (prob / 100));
    return {
      stageName: stage ? stage.name : 'Prospecting',
      probability: prob,
      weightedValue: weighted,
      repName: this.crmState.getUserName(this.crmState.currentUserId())
    };
  }

  // Email form
  emailTo = '';
  emailSubject = '';
  emailBody = '';

  openNewDealModal() {
    this.dealTitle = '';
    this.dealCompanyId = this.crmState.tenantCompanies()[0]?.id || '';
    this.dealCompanyName = this.crmState.tenantCompanies()[0]?.name || '';
    this.dealValue = 65000;
    this.dealCustomFields = {};
    this.isGlobalDealModalOpen = true;
  }

  onCompanySelected(id: string) {
    const comp = this.crmState.tenantCompanies().find(c => c.id === id);
    if (comp) this.dealCompanyName = comp.name;
  }

  submitNewDeal() {
    if (!this.dealTitle || !this.dealCompanyId) return;

    this.crmState.createDeal({
      title: this.dealTitle,
      companyId: this.dealCompanyId,
      companyName: this.dealCompanyName,
      value: this.dealValue,
      currency: this.crmState.currencySymbol(),
      stageId: this.dealStageId,
      probability: 30,
      expectedCloseDate: this.dealCloseDate,
      assignedTo: this.crmState.currentUserId(),
      priority: this.dealPriority,
      tags: ['New Deal'],
      customFields: this.dealCustomFields
    });

    this.isGlobalDealModalOpen = false;
  }

  openEmailComposer() {
    const primaryContact = this.crmState.tenantContacts()[0];
    this.emailTo = primaryContact ? primaryContact.email : 'contact@enterprise.com';
    this.emailSubject = 'Octax Enterprise Solution Follow-up';
    this.emailBody = `Hi ${primaryContact ? primaryContact.firstName : 'Partner'},\n\nSharing the latest platform capability updates and security roadmap for your review.\n\nBest regards,\n${this.crmState.currentUser().name}`;
    this.isGlobalEmailModalOpen = true;
  }

  async submitEmail() {
    if (!this.emailTo || !this.emailSubject) return;

    await this.notificationService.simulateSendEmail(this.emailTo, this.emailSubject, this.emailBody);
    this.crmState.logActivity({
      type: 'email',
      title: `Email Sent: ${this.emailSubject}`,
      description: this.emailBody,
      relatedType: 'deal',
      relatedId: 'deal-1',
      metadata: {
        emailSubject: this.emailSubject,
        emailTo: this.emailTo
      }
    });

    this.isGlobalEmailModalOpen = false;
  }
}
