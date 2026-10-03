import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

export type RecumetLoaderSize = 'xs' | 'sm' | 'md' | 'lg';
export type RecumetLoaderTheme = 'auto' | 'light' | 'dark';

let uniqueLoaderInstanceId = 0;

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private instanceId = ++uniqueLoaderInstanceId;

  readonly reverseGradientId = `recumet-rev-grad-${this.instanceId}`;
  readonly primaryGradientId = `recumet-prim-grad-${this.instanceId}`;

  @Input() size: RecumetLoaderSize = 'md';
  @Input() fullscreen: boolean = false;
  @Input() inline: boolean = true;
  @Input() theme: RecumetLoaderTheme = 'light';
  @Input() text: string = '';
  @Input() showText: boolean = true;
  @Input() showLine: boolean = true;
  @Input() autoHide: boolean = false;
  @Input() customClass: string = '';

  /** Permite inyectar un progreso real del 0 al 100 si se desea */
  @Input() set progressValue(val: number | null) {
    if (val !== null && val !== undefined) {
      this.isManualProgress = true;
      this.currentProgress.set(Math.min(100, Math.max(0, val)));
    }
  }

  private isManualProgress = false;
  currentProgress = signal<number>(0);

  progressPercentage = computed(() => Math.floor(this.currentProgress()));

  displayProgressText = computed(() => {
    if (this.text && !this.showText) return '';
    return `${this.progressPercentage()}%`;
  });

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

    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }

  ngOnInit(): void {
    if (!this.isManualProgress) {
      this.startSimulatedProgress();
    }
  }

  private startSimulatedProgress(): void {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let destroyed = false;

    this.destroyRef.onDestroy(() => {
      destroyed = true;
      if (timerId) clearTimeout(timerId);
    });

    const step = () => {
      if (destroyed || this.isManualProgress) return;

      const progress = this.currentProgress();
      if (progress < 98) {
        let increment: number;
        if (progress < 30) {
          increment = Math.random() * 6 + 4;
        } else if (progress < 70) {
          increment = Math.random() * 3 + 1.5;
        } else if (progress < 90) {
          increment = Math.random() * 1.2 + 0.5;
        } else {
          increment = Math.random() * 0.25 + 0.05;
        }

        const nextVal = Math.min(98, progress + increment);
        this.currentProgress.set(nextVal);

        const delay = progress < 70 ? Math.random() * 60 + 40 : Math.random() * 120 + 80;
        timerId = setTimeout(step, delay);
      }
    };

    timerId = setTimeout(step, 80);
  }
}

