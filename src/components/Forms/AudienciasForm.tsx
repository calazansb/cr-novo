import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, MessageSquare, FileSpreadsheet, Send, Copy, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Audiencia {
  data: string;
  hora: string;
  processo: string;
  tipo: string;
  cliente: string;
  adverso: string;
  comarca: string;
  uf: string;
  natureza: string;
  advogado: string;
  modalidade: string;
}

const AudienciasForm = () => {
  const [dadosExcel, setDadosExcel] = useState('');
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [dataProcessamento, setDataProcessamento] = useState('');
  const { toast } = useToast();

  const processarDadosExcel = () => {
    if (!dadosExcel.trim()) {
      toast({
        title: "Erro",
        description: "Cole os dados da planilha no campo acima",
        variant: "destructive"
      });
      return;
    }

    try {
      const linhas = dadosExcel.trim().split('\n');
      const audienciasProcessadas: Audiencia[] = [];
      
      // Pular a primeira linha (cabeçalho) se existir
      const linhasParaProcessar = linhas[0].includes('Data') || linhas[0].includes('Hora') ? linhas.slice(1) : linhas;
      
      linhasParaProcessar.forEach((linha, index) => {
        const colunas = linha.split('\t'); // Assumindo que foi copiado do Excel (separado por tab)
        
        if (colunas.length >= 11) {
          audienciasProcessadas.push({
            data: colunas[0]?.trim() || '',
            hora: colunas[1]?.trim() || '',
            processo: colunas[2]?.trim() || '',
            tipo: colunas[3]?.trim() || '',
            cliente: colunas[4]?.trim() || '',
            adverso: colunas[5]?.trim() || '',
            comarca: colunas[6]?.trim() || '',
            uf: colunas[7]?.trim() || '',
            natureza: colunas[8]?.trim() || '',
            advogado: colunas[9]?.trim() || '',
            modalidade: colunas[10]?.trim() || ''
          });
        }
      });

      if (audienciasProcessadas.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma audiência válida encontrada. Verifique o formato dos dados.",
          variant: "destructive"
        });
        return;
      }

      setAudiencias(audienciasProcessadas);
      setDataProcessamento(new Date().toLocaleDateString('pt-BR'));
      
      toast({
        title: "Sucesso",
        description: `${audienciasProcessadas.length} audiência(s) processada(s) com sucesso!`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar os dados. Verifique o formato da planilha.",
        variant: "destructive"
      });
    }
  };

  const gerarMensagemGrupo = () => {
    if (audiencias.length === 0) return '';

    const dataAudiencias = audiencias[0]?.data || new Date().toLocaleDateString('pt-BR');
    
    let mensagem = `🏛️ *AGENDA DE AUDIÊNCIAS - ${dataAudiencias}*\n\n`;
    mensagem += `📋 *ESC - Escritório de Advocacia*\n`;
    mensagem += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Agrupar por horário
    const audienciasPorHorario = audiencias.reduce((acc, audiencia) => {
      if (!acc[audiencia.hora]) {
        acc[audiencia.hora] = [];
      }
      acc[audiencia.hora].push(audiencia);
      return acc;
    }, {} as Record<string, Audiencia[]>);

    // Ordenar horários
    const horariosOrdenados = Object.keys(audienciasPorHorario).sort();

    horariosOrdenados.forEach((horario) => {
      mensagem += `⏰ *${horario}*\n`;
      
      audienciasPorHorario[horario].forEach((audiencia) => {
        mensagem += `🔹 *${audiencia.tipo}*\n`;
        mensagem += `   📂 ${audiencia.processo}\n`;
        mensagem += `   🏢 ${audiencia.cliente}\n`;
        mensagem += `   ⚖️ vs ${audiencia.adverso}\n`;
        mensagem += `   📍 ${audiencia.comarca}/${audiencia.uf}\n`;
        mensagem += `   👨‍💼 ${audiencia.advogado}\n`;
        mensagem += `   ${audiencia.modalidade === 'Virtual' ? '💻' : '🏛️'} ${audiencia.modalidade}\n\n`;
      });
    });

    mensagem += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensagem += `📊 *Total: ${audiencias.length} audiência(s)*\n`;
    mensagem += `📅 Processado em: ${dataProcessamento}\n\n`;
    mensagem += `✅ *Boa sorte a todos!*`;

    return mensagem;
  };

  const gerarMensagemAdvogado = (advogado: string) => {
    const audienciasAdvogado = audiencias.filter(a => 
      a.advogado.toLowerCase().includes(advogado.toLowerCase().replace('*', ''))
    );

    if (audienciasAdvogado.length === 0) return '';

    const dataAudiencias = audienciasAdvogado[0]?.data || new Date().toLocaleDateString('pt-BR');
    
    let mensagem = `👨‍⚖️ *Olá, ${advogado.replace('*', '')}!*\n\n`;
    mensagem += `📅 *Sua(s) audiência(s) para ${dataAudiencias}:*\n\n`;

    audienciasAdvogado.forEach((audiencia, index) => {
      mensagem += `${index + 1}️⃣ *${audiencia.hora} - ${audiencia.tipo}*\n`;
      mensagem += `📂 Processo: ${audiencia.processo}\n`;
      mensagem += `🏢 Cliente: ${audiencia.cliente}\n`;
      mensagem += `⚖️ Adverso: ${audiencia.adverso}\n`;
      mensagem += `📍 Comarca: ${audiencia.comarca}/${audiencia.uf}\n`;
      mensagem += `${audiencia.modalidade === 'Virtual' ? '💻' : '🏛️'} Modalidade: ${audiencia.modalidade}\n\n`;
    });

    mensagem += `🤝 *Boa sorte na(s) audiência(s)!*\n`;
    mensagem += `📞 Em caso de dúvidas, entre em contato.`;

    return mensagem;
  };

  const copiarMensagem = (mensagem: string, tipo: string) => {
    navigator.clipboard.writeText(mensagem);
    toast({
      title: "Copiado!",
      description: `Mensagem ${tipo} copiada para a área de transferência`
    });
  };

  const limparDados = () => {
    setDadosExcel('');
    setAudiencias([]);
    setDataProcessamento('');
  };

  const advogadosUnicos = [...new Set(audiencias.map(a => a.advogado))].filter(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <Calendar className="h-5 w-5 text-primary mr-2" />
          <div>
            <CardTitle>Agenda de Audiências</CardTitle>
            <CardDescription>
              Cole a planilha de audiências do dia seguinte para processamento e envio via WhatsApp
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Importar Dados da Planilha</h3>
            </div>
            
            <Alert className="border-blue-200 bg-blue-50">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Como usar:</strong> Abra a planilha Excel, selecione todos os dados (Ctrl+A), copie (Ctrl+C) e cole no campo abaixo (Ctrl+V).
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Textarea
                placeholder="Cole aqui os dados da planilha Excel..."
                value={dadosExcel}
                onChange={(e) => setDadosExcel(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={processarDadosExcel} className="flex-1">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Processar Audiências
              </Button>
              <Button variant="outline" onClick={limparDados}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {audiencias.length > 0 && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-5 w-5 text-green-600 mr-2" />
              <CardTitle>Audiências Processadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline">{audiencias.length} audiências</Badge>
                  <Badge variant="outline">{advogadosUnicos.length} advogados</Badge>
                  <Badge variant="outline">Processado em {dataProcessamento}</Badge>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Advogado</TableHead>
                      <TableHead>Comarca/UF</TableHead>
                      <TableHead>Modalidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audiencias.map((audiencia, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{audiencia.hora}</TableCell>
                        <TableCell>{audiencia.tipo}</TableCell>
                        <TableCell>{audiencia.cliente}</TableCell>
                        <TableCell>{audiencia.advogado}</TableCell>
                        <TableCell>{audiencia.comarca}/{audiencia.uf}</TableCell>
                        <TableCell>
                          <Badge variant={audiencia.modalidade === 'Virtual' ? 'secondary' : 'outline'}>
                            {audiencia.modalidade === 'Virtual' ? '💻' : '🏛️'} {audiencia.modalidade}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
              <CardTitle>Mensagem para Grupo ESC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {gerarMensagemGrupo()}
                  </pre>
                </div>
                <Button 
                  onClick={() => copiarMensagem(gerarMensagemGrupo(), 'do grupo')}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Mensagem do Grupo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Phone className="h-5 w-5 text-orange-600 mr-2" />
              <CardTitle>Mensagens Individuais para Advogados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {advogadosUnicos.map((advogado, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">👨‍⚖️ {advogado}</h4>
                      <Badge variant="outline">
                        {audiencias.filter(a => a.advogado === advogado).length} audiência(s)
                      </Badge>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded border mb-3">
                      <pre className="whitespace-pre-wrap text-sm">
                        {gerarMensagemAdvogado(advogado)}
                      </pre>
                    </div>
                    
                    <Button 
                      onClick={() => copiarMensagem(gerarMensagemAdvogado(advogado), `de ${advogado.replace('*', '')}`)}
                      variant="outline" 
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Mensagem
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert className="border-amber-200 bg-amber-50">
            <MessageSquare className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Próximo passo:</strong> As mensagens foram formatadas e podem ser copiadas. 
              Para envio automático via WhatsApp, seria necessário integrar com a API do WhatsApp Business 
              ou usar uma ferramenta como Zapier/Make.com para automatizar o processo.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
};

export default AudienciasForm;