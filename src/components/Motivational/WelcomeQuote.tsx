import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Lightbulb } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import frasesData from '@/data/frases-motivacionais.json';
import logoBlue from '@/assets/calazans-rossi-logo-blue.png';

interface Frase {
  texto: string;
  autor: string;
}

const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 horas em milissegundos

export const WelcomeQuote = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Frase | null>(null);
  const { user } = useAuth();
  const hasShownOnLogin = useRef(false);

  const getRandomQuote = (excludeId?: number): { quote: Frase; id: number } => {
    const frases: Frase[] = frasesData;
    let randomIndex: number;
    
    // Selecionar uma frase aleatória diferente da última
    do {
      randomIndex = Math.floor(Math.random() * frases.length);
    } while (excludeId !== undefined && randomIndex === excludeId && frases.length > 1);

    return { quote: frases[randomIndex], id: randomIndex };
  };

  const shouldShowQuote = (): boolean => {
    const lastShown = localStorage.getItem('quote_last_shown');
    if (!lastShown) return true;

    const timeSinceLastShown = Date.now() - parseInt(lastShown);
    return timeSinceLastShown >= SIX_HOURS;
  };

  const updateQuote = () => {
    const lastQuoteId = localStorage.getItem('last_quote_id');
    const excludeId = lastQuoteId ? parseInt(lastQuoteId) : undefined;
    
    const { quote, id } = getRandomQuote(excludeId);
    
    setCurrentQuote(quote);
    localStorage.setItem('current_quote', JSON.stringify(quote));
    localStorage.setItem('last_quote_id', id.toString());
    localStorage.setItem('quote_last_update', Date.now().toString());
    
    return quote;
  };

  useEffect(() => {
    // Detectar login: user passou de null para não-null
    if (user && !hasShownOnLogin.current) {
      hasShownOnLogin.current = true;
      
      // Verificar se deve mostrar (novo login ou passou 6 horas)
      if (shouldShowQuote()) {
        const newQuote = updateQuote();
        setCurrentQuote(newQuote);
        setIsOpen(true);
        
        // Atualizar timestamp da última exibição
        localStorage.setItem('quote_last_shown', Date.now().toString());
        
        // Fechar automaticamente após 9 segundos
        setTimeout(() => setIsOpen(false), 9000);
      } else {
        // Carregar frase atual sem mostrar
        const stored = localStorage.getItem('current_quote');
        if (stored) {
          setCurrentQuote(JSON.parse(stored));
        } else {
          updateQuote();
        }
      }
    }
    
    // Resetar flag quando user fizer logout
    if (!user) {
      hasShownOnLogin.current = false;
    }
  }, [user]);

  if (!currentQuote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="sm:max-w-[600px] border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-950 backdrop-blur-xl"
      >
        <div className="relative py-8 px-6 text-center animate-fade-in">
          {/* Ícone de Inspiração */}
          <div className="flex justify-center mb-6 animate-scale-in">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 p-4 rounded-full shadow-glow border border-blue-500/30">
              <Lightbulb className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_currentColor]" />
            </div>
          </div>

          {/* Frase Principal */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-2xl md:text-3xl font-serif leading-relaxed text-slate-100 font-medium">
              "{currentQuote.texto}"
            </p>

            {/* Autor */}
            <p className="text-lg italic text-slate-300 mt-4">
              — {currentQuote.autor}
            </p>
          </div>

          {/* Mensagem de Boas-Vindas com Logo */}
          <div className="mt-8 pt-6 border-t border-slate-700/30 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-xl font-semibold text-slate-300 tracking-wide uppercase mb-4">
              Bem-Vindo(a) ao Sistema do
            </p>
            <img 
              src={logoBlue} 
              alt="Calazans Rossi Advogados" 
              className="h-16 w-auto object-contain mx-auto filter brightness-0 invert opacity-90"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
