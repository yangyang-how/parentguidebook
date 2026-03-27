// functions/api/logout.ts
// Clears the session cookie and redirects to home

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const redirect = url.searchParams.get('redirect') || '/';
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirect,
      'Set-Cookie': 'pgb_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
};
