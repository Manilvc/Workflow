import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'builder',
    pathMatch: 'full',
  },
  {
    path: 'builder',
    loadComponent: () =>
      import('./pages/workflow-builder/workflow-builder').then(m => m.WorkflowBuilder),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./pages/request-dashboard/request-dashboard').then(m => m.RequestDashboard),
  },
  {
    path: 'requests/:id',
    loadComponent: () =>
      import('./pages/request-execution/request-execution').then(m => m.RequestExecution),
  },
];
