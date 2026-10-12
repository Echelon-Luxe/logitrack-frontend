import { redirect } from 'next/navigation';

// Operations moved to /drivers (fleet & dispatch).
export default function AdminIndex() {
  redirect('/drivers');
}
