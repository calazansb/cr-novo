import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

const LocationCard = () => {
  const [location, setLocation] = useState<string>('Carregando...');
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Get current time
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 60000); // Update every minute

    // Get location
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

  return (
    <div className="fixed bottom-6 right-6 z-20 w-[342px] h-[184px] rounded-2xl overflow-hidden shadow-2xl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#5936B4] to-[#362A84]" />
      
      {/* Cloud decoration */}
      <div className="absolute right-0 top-0 opacity-20">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M90 60C90 44 77 31 61 31C50 31 40 37 35 46C32 45 29 44 26 44C14 44 4 54 4 66C4 78 14 88 26 88H86C100 88 111 77 111 63C111 50 101 39 88 39C89 46 90 53 90 60Z" fill="white"/>
        </svg>
      </div>

      {/* Content */}
      <div className="relative h-full p-5 flex flex-col justify-between text-white">
        <div className="main-text text-5xl font-bold z-10">
          {time}
        </div>
        
        <div className="info flex justify-between items-end">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white/60" />
            <span className="text-white/60">{location}</span>
          </div>
          <div className="info-right text-white/60">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'short', 
              day: 'numeric',
              month: 'short'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;
