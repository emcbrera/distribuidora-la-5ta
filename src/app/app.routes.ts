import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'despachos/registro' },
  {
    path: 'despachos/registro',
    title: 'Registro de despacho | La Quinta',
    loadComponent: () =>
      import('./features/dispatches/pages/dispatch-registration/dispatch-registration').then(
        (m) => m.DispatchRegistration,
      ),
  },
  {
    path: 'movimientos',
    title: 'Historial de movimientos | La Quinta',
    loadComponent: () =>
      import('./features/movements/pages/movement-history/movement-history').then(
        (m) => m.MovementHistory,
      ),
  },
  { path: '**', redirectTo: 'despachos/registro' },
];
