import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DecimalFormatService {
  readonly locale = 'es-BO';
  readonly decimals = signal(2);

  setDecimals(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 4) throw new Error('Los decimales deben ser un entero entre 0 y 4.');
    this.decimals.set(value);
  }
  get digitsInfo() { const places = this.decimals(); return `1.${places}-${places}`; }
  get diagnosticDigitsInfo() { return '1.4-20'; }
  get inputOptions() { const places = this.decimals(); return { locale: this.locale, minFractionDigits: places, maxFractionDigits: places }; }
  get minimumQuantity() { return 1 / (10 ** this.decimals()); }
  private scaled(value: number | string | null | undefined): { units: bigint; scale: number } {
    const raw = String(value ?? 0).trim().replace(',', '.');
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
    if (!match) throw new TypeError('La cantidad decimal no es válida.');
    const fraction = match[3] || '';
    const units = BigInt(`${match[1]}${match[2]}${fraction}`);
    return { units, scale: fraction.length };
  }
  compare(left: number | string | null | undefined, right: number | string | null | undefined): number {
    const first = this.scaled(left); const second = this.scaled(right);
    const scale = Math.max(first.scale, second.scale);
    const a = first.units * (10n ** BigInt(scale - first.scale));
    const b = second.units * (10n ** BigInt(scale - second.scale));
    return a === b ? 0 : a > b ? 1 : -1;
  }
  subtract(left: number | string | null | undefined, right: number | string | null | undefined): string {
    const first = this.scaled(left); const second = this.scaled(right);
    const scale = Math.max(4, first.scale, second.scale);
    const units = first.units * (10n ** BigInt(scale - first.scale)) - second.units * (10n ** BigInt(scale - second.scale));
    const negative = units < 0n ? '-' : '';
    const digits = (units < 0n ? -units : units).toString().padStart(scale + 1, '0');
    return `${negative}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  }
  sum(values: Array<number | string | null | undefined>): string {
    return values.reduce<string>((total, value) => this.subtract(total, this.subtract(0, value)), '0.0000');
  }
  format(value: number | string | null | undefined) { return new Intl.NumberFormat(this.locale, { minimumFractionDigits: this.decimals(), maximumFractionDigits: this.decimals() }).format(Number(value ?? 0)); }
  formatDiagnostic(value: number | string | null | undefined) { return new Intl.NumberFormat(this.locale, { minimumFractionDigits: 4, maximumFractionDigits: 20 }).format(Number(value ?? 0)); }
}
