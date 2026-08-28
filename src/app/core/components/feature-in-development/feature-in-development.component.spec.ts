import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FeatureInDevelopmentComponent } from './feature-in-development.component';

describe('FeatureInDevelopmentComponent', () => {
  let fixture: ComponentFixture<FeatureInDevelopmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeatureInDevelopmentComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ title: 'Registrar transportista' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureInDevelopmentComponent);
    fixture.detectChanges();
  });

  it('shows the route title and the development status', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Registrar transportista');
    expect(text).toContain('En proceso de desarrollo');
  });

  it('does not render business actions', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
  });
});
