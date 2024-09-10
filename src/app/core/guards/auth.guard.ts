import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { ValidatorsService } from 'src/app/services/validators.service';

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const authService = inject(AuthService);
  const validatorsService = inject(ValidatorsService);
  validatorsService.loadingPage.set(true);
  return authService.refresh().pipe(
    tap(isValid => {
      validatorsService.loadingPage.set(false);
      if(!isValid) {
        authService.logout();
      }
    })
  );  
};
