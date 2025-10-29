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
    <div className="flex items-center gap-2 animate-fade-in">
      <Flame className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
      <div className="flex flex-col md:flex-row md:items-center gap-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
          "{quote.texto}"
        </p>
        <span className="text-xs italic text-gray-600 dark:text-gray-400 flex-shrink-0">
          — {quote.autor}
        </span>
      </div>
    </div>
  );
};
