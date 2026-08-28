import { Route, Routes } from '@angular/router';
import { PermissionAction } from 'src/app/core/constants/application-navigation.constants';
import { ACCOUNT_ROUTES } from 'src/app/pages/accounts/accounts-routing.module';
import { ASSET_ROUTES } from 'src/app/pages/assets/assets-routing.module';
import { BALANZA_ROUTES } from 'src/app/pages/balanza/balanza-routing.module';
import { CAJA_ROUTES } from 'src/app/pages/caja/caja-routing.module';
import { CLASSIFIED_ROUTES } from 'src/app/pages/classifieds/classifieds-routing.module';
import { DASHBOARD_ROUTES } from 'src/app/pages/dashboard/dashboard-routing.module';
import { INPUT_ROUTES } from 'src/app/pages/inputs/inputs-routing.module';
import { INVENTORY_ROUTES } from 'src/app/pages/inventories/inventories-routing.module';
import { MANAGEMENT_ROUTES } from 'src/app/pages/managements/managements-routing.module';
import { OUTPUT_ROUTES } from 'src/app/pages/outputs/outputs-routing.module';
import { PROVIDER_WORKFLOW_ROUTES } from 'src/app/pages/providers/providers-routing.module';
import { TRANSFER_ROUTES } from 'src/app/pages/transfers/transfers-routing.module';
import { FeatureInDevelopmentComponent } from 'src/app/core/components/feature-in-development/feature-in-development.component';
import { BalanzaCamioneraComponent } from 'src/app/pages/balanza/balanza-camionera/balanza-camionera.component';
import { InputSmallComponent } from 'src/app/pages/inputs/input-small/input-small.component';
import { MenuItem } from './menu.model';
import { MENU } from './menu';

interface RegisteredRoute {
  fullPath: string;
  route: Route;
}

const routeGroups: Array<{ prefix: string; routes: Routes }> = [
  { prefix: '/dashboard', routes: DASHBOARD_ROUTES },
  { prefix: '/inputs', routes: INPUT_ROUTES },
  { prefix: '/providers', routes: PROVIDER_WORKFLOW_ROUTES },
  { prefix: '/classifieds', routes: CLASSIFIED_ROUTES },
  { prefix: '/scale', routes: BALANZA_ROUTES },
  { prefix: '/outputs', routes: OUTPUT_ROUTES },
  { prefix: '/transfers', routes: TRANSFER_ROUTES },
  { prefix: '/caja', routes: CAJA_ROUTES },
  { prefix: '/assets', routes: ASSET_ROUTES },
  { prefix: '/accounts', routes: ACCOUNT_ROUTES },
  { prefix: '/inventories', routes: INVENTORY_ROUTES },
  { prefix: '/managements', routes: MANAGEMENT_ROUTES },
];

const flattenMenu = (items: MenuItem[]): MenuItem[] =>
  items.flatMap((item) => [item, ...flattenMenu(item.subItems ?? [])]);

const registeredRoutes = (): RegisteredRoute[] =>
  routeGroups.flatMap(({ prefix, routes }) =>
    routes
      .filter((route) => route.path && route.path !== '**' && !route.redirectTo)
      .map((route) => ({ fullPath: `${prefix}/${route.path}`.replace(/\/+/g, '/'), route })),
  );

describe('Operational menu navigation contract', () => {
  const allMenuItems = flattenMenu(MENU);
  const menuLinks = allMenuItems.filter((item) => item.link);
  const routesByPath = new Map(registeredRoutes().map((entry) => [entry.fullPath, entry.route]));
  const allowedActions: PermissionAction[] = ['view', 'create', 'update', 'delete', 'reports'];

  it('assigns a unique identifier to every menu item', () => {
    const ids = allMenuItems.map((item) => item.id);

    expect(ids.every((id) => id !== undefined)).toBeTrue();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('registers every navigable menu link explicitly', () => {
    const missingLinks = menuLinks
      .map((item) => item.link as string)
      .filter((link) => !routesByPath.has(link));

    expect(missingLinks).withContext(`Rutas huérfanas: ${missingLinks.join(', ')}`).toEqual([]);
  });

  it('uses the same permission in the menu and its route metadata', () => {
    const mismatches = menuLinks.flatMap((item) => {
      if (!item.name || !item.action) return [];
      const route = routesByPath.get(item.link as string);
      return route?.data?.['name'] === item.name && route?.data?.['action'] === item.action
        ? []
        : [`${item.link}: menú=${item.name}/${item.action}, ruta=${route?.data?.['name']}/${route?.data?.['action']}`];
    });

    expect(mismatches).withContext(mismatches.join('\n')).toEqual([]);
  });

  it('only uses supported permission actions', () => {
    const invalid = menuLinks
      .filter((item) => item.action && !allowedActions.includes(item.action))
      .map((item) => `${item.link}:${item.action}`);

    expect(invalid).toEqual([]);
  });

  it('keeps conceptually different pending functions on different URLs', () => {
    const pendingPaths = [
      '/caja/expenses',
      '/caja/major-transfers',
      '/assets/inputs/purchase-request',
      '/assets/inputs/purchase-order',
      '/assets/inputs/purchase-management',
      '/assets/outputs/consumables',
      '/assets/outputs/tools',
      '/assets/outputs/output-management',
    ];

    expect(new Set(pendingPaths).size).toBe(pendingPaths.length);
    expect(pendingPaths.every((path) => routesByPath.has(path))).toBeTrue();
  });

  it('maps existing and pending destinations to the intended page type', () => {
    expect(routesByPath.get('/inputs/input-small')?.component).toBe(InputSmallComponent);
    expect(routesByPath.get('/scale/truck-scale/register')?.component).toBe(BalanzaCamioneraComponent);
    expect(routesByPath.get('/scale/drivers/register')?.component).toBe(FeatureInDevelopmentComponent);
    expect(routesByPath.get('/providers/accounts')?.component).toBe(FeatureInDevelopmentComponent);
  });
});
