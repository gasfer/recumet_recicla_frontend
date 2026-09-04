import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PurchaseTraceabilityApiService } from '../../services/purchase-traceability-api.service';
import { displayValue, eventLabel, groupEvents } from './purchase-traceability-presenter';

@Component({
  selector: 'app-purchase-traceability-timeline',
  templateUrl: './purchase-traceability-timeline.component.html',
  styleUrls: ['./purchase-traceability-timeline.component.scss'],
})
export class PurchaseTraceabilityTimelineComponent implements OnChanges {
  @Input() visible = false;
  @Input() data: any;
  @Input() mode: 'purchase' | 'provider' = 'purchase';
  @Output() visibleChange = new EventEmitter<boolean>();
  private api = inject(PurchaseTraceabilityApiService);
  search = '';
  eventType = '';
  loading = false;
  error = '';
  eventLabel = eventLabel;
  displayValue = displayValue;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) { this.search = ''; this.eventType = ''; this.error = ''; }
  }
  trackGroup(_index: number, group: { key: string }): string { return group.key; }
  trackEvent(index: number, event: { id?: number }): number { return event.id ?? index; }
  trackRow(_index: number, row: { field: string }): string { return row.field; }
  get groups() {
    const query = this.search.toLocaleLowerCase('es').trim();
    return groupEvents(this.data?.events || []).map(group => ({ ...group, events: group.events.filter(event => {
      const text = `${group.actor} ${event.label} ${event.reason || ''} ${event.detail?.product?.name || ''} ${event.detail?.product?.cod || ''} ${event.rows.map((row: any) => `${row.label} ${row.before} ${row.after}`).join(' ')}`.toLocaleLowerCase('es');
      return (!this.eventType || event.event_type === this.eventType) && text.includes(query);
    }) })).filter(group => group.events.length);
  }
  get eventTypes(): string[] {
    return [...new Set<string>(groupEvents(this.data?.events || []).flatMap(group => group.events.map(event => event.event_type)))].filter(Boolean);
  }
  get hasMore(): boolean { return (this.data?.pagination?.page || 1) < (this.data?.pagination?.pages || 1); }
  async loadMore(): Promise<void> {
    if (this.loading || !this.hasMore) return;
    const current = this.data;
    this.loading = true;
    this.error = '';
    try {
      const response = await firstValueFrom(this.mode === 'provider'
        ? this.api.getProvider(current.provider.id, current.pagination.page + 1, current.pagination.limit)
        : this.api.getPurchase(current.purchase.id, current.pagination.page + 1, current.pagination.limit));
      if (this.data !== current) return;
      this.data = { ...current,
        events: [...current.events, ...response.traceability.events],
        purchases: this.mode === 'provider' ? [...(current.purchases || []), ...(response.traceability.purchases || [])] : current.purchases,
        pagination: response.traceability.pagination };
    } catch { if (this.data === current) this.error = 'No se pudieron cargar más registros. Intente nuevamente.'; }
    finally { this.loading = false; }
  }
  close(): void { this.visibleChange.emit(false); }
}
