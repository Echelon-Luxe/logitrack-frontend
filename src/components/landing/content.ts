import {
  BellRing, CreditCard, Files, Headset, MapPinned, PhoneCall, Route, ShieldCheck, Truck, UserRound, Users, Wallet,
} from 'lucide-react';

// Landing page copy, kept apart from the layout so it can be edited in one place.

export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#roles', label: 'Roles' },
  { href: '#faq', label: 'FAQ' },
];

// Tilted status chips floating over the hero, like chat bubbles.
export const HERO_CHIPS = [
  { label: 'Picked up · Ikeja', tone: 'bg-lp-chip', dot: 'bg-lp-violet', tilt: '-rotate-2' },
  { label: 'In transit · 32 km/h', tone: 'bg-lp-cream', dot: 'bg-lp-orange', tilt: 'rotate-1' },
  { label: 'Out for delivery', tone: 'bg-lp-mint', dot: 'bg-lp-teal', tilt: 'rotate-2' },
  { label: 'Delivered ✓', tone: 'bg-lp-lavender', dot: 'bg-lp-violet-deep', tilt: '-rotate-2' },
];

export const SECTORS = ['E-commerce', 'Pharmacy', 'Food', 'Retail', 'Documents'];

export const PROBLEMS = [
  { icon: PhoneCall, tint: 'bg-lp-violet', title: '“Where is my parcel?”', body: 'Customers call because they can’t see anything. Your team spends the day relaying updates by hand.' },
  { icon: Truck, tint: 'bg-lp-orange', title: 'Idle or double-booked drivers', body: 'Without one view of who is free, jobs sit waiting while drivers wait for jobs.' },
  { icon: Wallet, tint: 'bg-lp-teal', title: 'Payments chased by hand', body: 'Transfers get matched to deliveries in spreadsheets, and some never get matched at all.' },
  { icon: Files, tint: 'bg-lp-coral', title: 'Records in five places', body: 'WhatsApp threads, notebooks and spreadsheets. When something goes wrong, nobody can say what happened.' },
];

export const FEATURES = [
  { icon: MapPinned, title: 'Live map tracking', body: 'Drivers’ phones report their position every few seconds, so every active shipment moves on the map in real time.' },
  { icon: Route, title: 'Dispatch in one place', body: 'Approve new drivers, see who is online and assign each job to the right person.' },
  { icon: CreditCard, title: 'Paystack payments', body: 'Customers pay from their shipment page. Each payment is tied to its delivery automatically.' },
  { icon: BellRing, title: 'Automatic updates', body: 'Every status change reaches the customer by email and in their LogiTrack inbox. Nobody has to send it.' },
  { icon: ShieldCheck, title: 'Roles and audit log', body: 'Each person sees only what their role allows, and every change by an admin is recorded.' },
];

export const STEPS = [
  { n: '01', title: 'Book a shipment', body: 'Enter the pickup and drop-off. LogiTrack works out the distance and quotes the price straight away.' },
  { n: '02', title: 'Assign a driver', body: 'Dispatch picks an available, approved driver. The driver sees the job on their phone immediately.' },
  { n: '03', title: 'Track to the doorstep', body: 'Everyone follows the parcel live, from pickup to delivery, with every step recorded.' },
];

export const ROLES = [
  { icon: UserRound, title: 'Customers', body: 'Book, pay and watch their parcels arrive.', tint: 'bg-lp-lavender text-lp-violet-deep' },
  { icon: Truck, title: 'Drivers', body: 'Get jobs, share location, see earnings.', tint: 'bg-lp-cream text-lp-orange' },
  { icon: Headset, title: 'Dispatch & support', body: 'Assign jobs and answer customers with the full picture.', tint: 'bg-lp-mint text-lp-teal' },
  { icon: Users, title: 'Admins', body: 'Manage people, roles and the audit trail.', tint: 'bg-lp-peach text-lp-coral' },
];

export const FAQS = [
  { q: 'Who can create an account?', a: 'Customers and drivers can sign up themselves from the login page. Dispatchers, support staff and admins are added by an administrator.' },
  { q: 'How are new drivers approved?', a: 'A new driver’s profile waits in the dispatch queue until a dispatcher approves it. Only approved drivers can be assigned jobs.' },
  { q: 'How live is the tracking?', a: 'While a job is active, the driver’s phone sends its location every few seconds. Customers and dispatch see the vehicle move along the route as it happens.' },
  { q: 'How do customers pay?', a: 'Through Paystack, from the shipment page. The payment is recorded against that shipment, so there is nothing to reconcile by hand.' },
  { q: 'Will customers know when their parcel moves?', a: 'Yes. Each status change, from pickup through to delivery, is sent by email and also appears in their in-app inbox.' },
  { q: 'I forgot my password. What now?', a: 'Ask your LogiTrack administrator to reset it. They’ll give you a temporary password, which you can change in Settings.' },
];
