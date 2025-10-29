import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import frasesData from '@/data/frases-motivacionais.json';

interface Frase {
  texto: string;
  autor: string;
}

export const HeaderQuote = () => {
  const [quote, setQuote] = useState<Frase | null>(null);

  useEffect(() => {
    // Atualizar a frase quando o localStorage mudar
    const updateQuote = () => {
      const stored = localStorage.getItem('current_quote');
      if (stored) {
        setQuote(JSON.parse(stored));
      } else {
        // Se não houver frase armazenada, selecionar uma aleatória
        const frases: Frase[] = frasesData;
        const randomIndex = Math.floor(Math.random() * frases.length);
        const selectedQuote = frases[randomIndex];
        setQuote(selectedQuote);
        localStorage.setItem('current_quote', JSON.stringify(selectedQuote));
      }
    };

    updateQuote();

    // Listener para mudanças no localStorage (atualiza quando WelcomeQuote mudar a frase)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_quote') {
        updateQuote();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também verificar periodicamente (a cada 30 segundos) se a frase mudou
    const interval = setInterval(updateQuote, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!quote) return null;

  return (
    <div 
      className="relative w-72 h-32 rounded-2xl overflow-hidden mx-auto animate-fade-in group"
      style={{
        background: '#29292c',
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
      }}
    >
      {/* Inner border */}
      <div 
        className="absolute inset-[1px] rounded-[15px] z-[2]"
        style={{ background: '#18181b' }}
      />
      
      {/* Left accent bar */}
      <div 
        className="absolute left-2 top-[0.65rem] bottom-[0.65rem] w-1 rounded-sm z-[4] transition-transform duration-300 group-hover:translate-x-[0.15rem]"
        style={{
          background: 'linear-gradient(to bottom, #2eadff, #3d83ff, #7e61ff)'
        }}
      />

      {/* Border glow */}
      <div 
        className="absolute w-80 h-80 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-[1] pointer-events-none"
        style={{
          left: 'var(--mouse-x, 50%)',
          top: 'var(--mouse-y, 50%)',
          background: 'radial-gradient(circle closest-side at center, white, transparent)'
        }}
      />

      {/* Content glow */}
      <div 
        className="absolute w-80 h-80 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-[3] pointer-events-none"
        style={{
          left: 'var(--mouse-x, 50%)',
          top: 'var(--mouse-y, 50%)',
          background: 'radial-gradient(circle closest-side at center, white, transparent)'
        }}
      />

      {/* Content */}
      <div className="relative z-[5] h-full flex flex-col p-4">
        {/* Title with icon */}
        <div className="flex items-center gap-2 mb-2 transition-transform duration-300 group-hover:translate-x-[0.15rem]">
          <Flame className="w-4 h-4" style={{ color: '#32a6ff' }} />
          <h3 className="font-medium text-lg" style={{ color: '#32a6ff' }}>
            Inspiração
          </h3>
        </div>
        
        {/* Quote text */}
        <div className="flex-1 transition-transform duration-300 group-hover:translate-x-1">
          <p className="text-sm leading-snug mb-1" style={{ color: '#99999d' }}>
            "{quote.texto}"
          </p>
          <span className="text-xs italic" style={{ color: '#99999d' }}>
            — {quote.autor}
          </span>
        </div>
      </div>
    </div>
  );
};
