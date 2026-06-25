import { redirect } from 'next/navigation';

interface AcceptInviteRedirectPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInviteRedirectPage({ searchParams }: AcceptInviteRedirectPageProps) {
  const params = await searchParams;
  const token = params.token;

  if (token) {
    redirect(`/accept-invite?token=${encodeURIComponent(token)}`);
  }

  redirect('/accept-invite');
}
