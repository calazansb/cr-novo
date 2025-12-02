import { useState, useEffect } from 'react';
import { Quote, Sparkles } from 'lucide-react';
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
    <div className="flex items-center gap-3 animate-fade-in">
      {/* Quote Icon */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center border border-primary/20">
          <Quote className="w-5 h-5 text-primary" />
        </div>
        <Sparkles className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
      </div>
      
      {/* Quote Text */}
      <div className="flex flex-col min-w-0 gap-0.5">
        <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug line-clamp-1 font-medium italic">
          "{quote.texto}"
        </p>
        <div className="flex items-center gap-2">
          <div className="w-4 h-px bg-gradient-to-r from-primary/50 to-transparent" />
          <span className="text-xs font-semibold text-primary/80 dark:text-primary/70 uppercase tracking-wide">
            {quote.autor}
          </span>
        </div>
      </div>
    </div>
  );
};
