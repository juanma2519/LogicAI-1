import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: 'NEW'
    }
  },
  {
    title: true,
    name: 'Tools'
  },
  {
    name: 'Lira',
    url: '/agents',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-list' }
  },
  {
    name: 'Puppeter',
    url: '/puppeter',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-list' }
  },
  {
    name: 'Leads',
    url: '/leads',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-list' }
  },
  /*{
    name: 'Demos',
    url: '/demos',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-chart' }
  },
  {
    name: 'Messages',
    url: '/messages',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cilEnvelopeOpen' },
    badge: {
      color: 'success',
      text: '10'
    }
  },*/
  {
    title: true,
    name: 'Configuration'
  },
  /*{
    name: 'Pricing',
    url: '/pricing',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'icons.cilEuro' }
  },*/
  {
    name: 'Subscription',
    url: '/subscriptions',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cilCreditCard' },
    badge: {
      color: 'dark',
      text: 'PRO'
    }
  },
  {
    name: 'Profile',
    url: '/profile',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cilUser' }
  },
  /*{
    name: 'Settings',
    url: '/settings',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cilSettings' }
  },*/
];
