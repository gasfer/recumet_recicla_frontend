import { AsyncValidatorFn } from '@angular/forms';
import { of, timer } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { RegistryNumberApiService, RegistryOperation } from '../services/registry-number-api.service';

export interface RegistryNumberValidationContext {
  operation: RegistryOperation;
  branchId: number | null | undefined;
  typeRegistry: string | null | undefined;
  excludeId?: number | null;
  originalNumber?: string | null;
  originalBranchId?: number | null;
  originalTypeRegistry?: string | null;
}

export function registryNumberAvailabilityValidator(
  api: RegistryNumberApiService,
  getContext: () => RegistryNumberValidationContext,
): AsyncValidatorFn {
  return (control) => {
    const number = String(control.value ?? '').trim();
    if (!number) return of(null);

    const context = getContext();
    if (
      context.excludeId &&
      number === String(context.originalNumber ?? '').trim() &&
      Number(context.branchId) === Number(context.originalBranchId) &&
      context.typeRegistry === context.originalTypeRegistry
    ) {
      return of(null);
    }
    if (!context.branchId || !context.typeRegistry) {
      return of({ registryNumberCheckFailed: true });
    }

    return timer(350).pipe(
      switchMap(() => api.check({
        operation: context.operation,
        number,
        branchId: Number(context.branchId),
        typeRegistry: context.typeRegistry!,
        excludeId: context.excludeId,
      })),
      map((response) => response.exists ? { registryNumberTaken: true } : null),
      catchError(() => of({ registryNumberCheckFailed: true })),
      take(1),
    );
  };
}
