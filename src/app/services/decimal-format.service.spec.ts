import { DecimalFormatService } from './decimal-format.service';

describe('DecimalFormatService: cantidades operativas e históricas', () => {
  const service = new DecimalFormatService();
  it('mantiene visible un residual histórico con precisión activa 2', () => {
    service.setDecimals(2);
    expect(service.format('1234.5678')).toBe('1.234,57');
    expect(service.formatDiagnostic('0.0004')).toBe('0,0004');
    expect(service.formatDiagnostic('10.12345')).toBe('10,12345');
  });
  it('rechaza configuraciones fuera de rango o fraccionarias', () => {
    for (const value of [-1, 5, 2.5, NaN]) expect(() => service.setDecimals(value)).toThrow();
  });
  it('compara y resta cantidades históricas sin perder residuos pequeños', () => {
    service.setDecimals(2);
    expect(service.compare('10.1234', '10.1230')).toBe(1);
    expect(service.subtract('10.1234', '10.1230')).toBe('0.0004');
    expect(service.minimumQuantity).toBe(0.01);
    service.setDecimals(0);
    expect(service.minimumQuantity).toBe(1);
  });
});
