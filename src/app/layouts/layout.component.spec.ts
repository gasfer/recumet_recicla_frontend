import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { EventService } from '../core/services/event.service';
import { SessionManagementService } from '../core/services/session-management.service';
import { SidebarPreferencesService } from '../core/services/sidebar-preferences.service';
import { ValidatorsService } from '../services/validators.service';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent sidebar preference integration', () => {
  beforeEach(async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1440);
    localStorage.removeItem('recumet.ui.sidebar.v1.101');
    await TestBed.configureTestingModule({
      declarations: [LayoutComponent],
      providers: [
        { provide: Router, useValue: { events: new Subject() } },
        { provide: ValidatorsService, useValue: { user: () => ({ id: 101 }) } },
        { provide: SessionManagementService, useValue: { startMonitoring: () => {}, stopMonitoring: () => {} } },
      ],
    }).overrideComponent(LayoutComponent, { set: { template: '' } }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('recumet.ui.sidebar.v1.101');
    document.body.classList.remove('vertical-collpsed');
    for (const attr of ['data-sidebar', 'data-topbar', 'data-layout-size', 'data-layout-scrollable', 'data-keep-enlarged']) document.body.removeAttribute(attr);
  });

  it('toggles and persists mode without changing appearance or layout width', () => {
    const fixture = TestBed.createComponent(LayoutComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    TestBed.inject(EventService).broadcast('changeSidebartype', 'light');
    document.body.setAttribute('data-layout-size', 'boxed');
    const appearance = document.body.getAttribute('data-topbar');

    component.onSidebarCondensedChange(true);
    expect(component.sidebartype()).toBe('icon');
    expect(document.body.getAttribute('data-layout-size')).toBe('boxed');
    expect(document.body.getAttribute('data-sidebar')).toBe('light');
    expect(document.body.getAttribute('data-topbar')).toBe(appearance);
    expect(TestBed.inject(SidebarPreferencesService).load(101)).toEqual({ collapsed: true, expandedType: 'light' });
    component.LayoutWidth('fluid');
    expect(document.body.classList.contains('vertical-collpsed')).toBeTrue();

    component.onSidebarCondensedChange(false);
    expect(component.sidebartype()).toBe('light');
    expect(document.body.classList.contains('vertical-collpsed')).toBeFalse();
    fixture.destroy();
  });

  it('restores the preference on a new layout instance and removes old event listeners', () => {
    TestBed.inject(SidebarPreferencesService).save({ collapsed: true, expandedType: 'dark' }, 101);
    const fixture = TestBed.createComponent(LayoutComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    expect(component.sidebartype()).toBe('icon');
    fixture.destroy();
    TestBed.inject(EventService).broadcast('changeSidebartype', 'light');
    expect(component.sidebartype()).toBe('icon');
  });
});
