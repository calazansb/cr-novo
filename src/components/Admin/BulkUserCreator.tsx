import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const USERS_LIST = [
  { nome: "Aline Martins", email: "aline@calazansrossi.com.br" },
  { nome: "Camila Ribeiro Gomes", email: "milaribeirog@hotmail.com" },
  { nome: "Tainá Dias", email: "taina@calazansrossi.com.br" },
  { nome: "Fernanda Batista", email: "fernandabatista@calazansrossi.com.br" },
  { nome: "Victor Casadei", email: "victor@calazansrossi.com.br" },
  { nome: "Stefânia Maciel", email: "stefania@calazansrossi.com.br" },
  { nome: "Ana Luiza Anunciação", email: "analuiza@calazansrossi.com.br" },
  { nome: "Lailyane Oliveira", email: "lailyane@calazansrossi.com.br" },
  { nome: "Ramon Menezes", email: "ramon@calazansrossi.com.br" },
  { nome: "Flávio Quaresma", email: "flaviopedraq@outlook.com.br" },
  { nome: "Gabriela Silva", email: "gabrielamattarelli@gmail.com" },
  { nome: "Camirah Valentim", email: "camirah@calazansrossi.com.br" },
  { nome: "Brenda Carvalho", email: "becarvalho123@icloud.com" },
  { nome: "Bruna Aníbal", email: "bruna@calazansrossi.com.br" },
  { nome: "Odônio Amaral", email: "odonio@calazansrossi.com.br" },
  { nome: "Gustavo Vaz", email: "gustavo@calazansrossi.com.br" },
  { nome: "Amanda Paiva", email: "amanda@calazansrossi.com.br" },
  { nome: "Marcos Medeiros", email: "marcos@calazansrossi.com.br" },
  { nome: "Sheila Soares", email: "sheila@calazansrossi.com.br" },
  { nome: "Laís Santos", email: "lais@calazansrossi.com.br" },
  { nome: "Fernanda Ribeiro", email: "fernandaribeiro@calazansrossi.com.br" },
  { nome: "Fábia Madureira", email: "fabia@calazansrossi.com.br" },
  { nome: "Valquíria Cateringer", email: "valquiria@calazansrossi.com.br" },
  { nome: "Tatiana Andrade", email: "tatiana@calazansrossi.com.br" },
  { nome: "Maria Eduarda Oliveira", email: "mariaeduarda@calazansrossi.com.br" },
  { nome: "Fernanda Coutinho", email: "fernanda@calazansrossi.com.br" },
  { nome: "Natália Bicalho", email: "natalia@calazansrossi.com.br" },
  { nome: "Anna Gabriela Ribeiro", email: "annagabriela@calazansrossi.com.br" },
  { nome: "Júlia Coelho", email: "juliacoelho@calazansrossi.com.br" },
  { nome: "Ana Júlia Fernandes", email: "anajulia@calazansrossi.com.br" },
  { nome: "Débora Benet", email: "deborahbenet@gmail.com" },
  { nome: "Larissa Drumond", email: "larissa@calazansrossi.com.br" },
  { nome: "Isaque Pereira", email: "isaque@calazansrossi.com.br" },
  { nome: "Célia Silva", email: "celia@calazansrossi.com.br" },
  { nome: "Rayssa Rodrigues", email: "rayssa@calazansrossi.com.br" },
  { nome: "Luana Fróis", email: "luana@calazansrossi.com.br" },
  { nome: "Joana Tozzo", email: "joanatozzo@calazansrossi.com.br" },
  { nome: "Eugênio Calazans", email: "eugenio@calazansrossi.com.br" },
  { nome: "Vinícius Cruz", email: "vinicius@calazansrossi.com.br" },
  { nome: "Bruna Silva", email: "bruna@calazansrossi.com.br" },
  { nome: "Raiana Fauro", email: "raiana@calazansrossi.com.br" },
  { nome: "Vitória Faria", email: "vitoria@calazansrossi.com.br" },
  { nome: "Marina Ramos", email: "marina@calazansrossi.com.br" },
  { nome: "Camila Rocha", email: "camila@calazansrossi.com.br" },
  { nome: "Lucas Martins", email: "lucas@calazansrossi.com.br" },
  { nome: "Rachel Segall", email: "rachel@calazansrossi.com.br" },
  { nome: "Renato da Silva", email: "renato@calazansrossi.com.br" },
  { nome: "Bárbara Pitanga Zordan", email: "barbara@calazansrossi.com.br" },
  { nome: "Liliane Rocha", email: "liliane@calazansrossi.com.br" },
  { nome: "Anderson Ferreira", email: "anderson@calazansrossi.com" },
  { nome: "Alexandre Ferrer", email: "alexandre@calazansrossi.com.br" },
  { nome: "André Pifano", email: "andre@calazansrossi.com.br" },
  { nome: "Beatriz Viegas", email: "beatriz@calazansrossi.com.br" },
  { nome: "Felipe Rossi", email: "felipe@calazansrossi.com.br" },
  { nome: "Bernardo Calazans", email: "bernardo@calazansrossi.com" }
];

export const BulkUserCreator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    created: string[];
    errors: { email: string; error: string }[];
  } | null>(null);

  const createUsers = async () => {
    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-bulk-users', {
        body: { users: USERS_LIST }
      });

      if (error) throw error;

      setResults(data);
      
      if (data.created.length > 0) {
        toast.success(`${data.created.length} usuários criados com sucesso!`);
      }
      
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} usuários com erro`);
      }
    } catch (error) {
      console.error('Erro ao criar usuários:', error);
      toast.error('Erro ao criar usuários em massa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Criar Usuários em Massa
        </CardTitle>
        <CardDescription>
          Criar {USERS_LIST.length} usuários como advogados com senha temporária
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">ℹ️ Informações importantes:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Senha temporária: <code className="bg-background px-1 rounded">PrimeiroNome@CR2025</code></li>
            <li>• Role: <Badge variant="outline">advogado</Badge></li>
            <li>• Email auto-confirmado</li>
            <li>• Total de usuários: {USERS_LIST.length}</li>
          </ul>
        </div>

        <Button 
          onClick={createUsers} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando usuários...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Criar {USERS_LIST.length} Usuários
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    Criados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{results.created.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <XCircle className="w-4 h-4" />
                    Erros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{results.errors.length}</p>
                </CardContent>
              </Card>
            </div>

            {results.created.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Usuários criados com sucesso:
                </h4>
                <ScrollArea className="h-32 border rounded-lg p-2">
                  <div className="space-y-1">
                    {results.created.map((email, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        ✓ {email}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {results.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-destructive">
                  <XCircle className="w-4 h-4" />
                  Erros encontrados:
                </h4>
                <ScrollArea className="h-32 border rounded-lg p-2">
                  <div className="space-y-1">
                    {results.errors.map((error, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-destructive">✗</span> {error.email}: {error.error}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};