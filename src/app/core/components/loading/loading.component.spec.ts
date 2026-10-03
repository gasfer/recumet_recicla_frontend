import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingComponent } from './loading.component';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoadingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the loading component with circular layout', () => {
    expect(component).toBeTruthy();
  });

  it('should apply fullscreen class when fullscreen input is true', () => {
    component.fullscreen = true;
    fixture.detectChanges();
    expect(component.containerClasses).toContain('recumet-loader--fullscreen');
  });

  it('should render the emblem image with correct path', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('.recumet-emblem-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('assets/recumet/recumet-emblem.png');
  });

  it('should display progress percentage correctly', () => {
    component.progressValue = 45;
    fixture.detectChanges();
    expect(component.progressPercentage()).toBe(45);
    expect(component.displayProgressText()).toBe('45%');
  });
});
