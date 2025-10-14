import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '404',
    loadComponent: () => import('./page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    }
  },
  {
    path: 'demos',
    loadComponent: () => import('./demo/demo.component').then(m => m.DemoComponent),
    data: {
      title: 'Demo Page'
    }
  },
  {
    path: 'subscriptions',
    loadComponent: () => import('./subscription/subscription.component').then(m => m.SuscripcionesComponent),
    data: {
      title: 'Subscriptions Page'
    }
  },
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages.component').then(m => m.MessagesComponent),
    data: {
      title: 'Messages Page'
    }
  },
  {
    path: 'leads',
    loadComponent: () => import('./leeds/leeds.component').then(m => m.LeadsComponent),
    data: {
      title: 'Leads Page'
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    data: {
      title: 'Register Page'
    }
  }
];
