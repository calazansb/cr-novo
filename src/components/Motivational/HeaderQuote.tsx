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
    <div className="flex items-center gap-3 animate-fade-in group">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
        <Flame className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-1">
          "{quote.texto}"
        </p>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {quote.autor}
        </span>
      </div>
    </div>
  );
};
