import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { LocationMap } from '@/components/LocationMap';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/map')({
  head: () => ({ meta: [
    { title: 'Карта прогулки — Аудиогид' },
    { name: 'description', content: 'Ваше местоположение и отметки на карте прогулки.' },
    { property: 'og:title', content: 'Карта прогулки — Аудиогид' },
    { property: 'og:description', content: 'Местоположение во время прогулки с аудиогидом.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: MapPage,
});

function MapPage() {
  return <main className="mx-auto min-h-screen max-w-md space-y-5 px-5 pb-16 pt-8">
    <Button asChild variant="link" className="px-0 text-muted-foreground"><Link to="/"><ArrowLeft />Новая экскурсия</Link></Button>
    <h1 className="text-3xl font-semibold">Карта прогулки</h1>
    <LocationMap />
  </main>;
}