import { redirect } from 'next/navigation';

export default function LegacyUserRedirect({ params }: { params: { userId: string } }) {
  // Redirect any hits on the legacy path to the dashboard version
  redirect(`/dashboard/users/${params.userId}`);
}