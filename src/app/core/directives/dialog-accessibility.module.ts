import { NgModule } from '@angular/core';
import { DialogFocusRestoreDirective } from './dialog-focus-restore.directive';

@NgModule({
  declarations: [DialogFocusRestoreDirective],
  exports: [DialogFocusRestoreDirective],
})
export class DialogAccessibilityModule { }
