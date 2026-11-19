import { Injectable } from '@angular/core';
import { Lead } from '../models/crm.models';

export interface DuplicateGroup {
  lead: Lead;
  duplicates: Lead[];
  matchReasons: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LeadScoringService {

  /**
   * Calculate automated lead score (0 - 100) based on multiple strategic signals
   */
  calculateLeadScore(lead: Partial<Lead>): { score: number; tier: 'Hot' | 'Warm' | 'Cold' } {
    let score = 20; // baseline

    // Job Title seniority
    const title = (lead.title || '').toLowerCase();
    if (title.includes('cxo') || title.includes('ceo') || title.includes('cio') || title.includes('cto') || title.includes('founder') || title.includes('president') || title.includes('vp')) {
      score += 25;
    } else if (title.includes('director') || title.includes('head') || title.includes('lead')) {
      score += 15;
    } else if (title.includes('manager')) {
      score += 10;
    }

    // Lead Source intent
    switch (lead.source) {
      case 'Inbound Demo':
        score += 25;
        break;
      case 'Website':
        score += 20;
        break;
      case 'Referral':
        score += 25;
        break;
      case 'Partner':
        score += 15;
        break;
      case 'LinkedIn':
        score += 10;
        break;
      case 'Event':
        score += 10;
        break;
      default:
        score += 5;
    }

    // Estimated Value
    const val = lead.estimatedValue || 0;
    if (val >= 100000) {
      score += 20;
    } else if (val >= 50000) {
      score += 15;
    } else if (val >= 20000) {
      score += 10;
    }

    // Custom fields (e.g. is decision maker)
    if (lead.customFields && lead.customFields['decisionMaker']) {
      score += 10;
    }

    // Cap between 5 and 100
    score = Math.min(100, Math.max(5, score));

    let tier: 'Hot' | 'Warm' | 'Cold' = 'Warm';
    if (score >= 80) tier = 'Hot';
    else if (score < 50) tier = 'Cold';

    return { score, tier };
  }

  /**
   * Detect duplicates across the lead catalog
   */
  detectDuplicates(leads: Lead[]): DuplicateGroup[] {
    const duplicateGroups: DuplicateGroup[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < leads.length; i++) {
      const current = leads[i];
      if (visited.has(current.id)) continue;

      const matchingLeads: Lead[] = [];
      const reasons = new Set<string>();

      for (let j = i + 1; j < leads.length; j++) {
        const other = leads[j];
        if (visited.has(other.id)) continue;

        let isMatch = false;

        // Email exact match or domain + user
        if (current.email && other.email && current.email.trim().toLowerCase() === other.email.trim().toLowerCase()) {
          isMatch = true;
          reasons.add('Identical Email Address');
        }

        // Phone normalized match
        const p1 = (current.phone || '').replace(/\D/g, '');
        const p2 = (other.phone || '').replace(/\D/g, '');
        if (p1.length >= 7 && p2.length >= 7 && p1 === p2) {
          isMatch = true;
          reasons.add('Identical Phone Number');
        }

        // Name + Company similarity
        const fullName1 = `${current.firstName} ${current.lastName}`.trim().toLowerCase();
        const fullName2 = `${other.firstName} ${other.lastName}`.trim().toLowerCase();
        const comp1 = (current.company || '').trim().toLowerCase();
        const comp2 = (other.company || '').trim().toLowerCase();

        if (fullName1 === fullName2 && comp1 && comp2 && (comp1.includes(comp2) || comp2.includes(comp1))) {
          isMatch = true;
          reasons.add('Matching Contact Name & Company');
        }

        if (isMatch) {
          matchingLeads.push(other);
          visited.add(other.id);
        }
      }

      if (matchingLeads.length > 0) {
        visited.add(current.id);
        duplicateGroups.push({
          lead: current,
          duplicates: matchingLeads,
          matchReasons: Array.from(reasons)
        });
      }
    }

    return duplicateGroups;
  }
}
