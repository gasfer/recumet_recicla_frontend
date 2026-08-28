import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-purchase-traceability-timeline',
  templateUrl: './purchase-traceability-timeline.component.html',
  styleUrls: ['./purchase-traceability-timeline.component.scss'],
})
export class PurchaseTraceabilityTimelineComponent {
  @Input() visible = false;
  @Input() data: any;
  @Output() visibleChange = new EventEmitter<boolean>();

  search = '';
  eventType = '';

  get events(): any[] {
    return (this.data?.events || []).filter((event: any) => {
      const matchesType = !this.eventType || event.event_type === this.eventType;
      const text = `${event.event_type} ${event.reason || ''} ${event.actor?.full_names || ''}`.toLowerCase();
      return matchesType && text.includes(this.search.toLowerCase());
    });
  }

  get eventTypes(): string[] {
    return [...new Set(this.eventsWithoutFilters.map((event: any) => event.event_type))].filter(Boolean).sort();
  }

  private get eventsWithoutFilters(): any[] {
    return this.data?.events || [];
  }

  close(): void { this.visibleChange.emit(false); }
  eventClass(entityType: string): string { return `trace-event trace-event--${String(entityType || 'purchase').toLowerCase().replace('_', '-')}`; }
}
