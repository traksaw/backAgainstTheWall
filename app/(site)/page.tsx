// app/(site)/page.tsx  (server component)
import { serverClient } from '@/sanity/serverClient';

export default async function Page() {
  const content = await serverClient.fetch(
    `*[_type == "page" && slug.current == "home"][0]{title, body}`
  );
  return <Home content={content} />; // Home can be a client component
}
