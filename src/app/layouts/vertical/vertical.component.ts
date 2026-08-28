import { AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { EventService } from 'src/app/core/services/event.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { TransferReviewService } from 'src/app/services/transfer-review.service';

@Component({
  selector: 'app-vertical',
  templateUrl: './vertical.component.html',
  styles: [
  ]
})
export class VerticalComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly sidebarId = 'app-sidebar';
  readonly mobileBreakpoint = 992;
  isDesktopCondensed = false;
  isMobileViewport = false;
  isMobileSidebarOpen = false;
  @Input() breadcrumbs:any = [];
  // sidebartype: string;
  validatorsService = inject(ValidatorsService);
  reviewService = inject(TransferReviewService);
  private readonly routerEventsSubscription: Subscription;

  constructor(private router: Router, private eventService: EventService) {
    this.routerEventsSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.closeMobileSidebar(false));
  }

  ngOnInit() {
    document.body.setAttribute('data-layout', 'vertical');
    this.isDesktopCondensed = document.body.classList.contains('vertical-collpsed');
    this.synchronizeViewportState();
    this.reviewService.checkCurrentContext().subscribe();
  }

  ngAfterViewInit() {
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
  }

  /**
   * On mobile toggle button clicked
   */
  onToggleMobileMenu() {
    if (this.isMobileViewport) {
      this.setMobileSidebarOpen(!this.isMobileSidebarOpen);
      return;
    }

    this.isDesktopCondensed = !this.isDesktopCondensed;
    document.body.classList.toggle('vertical-collpsed', this.isDesktopCondensed);
    document.body.classList.remove('sidebar-enable', 'app-sidebar-open');
  }

  closeMobileSidebar(restoreFocus = false) {
    if (!this.isMobileSidebarOpen && !document.body.classList.contains('sidebar-enable')) return;
    this.setMobileSidebarOpen(false, restoreFocus);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isMobileSidebarOpen) this.closeMobileSidebar(true);
  }

  @HostListener('window:resize')
  onViewportResize() {
    this.synchronizeViewportState();
  }

  ngOnDestroy() {
    this.routerEventsSubscription.unsubscribe();
    document.body.classList.remove('sidebar-enable', 'app-sidebar-open');
  }

  private synchronizeViewportState() {
    const wasMobile = this.isMobileViewport;
    this.isMobileViewport = window.innerWidth <= this.mobileBreakpoint;

    if (this.isMobileViewport) {
      document.body.classList.remove('vertical-collpsed');
      return;
    }

    if (wasMobile || this.isMobileSidebarOpen) this.closeMobileSidebar(false);
    document.body.classList.toggle('vertical-collpsed', this.isDesktopCondensed);
  }

  private setMobileSidebarOpen(open: boolean, restoreFocus = false) {
    this.isMobileSidebarOpen = this.isMobileViewport && open;
    document.body.classList.toggle('sidebar-enable', this.isMobileSidebarOpen);
    document.body.classList.toggle('app-sidebar-open', this.isMobileSidebarOpen);
    if (this.isMobileViewport) document.body.classList.remove('vertical-collpsed');

    if (!this.isMobileSidebarOpen && restoreFocus) {
      requestAnimationFrame(() => document.getElementById('vertical-menu-btn')?.focus());
    }
  }
}
