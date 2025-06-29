import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the new login chooser page instead of the dashboard
  redirect('/login');
}
