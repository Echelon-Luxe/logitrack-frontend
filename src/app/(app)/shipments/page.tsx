import { redirect } from 'next/navigation';

// The list moved to /orders; keep old links working.
export default function ShipmentsIndex() {
  redirect('/orders');
}
