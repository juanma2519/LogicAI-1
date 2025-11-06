import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayoutComponent),
    canActivate: [AuthGuard],   // ⬅️ protección
    data: { title: 'Home' },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then(m => m.routes)
      },
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes)
      },
      {
        path: 'demos',
        loadComponent: () => import('./views/pages/demo/demo.component').then(m => m.DemoComponent),
        data: { title: 'Demo Page' }
      },
      {
        path: 'leads',
        loadComponent: () => import('./views/pages/leeds/leeds.component').then(m => m.LeadsComponent),
        data: { title: 'Leads Page' }
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./views/pages/subscription/subscription.component').then(m => m.SuscripcionesComponent),
        data: { title: 'Subscriptions Page' }
      },
      {
        path: 'messages',
        loadComponent: () => import('./views/pages/messages/messages.component').then(m => m.MessagesComponent),
        data: { title: 'Messages Page' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./views/pages/profile/profile.component').then(m => m.ProfileComponent),
        data: { title: 'Profile Page' }
      },
      {
        path: 'agents',
        loadComponent: () => import('./views/pages/agents/agents.component').then(m => m.AgentsComponent),
        data: { title: 'ElevenLabs Agents' }
      },
      {
      path: 'settings',
        loadComponent: () => import('./views/pages/settings/settings.component').then(m => m.SettingsComponent),
        data: { title: 'Settings' }
    },
    {
      path: 'pricing',
      loadComponent: () => import('./views/pages/pricing/pricing.component').then(m => m.PricingPageComponent),
      data: { title: 'Pricing' }
    },
    {
      path: 'puppeter',
      loadComponent: () => import('./views/pages/audit-seo/audit-seo.component').then(m => m.AuditSeoComponent),
      data: { title: 'Pricing' }
    }
    ]
  },
  {
    path: 'email-marketing/:id',
    loadComponent: () => import('./views/pages/email-marketing/email-marketing.component').then(m => m.EmailMarketingComponent),
    data: { title: 'Email Marketing - Análisis' }
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: { title: 'Page 404' }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: { title: 'Page 500' }
  },
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: { title: 'Login Page' }
  },
  {
    path: 'register',
    loadComponent: () => import('./views/pages/register/register.component').then(m => m.RegisterComponent),
    data: { title: 'Register Page' }
  },
    {
    path: '',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: { title: 'Login Page' }
  },
  { path: '**', redirectTo: 'login' }
];