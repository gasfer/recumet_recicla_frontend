import { DOCUMENT } from '@angular/common';
import { EventEmitter } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Dialog } from 'primeng/dialog';
import { DialogFocusRestoreDirective } from './dialog-focus-restore.directive';

describe('DialogFocusRestoreDirective', () => {
  let onHide: EventEmitter<void>;
  let onShow: EventEmitter<void>;
  let dialog: Pick<Dialog, 'visible' | 'onShow' | 'onHide'>;

  beforeEach(() => {
    onHide = new EventEmitter<void>();
    onShow = new EventEmitter<void>();
    dialog = { visible: false, onShow, onHide };
    TestBed.configureTestingModule({
      providers: [
        { provide: Dialog, useValue: dialog },
        { provide: DOCUMENT, useValue: document },
      ],
    });
  });

  it('restores focus to the control used before the dialog opened', fakeAsync(() => {
    const directive = TestBed.runInInjectionContext(() => new DialogFocusRestoreDirective());
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const focus = spyOn(trigger, 'focus');
    directive.rememberTrigger({ target: trigger } as unknown as FocusEvent);

    dialog.visible = true;
    const dialogInput = document.createElement('input');
    directive.rememberTrigger({ target: dialogInput } as unknown as FocusEvent);
    onShow.emit();
    onHide.emit();
    flushMicrotasks();

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    trigger.remove();
    directive.ngOnDestroy();
  }));

  it('does not focus a trigger that is no longer available', fakeAsync(() => {
    const directive = TestBed.runInInjectionContext(() => new DialogFocusRestoreDirective());
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const focus = spyOn(trigger, 'focus');
    directive.rememberTrigger({ target: trigger } as unknown as FocusEvent);
    trigger.remove();

    onHide.emit();
    flushMicrotasks();

    expect(focus).not.toHaveBeenCalled();
    directive.ngOnDestroy();
  }));
});
