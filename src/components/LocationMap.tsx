import { useEffect, useRef, useState } from 'react';
import { Loader2, LocateFixed, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadMaps } from '@/lib/maps';

export function LocationMap() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const locationMarker = useRef<google.maps.Marker | null>(null);
  const accuracyCircle = useRef<google.maps.Circle | null>(null);
  const pins = useRef<google.maps.Marker[]>([]);
  const watch = useRef<number | null>(null);
  const position = useRef<google.maps.LatLngLiteral | null>(null);
  const centerNext = useRef(false);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [pinCount, setPinCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let listener: google.maps.MapsEventListener | undefined;
    loadMaps().then((sdk) => {
      if (cancelled || !container.current) return;
      map.current = new sdk.Map(container.current, {
        center: { lat: 20, lng: 0 }, zoom: 2, clickableIcons: false,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        gestureHandling: 'cooperative',
      });
      listener = map.current.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng || !map.current) return;
        const number = pins.current.length + 1;
        const marker = new sdk.Marker({ map: map.current, position: event.latLng, label: String(number), title: `Метка ${number}` });
        pins.current.push(marker);
        setPinCount(number);
      });
      setReady(true);
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Карта недоступна.');
    });
    return () => {
      cancelled = true;
      listener?.remove();
      if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
      locationMarker.current?.setMap(null);
      accuracyCircle.current?.setMap(null);
      pins.current.forEach((pin) => pin.setMap(null));
      map.current = null;
    };
  }, []);

  function locate() {
    if (!map.current) return;
    setError(null);
    if (position.current) {
      map.current.panTo(position.current);
      map.current.setZoom(16);
      return;
    }
    if (!navigator.geolocation) {
      setError('Этот браузер не поддерживает определение местоположения.');
      return;
    }
    if (watch.current !== null) return;
    centerNext.current = true;
    setLocating(true);
    watch.current = navigator.geolocation.watchPosition((result) => {
      if (!map.current) return;
      const point = { lat: result.coords.latitude, lng: result.coords.longitude };
      position.current = point;
      setLocating(false);
      setError(null);
      setAccuracy(Math.round(result.coords.accuracy));
      if (!locationMarker.current) {
        locationMarker.current = new google.maps.Marker({ map: map.current, title: 'Вы здесь', label: 'Я', position: point });
        accuracyCircle.current = new google.maps.Circle({ map: map.current, clickable: false, strokeOpacity: 0.4, fillOpacity: 0.1 });
      }
      locationMarker.current.setPosition(point);
      accuracyCircle.current?.setCenter(point);
      accuracyCircle.current?.setRadius(result.coords.accuracy);
      if (centerNext.current) {
        map.current.panTo(point);
        map.current.setZoom(16);
        centerNext.current = false;
      }
    }, (failure) => {
      setLocating(false);
      setError(failure.code === 1 ? 'Разрешите доступ к местоположению в настройках браузера.' : failure.code === 3 ? 'Не удалось определить местоположение вовремя. Попробуйте ещё раз.' : 'Местоположение недоступно. Включите геолокацию на телефоне.');
      if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  }

  return (
    <section className="space-y-3" aria-label="Карта местоположения">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><MapPin className="h-5 w-5 text-primary" />Карта</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Удалить метки" title="Удалить метки" disabled={!pinCount} onClick={() => {
            pins.current.forEach((pin) => pin.setMap(null));
            pins.current = [];
            setPinCount(0);
          }}><Trash2 /></Button>
          <Button type="button" size="icon" aria-label="Моё местоположение" title="Моё местоположение" disabled={!ready || locating} onClick={locate}>
            {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          </Button>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg border bg-muted">
        <div ref={container} className="h-[360px] w-full" aria-label="Google Maps" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
          {error ? 'Карта недоступна' : <><Loader2 className="h-5 w-5 animate-spin" />Загрузка карты…</>}
        </div>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {locating ? 'Определяем местоположение…' : accuracy !== null ? `Вы здесь · точность ±${accuracy} м` : 'Местоположение не определено'}
        {pinCount > 0 && ` · Меток: ${pinCount}`}
      </p>
    </section>
  );
}