import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Lightbulb } from 'lucide-react';
import frasesData from '@/data/frases-motivacionais.json';

interface Frase {
  texto: string;
  autor: string;
}

export const WelcomeQuote = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Frase | null>(null);

  useEffect(() => {
    // Verificar se já mostrou a frase hoje
    const lastShown = localStorage.getItem('last_quote_shown');
    const today = new Date().toDateString();

    if (lastShown !== today) {
      // Obter a última frase exibida para evitar repetição
      const lastQuoteId = localStorage.getItem('last_quote_id');
      const frases: Frase[] = frasesData;
      
      // Selecionar uma frase aleatória diferente da última
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * frases.length);
      } while (lastQuoteId !== null && randomIndex === parseInt(lastQuoteId) && frases.length > 1);

      const selectedQuote = frases[randomIndex];
      setCurrentQuote(selectedQuote);
      setIsOpen(true);

      // Armazenar informações para evitar repetição
      localStorage.setItem('last_quote_shown', today);
      localStorage.setItem('last_quote_id', randomIndex.toString());
      localStorage.setItem('current_quote', JSON.stringify(selectedQuote));

      // Fechar automaticamente após 6 segundos
      setTimeout(() => setIsOpen(false), 6000);
    } else {
      // Carregar frase atual se já foi exibida hoje
      const stored = localStorage.getItem('current_quote');
      if (stored) {
        setCurrentQuote(JSON.parse(stored));
      }
    }
  }, []);

  if (!currentQuote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] border-0 shadow-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="relative py-8 px-6 text-center animate-fade-in">
          {/* Ícone de Inspiração */}
          <div className="flex justify-center mb-6 animate-scale-in">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-full shadow-lg">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Frase Principal */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-2xl md:text-3xl font-serif leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
              "{currentQuote.texto}"
            </p>

            {/* Autor */}
            <p className="text-lg italic text-gray-600 dark:text-gray-400 mt-4">
              — {currentQuote.autor}
            </p>
          </div>

          {/* Mensagem de Boas-Vindas */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">
              Bem-vindo ao Sistema CRA
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Excelência · Ética · Alta Performance
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
