import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Lightbulb } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import frasesData from '@/data/frases-motivacionais.json';
import logoBlue from '@/assets/calazans-rossi-logo-blue.png';

interface Frase {
  texto: string;
  autor: string;
}

const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 horas em milissegundos

export const WelcomeQuote = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Frase | null>(null);
  const { user } = useAuth();

  const getRandomQuote = (excludeId?: number): { quote: Frase; id: number } => {
    const frases: Frase[] = frasesData;
    let randomIndex: number;
    
    // Selecionar uma frase aleatória diferente da última
    do {
      randomIndex = Math.floor(Math.random() * frases.length);
    } while (excludeId !== undefined && randomIndex === excludeId && frases.length > 1);

    return { quote: frases[randomIndex], id: randomIndex };
  };

  const shouldUpdateQuote = (): boolean => {
    const lastUpdate = localStorage.getItem('quote_last_update');
    if (!lastUpdate) return true;

    const timeSinceUpdate = Date.now() - parseInt(lastUpdate);
    return timeSinceUpdate >= TWELVE_HOURS;
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
    if (user) {
      // Verificar se passou 12 horas ou se é um novo login
      const lastLoginTime = localStorage.getItem('last_login_time');
      const currentLoginTime = Date.now().toString();
      const isNewLogin = lastLoginTime !== currentLoginTime;

      if (shouldUpdateQuote() || isNewLogin) {
        const newQuote = updateQuote();
        setCurrentQuote(newQuote);
        setIsOpen(true);
        
        // Atualizar timestamp do login
        localStorage.setItem('last_login_time', currentLoginTime);
        
        // Fechar automaticamente após 9 segundos
        setTimeout(() => setIsOpen(false), 9000);
      } else {
        // Carregar frase atual
        const stored = localStorage.getItem('current_quote');
        if (stored) {
          setCurrentQuote(JSON.parse(stored));
        } else {
          updateQuote();
        }
      }
    }
  }, [user]);

  if (!currentQuote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[600px] border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-950 backdrop-blur-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
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
