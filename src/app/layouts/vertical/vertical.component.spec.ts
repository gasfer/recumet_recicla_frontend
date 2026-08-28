import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { EventService } from 'src/app/core/services/event.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { VerticalComponent } from './vertical.component';

describe('VerticalComponent responsive shell', () => {
  let component: VerticalComponent;
  let fixture: ComponentFixture<VerticalComponent>;
  let routerEvents: Subject<unknown>;
  let viewportWidth: number;

  beforeEach(async () => {
    viewportWidth = 390;
    spyOnProperty(window, 'innerWidth', 'get').and.callFake(() => viewportWidth);
    routerEvents = new Subject<unknown>();

    await TestBed.configureTestingModule({
      declarations: [VerticalComponent],
      providers: [
        { provide: Router, useValue: { events: routerEvents.asObservable() } },
        { provide: EventService, useValue: {} },
        { provide: ValidatorsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VerticalComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });

  afterEach(() => {
    fixture.destroy();
    document.body.classList.remove('sidebar-enable', 'app-sidebar-open', 'vertical-collpsed');
    document.getElementById('vertical-menu-btn')?.remove();
  });

  it('opens the mobile sidebar without condensing the desktop layout', () => {
    component.onToggleMobileMenu();

    expect(component.isMobileSidebarOpen).toBeTrue();
    expect(document.body.classList.contains('sidebar-enable')).toBeTrue();
    expect(document.body.classList.contains('app-sidebar-open')).toBeTrue();
    expect(document.body.classList.contains('vertical-collpsed')).toBeFalse();
  });

  it('closes on Escape and restores focus to the trigger', fakeAsync(() => {
    const trigger = document.createElement('button');
    trigger.id = 'vertical-menu-btn';
    document.body.appendChild(trigger);
    const focus = spyOn(trigger, 'focus');
    component.onToggleMobileMenu();

    component.onEscapeKey();
    tick(20);

    expect(component.isMobileSidebarOpen).toBeFalse();
    expect(focus).toHaveBeenCalled();
  }));

  it('closes when navigation finishes', () => {
    component.onToggleMobileMenu();

    routerEvents.next(new NavigationEnd(1, '/dashboard/home', '/dashboard/home'));

    expect(component.isMobileSidebarOpen).toBeFalse();
    expect(document.body.classList.contains('app-sidebar-open')).toBeFalse();
  });

  it('uses the condensed class only in desktop mode', () => {
    viewportWidth = 1366;
    component.onViewportResize();

    component.onToggleMobileMenu();

    expect(component.isDesktopCondensed).toBeTrue();
    expect(document.body.classList.contains('vertical-collpsed')).toBeTrue();
    expect(document.body.classList.contains('sidebar-enable')).toBeFalse();
  });

  it('cleans mobile state when resizing to desktop', () => {
    component.onToggleMobileMenu();
    viewportWidth = 1024;

    component.onViewportResize();

    expect(component.isMobileSidebarOpen).toBeFalse();
    expect(document.body.classList.contains('sidebar-enable')).toBeFalse();
    expect(document.body.classList.contains('app-sidebar-open')).toBeFalse();
  });
});
