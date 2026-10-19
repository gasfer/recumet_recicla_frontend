import { SidebarPreferencesService } from './sidebar-preferences.service';

describe('SidebarPreferencesService', () => {
  const service = new SidebarPreferencesService();
  afterEach(() => {
    localStorage.removeItem('recumet.ui.sidebar.v1.101');
    localStorage.removeItem('recumet.ui.sidebar.v1.102');
  });

  it('restores mode and expanded appearance for the same account', () => {
    service.save({ collapsed: true, expandedType: 'light' }, 101);
    expect(new SidebarPreferencesService().load(101)).toEqual({ collapsed: true, expandedType: 'light' });
    expect(service.load(102)).toEqual({ collapsed: false, expandedType: 'dark' });
  });

  it('ignores malformed and unsupported preferences', () => {
    localStorage.setItem('recumet.ui.sidebar.v1.101', '{bad');
    expect(service.load(101).collapsed).toBeFalse();
    localStorage.setItem('recumet.ui.sidebar.v1.101', '{"collapsed":true,"expandedType":"unknown"}');
    expect(service.load(101)).toEqual({ collapsed: false, expandedType: 'dark' });
  });

  it('continues operating when storage is denied', () => {
    spyOn(localStorage, 'getItem').and.throwError('denied');
    spyOn(localStorage, 'setItem').and.throwError('denied');
    expect(() => service.save({ collapsed: true, expandedType: 'dark' }, 101)).not.toThrow();
    expect(service.load(101).collapsed).toBeFalse();
  });

  it('preserves authentication and work-context values', () => {
    const before = localStorage.getItem('token');
    const context = localStorage.getItem('work-context');
    service.save({ collapsed: true, expandedType: 'dark' }, 101);
    expect(localStorage.getItem('token')).toBe(before);
    expect(localStorage.getItem('work-context')).toBe(context);
  });
});
