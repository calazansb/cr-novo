import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Calculator, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CalculoPrazosForm = () => {
  const [dataInicial, setDataInicial] = useState('');
  const [numeroDias, setNumeroDias] = useState('');
  const [prazoSelecionado, setPrazoSelecionado] = useState('5');
  const [tipoContagem, setTipoContagem] = useState('uteis');
  const [tipoDataInicial, setTipoDataInicial] = useState('publicacao');
  const [resultado, setResultado] = useState<{
    dataFinal: string;
    diasUteis: number;
    diasCorridos: number;
    dataInicio: string;
    dataPublicacao: string;
    detalhamento: { data: string; diaSemana: string; contou: boolean; dia: number | null }[];
  } | null>(null);
  
  const { toast } = useToast();

  const calcularPrazo = () => {
    if (!dataInicial || (!numeroDias && prazoSelecionado === 'outro')) {
      toast({
        title: "Erro",
        description: "Preencha a data inicial e o número de dias",
        variant: "destructive"
      });
      return;
    }

    const prazoFinal = prazoSelecionado === 'outro' ? parseInt(numeroDias) : parseInt(prazoSelecionado);
    
    if (!prazoFinal || prazoFinal <= 0) {
      toast({
        title: "Erro", 
        description: "Informe um número de dias válido",
        variant: "destructive"
      });
      return;
    }

    // Criar a data corretamente interpretando a string no formato YYYY-MM-DD
    const [ano, mes, dia] = dataInicial.split('-').map(Number);
    const dataInicialDate = new Date(ano, mes - 1, dia);
    
    let dataPublicacaoDate;
    let dataInicioContagem;
    const detalhamento: { data: string; diaSemana: string; contou: boolean; dia: number | null }[] = [];

    if (tipoDataInicial === 'disponibilizacao') {
      // Publicação é no primeiro dia útil seguinte à disponibilização
      dataPublicacaoDate = new Date(dataInicialDate);
      dataPublicacaoDate.setDate(dataPublicacaoDate.getDate() + 1);
      
      // Encontrar o primeiro dia útil
      while (dataPublicacaoDate.getDay() === 0 || dataPublicacaoDate.getDay() === 6) {
        dataPublicacaoDate.setDate(dataPublicacaoDate.getDate() + 1);
      }
    } else {
      // Se foi informada a data de publicação
      dataPublicacaoDate = dataInicialDate;
    }

    // Início da contagem é no primeiro dia útil seguinte à publicação
    dataInicioContagem = new Date(dataPublicacaoDate);
    dataInicioContagem.setDate(dataInicioContagem.getDate() + 1);
    
    // Encontrar o primeiro dia útil para início da contagem
    while (dataInicioContagem.getDay() === 0 || dataInicioContagem.getDay() === 6) {
      dataInicioContagem.setDate(dataInicioContagem.getDate() + 1);
    }

    let currentDate = new Date(dataInicioContagem);
    let diasContados = 0;

    if (tipoContagem === 'uteis') {
      // Cálculo de dias úteis (segunda a sexta)
      while (diasContados < prazoFinal) {
        const dayOfWeek = currentDate.getDay();
        const diaSemanaNames = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
        
        // Se não é sábado (6) nem domingo (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          diasContados++;
          detalhamento.push({
            data: currentDate.toLocaleDateString('pt-BR'),
            diaSemana: diaSemanaNames[dayOfWeek],
            contou: true,
            dia: diasContados
          });
        } else {
          detalhamento.push({
            data: currentDate.toLocaleDateString('pt-BR'),
            diaSemana: diaSemanaNames[dayOfWeek],
            contou: false,
            dia: null
          });
        }
        
        if (diasContados < prazoFinal) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } else {
      // Cálculo de dias corridos
      for (let i = 1; i <= prazoFinal; i++) {
        const dayOfWeek = currentDate.getDay();
        const diaSemanaNames = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
        
        detalhamento.push({
          data: currentDate.toLocaleDateString('pt-BR'),
          diaSemana: diaSemanaNames[dayOfWeek],
          contou: true,
          dia: i
        });
        
        if (i < prazoFinal) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      diasContados = prazoFinal;
    }

    const diasTotais = Math.ceil((currentDate.getTime() - dataInicioContagem.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    setResultado({
      dataFinal: currentDate.toLocaleDateString('pt-BR'),
      diasUteis: tipoContagem === 'uteis' ? prazoFinal : 0,
      diasCorridos: tipoContagem === 'corridos' ? prazoFinal : diasTotais,
      dataInicio: dataInicioContagem.toLocaleDateString('pt-BR'),
      dataPublicacao: dataPublicacaoDate.toLocaleDateString('pt-BR'),
      detalhamento
    });

    toast({
      title: "Prazo calculado",
      description: `Vencimento: ${currentDate.toLocaleDateString('pt-BR')}`,
    });
  };

  const limparCalculo = () => {
    setDataInicial('');
    setNumeroDias('');
    setPrazoSelecionado('5');
    setTipoContagem('uteis');
    setTipoDataInicial('publicacao');
    setResultado(null);
  };

  const copiarDetalhamento = () => {
    if (!resultado) return;

    const texto = `CÁLCULO DE PRAZO PROCESSUAL
=====================================

Prazo: ${prazoSelecionado === 'outro' ? numeroDias : prazoSelecionado} dias ${tipoContagem === 'uteis' ? 'úteis' : 'corridos'}
Data Inicial: ${dataInicial} (${tipoDataInicial === 'disponibilizacao' ? 'disponibilização' : 'publicação'})
Data de Publicação: ${resultado.dataPublicacao}
Início da Contagem: ${resultado.dataInicio}
Data de Vencimento: ${resultado.dataFinal}

DETALHAMENTO DIA A DIA:
${resultado.detalhamento.map((item, i) => 
  `${i + 1}. ${item.data} - ${item.diaSemana} - ${item.contou ? `✓ Contou (${item.dia}º dia)` : '✗ Não contou'}`
).join('\n')}

Total de dias ${tipoContagem === 'uteis' ? 'úteis' : 'corridos'}: ${tipoContagem === 'uteis' ? resultado.diasUteis : resultado.diasCorridos}

---
Gerado pelo Sistema CRA - Calazans Rossi Advogados
${new Date().toLocaleString('pt-BR')}`;

    navigator.clipboard.writeText(texto).then(() => {
      toast({
        title: "Copiado!",
        description: "Detalhamento copiado para a área de transferência",
      });
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível copiar. Tente novamente.",
        variant: "destructive"
      });
    });
  };

  const baixarTXT = () => {
    if (!resultado) return;

    const texto = `CÁLCULO DE PRAZO PROCESSUAL
=====================================

Prazo: ${prazoSelecionado === 'outro' ? numeroDias : prazoSelecionado} dias ${tipoContagem === 'uteis' ? 'úteis' : 'corridos'}
Data Inicial: ${dataInicial} (${tipoDataInicial === 'disponibilizacao' ? 'disponibilização' : 'publicação'})
Data de Publicação: ${resultado.dataPublicacao}
Início da Contagem: ${resultado.dataInicio}
Data de Vencimento: ${resultado.dataFinal}

DETALHAMENTO DIA A DIA:
${resultado.detalhamento.map((item, i) => 
  `${i + 1}. ${item.data} - ${item.diaSemana} - ${item.contou ? `✓ Contou (${item.dia}º dia)` : '✗ Não contou'}`
).join('\n')}

Total de dias ${tipoContagem === 'uteis' ? 'úteis' : 'corridos'}: ${tipoContagem === 'uteis' ? resultado.diasUteis : resultado.diasCorridos}

---
Gerado pelo Sistema CRA - Calazans Rossi Advogados
${new Date().toLocaleString('pt-BR')}`;

    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calculo-prazo-${dataInicial.replace(/\//g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado!",
      description: "Arquivo TXT foi baixado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <Calculator className="h-5 w-5 text-primary mr-2" />
          <div>
            <CardTitle>Cálculo de Prazos Processuais</CardTitle>
            <CardDescription>
              Calcule prazos considerando apenas dias úteis (segunda a sexta-feira)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Dados para Cálculo</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Informe os dados necessários para o cálculo do prazo
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dataInicial">Data Inicial</Label>
                <Input
                  id="dataInicial"
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroDias">Número de Dias</Label>
                <Select value={prazoSelecionado} onValueChange={setPrazoSelecionado}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="8">8 dias</SelectItem>
                    <SelectItem value="10">10 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="outro">Outro prazo</SelectItem>
                  </SelectContent>
                </Select>
                {prazoSelecionado === 'outro' && (
                  <Input
                    type="number"
                    placeholder="Digite o número de dias"
                    value={numeroDias}
                    onChange={(e) => setNumeroDias(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo de Contagem</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  tipoContagem === 'uteis' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setTipoContagem('uteis')}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={tipoContagem === 'uteis'}
                    onChange={() => setTipoContagem('uteis')}
                    className="text-primary"
                  />
                  <Label className="cursor-pointer font-medium">Dias Úteis</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Exclui sábados e domingos</p>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  tipoContagem === 'corridos' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setTipoContagem('corridos')}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={tipoContagem === 'corridos'}
                    onChange={() => setTipoContagem('corridos')}
                    className="text-primary"
                  />
                  <Label className="cursor-pointer font-medium">Dias Corridos</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Inclui todos os dias</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo de Data Inicial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  tipoDataInicial === 'publicacao' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setTipoDataInicial('publicacao')}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={tipoDataInicial === 'publicacao'}
                    onChange={() => setTipoDataInicial('publicacao')}
                    className="text-primary"
                  />
                  <Label className="cursor-pointer font-medium">Data de Publicação</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Data oficial da publicação</p>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  tipoDataInicial === 'disponibilizacao' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setTipoDataInicial('disponibilizacao')}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={tipoDataInicial === 'disponibilizacao'}
                    onChange={() => setTipoDataInicial('disponibilizacao')}
                    className="text-primary"
                  />
                  <Label className="cursor-pointer font-medium">Data de Disponibilização</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Data de disponibilização eletrônica</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calcularPrazo} className="flex-1">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Prazo
            </Button>
            <Button variant="outline" onClick={limparCalculo}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert variant="destructive" className="border-2 border-red-600 bg-red-50 dark:bg-red-950/30 p-6">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <AlertDescription className="text-red-900 dark:text-red-100 text-lg font-semibold ml-2">
          <strong className="text-xl block mb-2">⚠️ ATENÇÃO - IMPORTANTE:</strong> 
          <span className="text-base">Este cálculo é apenas uma estimativa automatizada. Sempre confira o prazo manualmente e consulte a legislação vigente antes de tomar qualquer decisão processual. O escritório não se responsabiliza por eventuais erros no cálculo automático.</span>
        </AlertDescription>
      </Alert>

      {resultado && (
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <CardTitle>Resultado do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold text-blue-600">{resultado.dataPublicacao}</div>
                <div className="text-sm text-muted-foreground">Data de Publicação</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold text-green-600">{resultado.dataInicio}</div>
                <div className="text-sm text-muted-foreground">Início da Contagem</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-primary">{resultado.dataFinal}</div>
                <div className="text-sm text-muted-foreground">Data de Vencimento</div>
              </div>
              
              {tipoContagem === 'uteis' && resultado.diasUteis > 0 && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">{resultado.diasUteis}</div>
                  <div className="text-sm text-muted-foreground">Dias Úteis</div>
                </div>
              )}
              
              {tipoContagem === 'corridos' && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">{resultado.diasCorridos}</div>
                  <div className="text-sm text-muted-foreground">Dias Corridos</div>
                </div>
              )}
            </div>

            {/* Detalhamento da Contagem */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Detalhes do Cálculo:
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm p-4 bg-muted/50 rounded mb-4">
                  {prazoSelecionado === 'outro' ? numeroDias : prazoSelecionado} dias {tipoContagem === 'uteis' ? 'úteis' : 'corridos'} a partir de {dataInicial} 
                  {tipoDataInicial === 'disponibilizacao' ? ' (data de disponibilização)' : ' (data de publicação)'}. 
                  Publicação considerada em {resultado.dataPublicacao}. 
                  Prazo iniciado em {resultado.dataInicio}.
                </div>

                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={copiarDetalhamento}>
                    <FileText className="h-4 w-4 mr-2" />
                    Copiar Detalhamento
                  </Button>
                  <Button variant="outline" size="sm" onClick={baixarTXT}>
                    <FileText className="h-4 w-4 mr-2" />
                    Baixar TXT
                  </Button>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Detalhamento Dia a Dia:</h4>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 font-semibold border-b grid grid-cols-4 gap-4 text-sm">
                      <div>Data</div>
                      <div>Dia da Semana</div>
                      <div>Contou?</div>
                      <div>Dia nº</div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {resultado.detalhamento.map((item, index) => (
                        <div key={index} className="px-4 py-2 border-b grid grid-cols-4 gap-4 text-sm hover:bg-muted/50">
                          <div>{item.data}</div>
                          <div>{item.diaSemana}</div>
                          <div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              item.contou 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.contou ? '✓ Sim' : '✗ Não'}
                            </span>
                          </div>
                          <div>{item.dia ? `${item.dia}º dia` : '-'}</div>
                        </div>
                      ))}
                    </div>
                    
                    {resultado.detalhamento.some(item => !item.contou) && (
                      <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground italic">
                        Fim de semana - não conta
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Atenção:</strong> Este resultado é apenas uma estimativa automatizada. Sempre verifique o prazo manualmente considerando feriados locais e particularidades do processo.
              </AlertDescription>
            </Alert>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-100">Importante</Badge>
                <span className="text-sm text-blue-800">
                  Este cálculo {tipoContagem === 'uteis' ? 'considera apenas dias úteis (segunda a sexta-feira)' : 'considera todos os dias (corridos)'} e não inclui feriados nacionais.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalculoPrazosForm;