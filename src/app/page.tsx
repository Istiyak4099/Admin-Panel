import { redirect } from 'next/navigation';

export default function HomePage() {
  // The root page of the application should always redirect to the login page.
  redirect('/login');
}
