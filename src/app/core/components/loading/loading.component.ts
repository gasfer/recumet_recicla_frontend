import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type RecumetLoaderSize = 'xs' | 'sm' | 'md' | 'lg';
export type RecumetLoaderTheme = 'auto' | 'light' | 'dark';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  @Input() size: RecumetLoaderSize = 'md';
  @Input() fullscreen: boolean = false;
  @Input() inline: boolean = true;
  @Input() theme: RecumetLoaderTheme = 'auto';
  @Input() text: string = 'Cargando sistema...';
  @Input() showText: boolean = true;
  @Input() showLine: boolean = true;
  @Input() autoHide: boolean = false;
  @Input() customClass: string = '';

  get containerClasses(): string {
    const classes = ['recumet-loader'];

    if (this.fullscreen) {
      classes.push('recumet-loader--fullscreen');
    } else {
      classes.push('recumet-loader--inline');
    }

    if (this.size) {
      classes.push(`recumet-loader--${this.size}`);
    }

    if (this.theme === 'light') {
      classes.push('recumet-loader--light');
    } else if (this.theme === 'dark') {
      classes.push('recumet-loader--dark');
    }

    if (this.autoHide) {
      classes.push('recumet-loader--autohide');
    }

    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }
}
