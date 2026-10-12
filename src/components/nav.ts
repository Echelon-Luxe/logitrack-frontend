import {
  LayoutDashboard, Compass, Inbox, ShoppingCart, Users, Truck, UserCog, ScrollText, LifeBuoy, Settings, Navigation,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { Role } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
  roles?: readonly Role[];
  badge?: 'unread';
}

export const NAV_MAIN: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DISPATCHER', 'SUPPORT', 'CUSTOMER'] },
  { href: '/driver', label: 'My jobs', icon: Navigation, roles: ['DRIVER'] },
  { href: '/tracking', label: 'Tracking', icon: Compass },
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: 'unread' },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'DISPATCHER', 'SUPPORT'] },
  { href: '/drivers', label: 'Fleet', icon: Truck, roles: ['ADMIN', 'DISPATCHER', 'SUPPORT'] },
];

export const NAV_ADMIN: NavItem[] = [
  { href: '/admin/users', label: 'Users & roles', icon: UserCog, roles: ['ADMIN'] },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText, roles: ['ADMIN'] },
];

export const NAV_FOOTER: NavItem[] = [
  { href: '/help', label: 'Help & Support', icon: LifeBuoy },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const visibleFor = (items: NavItem[], role: Role) => items.filter((i) => !i.roles || i.roles.includes(role));
