import { DOCUMENT } from '@angular/common';
import { Directive, HostListener, OnDestroy, inject } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { Subscription } from 'rxjs';

@Directive({
  selector: 'p-dialog',
})
export class DialogFocusRestoreDirective implements OnDestroy {
  private readonly dialog = inject(Dialog);
  private readonly document = inject(DOCUMENT);
  private readonly subscriptions = new Subscription();

  private trigger: HTMLElement | null = null;
  private isOpen = this.dialog.visible;

  constructor() {
    this.subscriptions.add(this.dialog.onShow.subscribe(() => {
      this.isOpen = true;
    }));
    this.subscriptions.add(this.dialog.onHide.subscribe(() => {
      this.restoreFocus();
      this.isOpen = false;
    }));
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
    this.trigger = null;
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
