import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { ValidatorsService } from 'src/app/services/validators.service';

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const authService = inject(AuthService);
  const validatorsService = inject(ValidatorsService);
  const router = inject(Router);
  validatorsService.loadingPage.set(true);
  return authService.refresh().pipe(
    map(isValid => {
      validatorsService.loadingPage.set(false);
      if(!isValid) {
        authService.logout();
        return router.parseUrl('/auth');
      }
      return true;
    })
  );  
};
