import { useEffect, useState } from 'react';
import { MapPin, Cloud } from 'lucide-react';

const LocationCard = () => {
  const [location, setLocation] = useState<string>('Carregando...');
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || 'Localização desconhecida';
            const state = data.address?.state || '';
            setLocation(`${city}, ${state}`);
          } catch (error) {
            setLocation('Brasil');
          }
        },
        () => {
          setLocation('Brasil');
        }
      );
    } else {
      setLocation('Brasil');
    }

    return () => clearInterval(timeInterval);
  }, []);

  const formatDate = () => {
    return new Date().toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    }).replace('.', '');
  };

  return (
    <div className="fixed top-6 right-6 z-20">
      <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-xl border border-border/50 p-6 min-w-[280px]">
        {/* Top row: Time + Cloud */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-5xl font-bold tracking-tight text-foreground tabular-nums">
            {time}
          </span>
          <Cloud className="w-14 h-14 text-muted-foreground/40 -mt-1" strokeWidth={1.5} />
        </div>
        
        {/* Bottom row: Location + Date */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">
              {location}
            </span>
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;
