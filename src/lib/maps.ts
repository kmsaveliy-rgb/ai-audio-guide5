let mapsReady: Promise<typeof google.maps> | undefined;

export function loadMaps(): Promise<typeof google.maps> {
  if (mapsReady) return mapsReady;
  mapsReady = new Promise((resolve, reject) => {
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
    if (!key) return reject(new Error('Google Maps не подключён.'));
    const callback = '__audioGuideMapReady';
    const callbacks = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => {
      reject(new Error('Карта недоступна. Проверьте соединение; в Китае Google Maps может не работать.'));
    }, 20000);
    callbacks[callback] = () => {
      window.clearTimeout(timer);
      resolve(google.maps);
      delete callbacks[callback];
    };
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=${callback}&channel=${encodeURIComponent(import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'] ?? '')}&language=ru`;
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Не удалось загрузить карту. Проверьте соединение.'));
    };
    document.head.appendChild(script);
  });
  return mapsReady;
}