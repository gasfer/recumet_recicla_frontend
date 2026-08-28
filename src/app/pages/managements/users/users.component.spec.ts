import { UsersComponent } from './users.component';
import { User } from '../interfaces/user.interface';

describe('UsersComponent role administration', () => {
  const createComponent = (role: string): UsersComponent => {
    const component = Object.create(UsersComponent.prototype) as UsersComponent;
    component.validatorsService = { user: () => ({ role }) } as any;
    return component;
  };

  const userWithRole = (role: string): User => ({ role } as User);

  it('enables assignment actions for an administrator managing an operator or encargado', () => {
    const component = createComponent('ADMINISTRADOR');

    expect(component.canManageAssignedUser(userWithRole('OPERADOR'))).toBeTrue();
    expect(component.canManageAssignedUser(userWithRole('ENCARGADO'))).toBeTrue();
  });

  it('does not enable assignment actions for administrator targets or non-administrators', () => {
    expect(createComponent('ADMINISTRADOR').canManageAssignedUser(userWithRole('ADMINISTRADOR'))).toBeFalse();
    expect(createComponent('ENCARGADO').canManageAssignedUser(userWithRole('OPERADOR'))).toBeFalse();
  });
});
