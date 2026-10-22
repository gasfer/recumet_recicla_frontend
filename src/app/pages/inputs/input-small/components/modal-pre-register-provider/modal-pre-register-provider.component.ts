import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription, catchError, distinctUntilChanged, map, of, switchMap, timer } from 'rxjs';
import { InputsService } from '../../../services/inputs.service';
import { ProvidersService } from '../../../services/providers.service';
import { Provider } from '../../../interfaces/provider.interface';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-modal-pre-register-provider',
  templateUrl: './modal-pre-register-provider.component.html',
})
export class ModalPreRegisterProviderComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private providersService = inject(ProvidersService);
  private inputsService = inject(InputsService);
  private validatorsService = inject(ValidatorsService);
  loading = signal(false);
  checkingDuplicate = signal(false);
  duplicate = signal<Provider | undefined>(undefined);
  private duplicateSubscription?: Subscription;

  form = this.fb.group({
    full_names: ['', [Validators.required, Validators.maxLength(174)]],
    number_document: ['', [Validators.maxLength(80)]],
    cellphone: ['', [Validators.maxLength(30)]],
  });

  ngOnInit() {
    this.duplicateSubscription = this.form.valueChanges.pipe(
      map(value => ({
        number_document: String(value.number_document || '').trim(),
        cellphone: String(value.cellphone || '').trim(),
      })),
      distinctUntilChanged((previous, current) => previous.number_document === current.number_document && previous.cellphone === current.cellphone),
      switchMap((value) => {
        if (!value.number_document && !value.cellphone) {
          this.checkingDuplicate.set(false);
          this.duplicate.set(undefined);
          return of({ provider: undefined });
        }

        this.checkingDuplicate.set(true);
        this.duplicate.set(undefined);
        return timer(350).pipe(
          switchMap(() => this.providersService.checkDuplicate(value.number_document || undefined, value.cellphone || undefined)),
          catchError(() => of({ provider: undefined })),
        );
      }),
    ).subscribe((response) => {
      this.duplicate.set(response.provider);
      this.checkingDuplicate.set(false);
    });
  }

  ngOnDestroy() {
    this.duplicateSubscription?.unsubscribe();
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.duplicate() || this.checkingDuplicate()) return;
    this.loading.set(true);
    this.providersService.preRegister({
      ...this.form.getRawValue(),
      id_sucursal: this.validatorsService.id_sucursal(),
    }).subscribe({
      next: ({ provider }) => {
        this.inputsService.providerSelect.set(provider);
        this.providersService.showPreRegisterModal = false;
        this.reset();
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  selectDuplicate() {
    const provider = this.duplicate();
    if (!provider) return;
    this.inputsService.providerSelect.set(provider);
    this.providersService.showPreRegisterModal = false;
    this.reset();
  }

  reset() {
    this.form.reset();
    this.duplicate.set(undefined);
  }

  get visible() {
    return this.providersService.showPreRegisterModal;
  }

  set visible(value: boolean) {
    this.providersService.showPreRegisterModal = value;
    if (!value) this.reset();
  }
}
