import { getSucursalTheme, getSucursalBadgeStyle } from './sucursal-badge.util';

describe('sucursal-badge.util', () => {
  it('should return default theme when input is null or undefined', () => {
    const theme = getSucursalTheme(null);
    expect(theme.bg).toBe('#f1f5f9');
    expect(theme.color).toBe('#475569');
  });

  it('should return theme for known sucursal case-insensitively and with accents stripped', () => {
    const themeMatriz = getSucursalTheme('Casa Matriz');
    expect(themeMatriz.color).toBe('#0369a1');

    const themeOruro = getSucursalTheme('SUCURSAL ORURO');
    expect(themeOruro.color).toBe('#15803d');

    const themeCbba = getSucursalTheme('SUCURSAL CBBA-REPUBLICA');
    expect(themeCbba.color).toBe('#854d0e');
  });

  it('should match when prefix "sucursal" is omitted', () => {
    const theme = getSucursalTheme('VIP');
    expect(theme.color).toBe('#7e22ce');
  });

  it('should return fallback theme for numbers or unknown sucursales consistently', () => {
    const theme1 = getSucursalTheme('Nueva Sucursal Pando');
    const theme2 = getSucursalTheme('Nueva Sucursal Pando');
    expect(theme1).toEqual(theme2);

    const themeNum = getSucursalTheme(3);
    expect(themeNum.bg).toBeDefined();
  });

  it('should generate inline badge styles properly', () => {
    const style = getSucursalBadgeStyle('SUCURSAL CGT');
    expect(style['background-color']).toBe('#ffedd5');
    expect(style['color']).toBe('#c2410c');
    expect(style['border-radius']).toBe('999px');
    expect(style['display']).toBe('inline-flex');
  });
});
