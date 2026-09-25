import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DecimalFormatService {
  readonly locale = 'es-BO';
  readonly decimals = signal(2);

  setDecimals(value: number) { this.decimals.set(Math.min(4, Math.max(0, Number(value) || 0))); }
  get digitsInfo() { const places = this.decimals(); return `1.${places}-${places}`; }
  get inputOptions() { const places = this.decimals(); return { locale: this.locale, minFractionDigits: places, maxFractionDigits: places }; }
  format(value: number | string | null | undefined) { return new Intl.NumberFormat(this.locale, { minimumFractionDigits: this.decimals(), maximumFractionDigits: this.decimals() }).format(Number(value ?? 0)); }
}
