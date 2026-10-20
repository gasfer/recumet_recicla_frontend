import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-scale-weight-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scale-weight-display.component.html',
  styleUrls: ['./scale-weight-display.component.scss'],
})
export class ScaleWeightDisplayComponent implements OnInit, OnDestroy {
  readonly peso = signal(0);
  private readonly canal = new BroadcastChannel('recumet-balanza-peso');

  ngOnInit(): void {
    this.canal.onmessage = ({ data }) => {
      if (data?.type === 'weight' && Number.isFinite(Number(data.peso)) && Number(data.peso) >= 0) {
        this.peso.set(Number(data.peso));
      }
      if (data?.type === 'close') window.close();
    };
    this.canal.postMessage({ type: 'ready' });
  }

  ngOnDestroy(): void {
    this.canal.postMessage({ type: 'closed' });
    this.canal.close();
  }

  get pesoFormateado(): string {
    return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(this.peso());
  }
}
