import { DOCUMENT } from '@angular/common';
import { Directive, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { Subscription } from 'rxjs';

@Directive({
  selector: 'p-dialog',
})
export class DialogFocusRestoreDirective implements OnInit, OnDestroy {
  private readonly dialog = inject(Dialog);
  private readonly document = inject(DOCUMENT);
  private readonly subscriptions = new Subscription();

  private trigger: HTMLElement | null = null;
  private isOpen = this.dialog.visible;
  private motionPreference = typeof this.document.defaultView?.matchMedia === 'function'
    ? this.document.defaultView.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  private defaultTransitionOptions = '250ms cubic-bezier(0.2, 0, 0, 1)';

  private readonly onMotionPreferenceChange = () => this.applyMotionPreference();

  constructor() {
    this.subscriptions.add(this.dialog.onShow.subscribe(() => {
      this.isOpen = true;
    }));
    this.subscriptions.add(this.dialog.onHide.subscribe(() => {
      this.restoreFocus();
      this.isOpen = false;
    }));
  }

  ngOnInit(): void {
    this.defaultTransitionOptions = this.dialog.transitionOptions || this.defaultTransitionOptions;
    this.applyMotionPreference();
    this.motionPreference?.addEventListener?.('change', this.onMotionPreferenceChange);
  }

  @HostListener('document:focusin', ['$event'])
  rememberTrigger(event: FocusEvent): void {
    const target = event.target;
    const dialogIsOpenOrOpening = this.isOpen || this.dialog.visible;
    if (!dialogIsOpenOrOpening && target instanceof HTMLElement && target !== this.document.body) {
      this.trigger = target;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.motionPreference?.removeEventListener?.('change', this.onMotionPreferenceChange);
    this.trigger = null;
  }

  private applyMotionPreference(): void {
    this.dialog.transitionOptions = this.motionPreference?.matches
      ? '0ms linear'
      : this.defaultTransitionOptions;
  }

  private restoreFocus(): void {
    const trigger = this.trigger;
    this.trigger = null;

    queueMicrotask(() => {
      if (trigger?.isConnected && !trigger.hasAttribute('disabled')) {
        trigger.focus({ preventScroll: true });
      }
    });
  }
}
