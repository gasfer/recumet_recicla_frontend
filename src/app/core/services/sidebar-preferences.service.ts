import { Injectable } from '@angular/core';

export type ExpandedSidebarType = 'light' | 'dark' | 'compact' | 'colored';
export interface SidebarPreference {
  collapsed: boolean;
  expandedType: ExpandedSidebarType;
}

const expandedTypes: ExpandedSidebarType[] = ['light', 'dark', 'compact', 'colored'];

@Injectable({ providedIn: 'root' })
export class SidebarPreferencesService {
  private key(userId?: number): string {
    return `recumet.ui.sidebar.v1.${userId ?? 'device'}`;
  }

  load(userId?: number): SidebarPreference {
    const fallback: SidebarPreference = { collapsed: false, expandedType: 'dark' };
    try {
      const raw = localStorage.getItem(this.key(userId));
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      if (typeof value?.collapsed !== 'boolean' || !expandedTypes.includes(value.expandedType)) return fallback;
      return { collapsed: value.collapsed, expandedType: value.expandedType };
    } catch {
      return fallback;
    }
  }

  save(preference: SidebarPreference, userId?: number): void {
    try {
      localStorage.setItem(this.key(userId), JSON.stringify(preference));
    } catch {
      // The sidebar remains operable when the browser disallows storage.
    }
  }
}
