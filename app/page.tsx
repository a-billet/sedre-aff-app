import PageClient from '@/app/page-client';
import { loadCriteres } from '@/lib/supabase/load-criteres';

export default async function Page() {
  const criteres = await loadCriteres();

  return <PageClient criteres={criteres} />;
}
