import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, MessageCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClientes } from "@/hooks/useClientes";
import { ORGAOS_LIST } from "@/data/orgaos";
import { openWhatsApp } from "@/lib/utils";
import { z } from "zod";
import { usePendencias } from "@/hooks/usePendencias";
import { supabase } from "@/integrations/supabase/client";

const pendenciaSchema = z.object({
  numeroProcesso: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  orgao: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  tipoUrgencia: z.string().min(1, "Campo obrigatório"),
  prazoLimite: z.string().min(1, "Campo obrigatório"),
  responsavel: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  descricao: z.string().trim().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres"),
  cliente: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  observacoes: z.string().max(500, "Máximo 500 caracteres").optional()
});

interface PendenciasFormProps {
  clienteFilter?: string;
}

const PendenciasForm = ({ clienteFilter }: PendenciasFormProps = {}) => {
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { criarPendencia } = usePendencias();
  
  const [formData, setFormData] = useState({
    numeroProcesso: "",
    orgao: "",
    tipoUrgencia: "",
    prazoLimite: "",
    responsavel: "",
    descricao: "",
    cliente: clienteFilter || "",
    observacoes: ""
  });

  const [loading, setLoading] = useState(false);
  const [melhorandoTexto, setMelhorandoTexto] = useState(false);
  const [clienteOutro, setClienteOutro] = useState("");
  const [showClienteOutro, setShowClienteOutro] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [textoMelhorado, setTextoMelhorado] = useState('');

  const handleInputChange = async (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    
    // Se o cliente for "Outros", mostrar campo de texto
    if (field === 'cliente') {
      if (value === 'Outros') {
        setShowClienteOutro(true);
      } else {
        setShowClienteOutro(false);
        setClienteOutro('');
      }
    }
  };

  const melhorarTextoDescricao = async () => {
    if (!formData.descricao.trim() || formData.descricao.length < 10) {
      toast({
        title: "Atenção",
        description: "Digite pelo menos 10 caracteres na descrição antes de melhorar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setMelhorandoTexto(true);
      
      const { data, error } = await supabase.functions.invoke('melhorar-texto-juridico', {
        body: { texto: formData.descricao }
      });

      if (error) {
        throw error;
      }

      if (data?.textoMelhorado) {
        setFormData(prev => ({ ...prev, descricao: data.textoMelhorado }));
        toast({
          title: "Texto melhorado!",
          description: "A descrição foi aprimorada com redação mais técnica.",
        });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao melhorar texto:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível melhorar o texto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setMelhorandoTexto(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const validatedData = pendenciaSchema.parse(formData);

      // Usar o cliente digitado se for "Outros"
      const clienteFinal = formData.cliente === 'Outros' ? clienteOutro : validatedData.cliente;

      // Validar cliente personalizado
      if (formData.cliente === 'Outros' && !clienteOutro.trim()) {
        toast({
          title: "Erro de validação",
          description: "Por favor, digite o nome do cliente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Melhorar o texto da descrição automaticamente antes de mostrar preview
      let descricaoFinal = validatedData.descricao;
      try {
        const { data, error } = await supabase.functions.invoke('melhorar-texto-juridico', {
          body: { texto: validatedData.descricao }
        });

        if (!error && data?.textoMelhorado) {
          descricaoFinal = data.textoMelhorado;
        }
      } catch (error) {
        console.error('Erro ao melhorar texto automaticamente:', error);
        // Continua com o texto original se houver erro
      }

      // Armazenar o texto melhorado e abrir dialog de confirmação
      setTextoMelhorado(descricaoFinal);
      setIsConfirmDialogOpen(true);
      setLoading(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao processar formulário.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const handleConfirmarEnvio = async () => {
    try {
      setLoading(true);
      const validatedData = pendenciaSchema.parse(formData);
      
      const clienteFinal = formData.cliente === 'Outros' ? clienteOutro : validatedData.cliente;

      // Salvar no banco de dados com a descrição melhorada
      const pendencia = await criarPendencia({
        numero_processo: validatedData.numeroProcesso,
        orgao: validatedData.orgao,
        tipo_urgencia: validatedData.tipoUrgencia,
        prazo_limite: validatedData.prazoLimite,
        responsavel: validatedData.responsavel,
        cliente: clienteFinal,
        descricao: textoMelhorado,
        observacoes: validatedData.observacoes
      });

      const message = `*PENDÊNCIA/URGÊNCIA - CALAZANS ROSSI ADVOGADOS*
    
*Protocolo:* ${pendencia.codigo_unico}
*Processo:* ${validatedData.numeroProcesso}
*Órgão:* ${validatedData.orgao}
*Tipo de Urgência:* ${validatedData.tipoUrgencia}
*Prazo Limite:* ${validatedData.prazoLimite}
*Adv. Jurídico Interno:* ${validatedData.responsavel}
*Cliente:* ${clienteFinal}

*Descrição da Pendência:*
${textoMelhorado}

${validatedData.observacoes ? `*Observações:*\n${validatedData.observacoes}` : ''}

`;

      // Abre o WhatsApp com a mensagem pronta
      openWhatsApp(message);

      setIsConfirmDialogOpen(false);
      setTextoMelhorado('');
      setFormData({
        numeroProcesso: "",
        orgao: "",
        tipoUrgencia: "",
        prazoLimite: "",
        responsavel: "",
        descricao: "",
        cliente: "",
        observacoes: ""
      });
      setClienteOutro('');
      setShowClienteOutro(false);

      toast({
        title: "Pendência comunicada!",
        description: `WhatsApp aberto. Selecione o grupo Hapvida e envie a mensagem já preenchida.`,
      });
    } catch (error) {
      console.error('Erro ao confirmar envio:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar pendência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Card className="shadow-elevated bg-gradient-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-warning/20 to-warning/10 rounded-xl">
              <AlertTriangle className="h-12 w-12 text-warning" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gradient">Pendências / Urgências</CardTitle>
          <CardDescription className="text-lg">
            Registre pendências críticas e prazos urgentes para comunicação imediata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numeroProcesso" className="text-sm font-medium">
                Número do Processo *
              </Label>
              <div className="relative">
                <Input
                  id="numeroProcesso"
                  placeholder="Ex: 1234567-89.2024.8.26.0001"
                  value={formData.numeroProcesso}
                  onChange={(e) => handleInputChange('numeroProcesso', e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgao" className="text-sm font-medium">
                Órgão *
              </Label>
              <Combobox
                options={ORGAOS_LIST.map(orgao => ({ value: orgao, label: orgao }))}
                value={formData.orgao}
                onValueChange={(value) => handleInputChange('orgao', value)}
                placeholder="Selecione o órgão"
                searchPlaceholder="Buscar órgão..."
                emptyMessage="Nenhum órgão encontrado."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoUrgencia" className="text-sm font-medium">
                Tipo de Urgência *
              </Label>
              <Select value={formData.tipoUrgencia} onValueChange={(value) => handleInputChange('tipoUrgencia', value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o tipo de urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prazo-recursal">Prazo Recursal</SelectItem>
                  <SelectItem value="contestacao">Contestação</SelectItem>
                  <SelectItem value="audiencia">Audiência</SelectItem>
                  <SelectItem value="documentacao">Documentação Pendente</SelectItem>
                  <SelectItem value="perícia">Perícia</SelectItem>
                  <SelectItem value="cumprimento">Cumprimento de Sentença</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DateField
              label="Prazo Limite"
              id="prazoLimite"
              value={formData.prazoLimite}
              onChange={(value) => handleInputChange('prazoLimite', value)}
              placeholder="Selecione o prazo limite"
              required
            />

            <div className="space-y-2">
              <Label htmlFor="responsavel" className="text-sm font-medium">
                Adv. Jurídico Interno *
              </Label>
              <Input
                id="responsavel"
                placeholder="Nome do advogado jurídico interno"
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cliente" className="text-sm font-medium">
                Cliente *
              </Label>
              <Select 
                value={formData.cliente} 
                onValueChange={(value) => handleInputChange('cliente', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showClienteOutro && (
                <Input
                  placeholder="Digite o nome do cliente"
                  value={clienteOutro}
                  onChange={(e) => setClienteOutro(e.target.value)}
                  className="mt-2 bg-background"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="descricao" className="text-sm font-medium">
                Descrição da Pendência *
              </Label>
              <Button
                onClick={melhorarTextoDescricao}
                disabled={melhorandoTexto || !formData.descricao.trim()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Sparkles className={`h-4 w-4 ${melhorandoTexto ? 'animate-spin' : ''}`} />
                {melhorandoTexto ? 'Melhorando...' : 'Melhorar com IA'}
              </Button>
            </div>
            <Textarea
              id="descricao"
              placeholder="Descreva detalhadamente a pendência ou urgência"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="min-h-32 bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium">
              Observações Adicionais
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Informações complementares ou instruções especiais"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              className="min-h-24 bg-background"
            />
          </div>

          <LoadingButton
            onClick={handleSubmit}
            loading={loading}
            className="w-full bg-warning hover:bg-warning/90 text-warning-foreground transition-colors"
            size="lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Enviar para WhatsApp
          </LoadingButton>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação com Preview do Texto Melhorado */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Conferir Texto Melhorado pela IA
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Atenção:</strong> O texto abaixo foi aprimorado automaticamente pela IA. 
                Por favor, confira o conteúdo antes de confirmar o envio para garantir que todas as informações estão corretas.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Descrição da Pendência (Versão Melhorada)</Label>
              <div className="bg-muted/50 rounded-lg p-4 border min-h-[200px]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{textoMelhorado}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfirmDialogOpen(false);
                  setTextoMelhorado('');
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <LoadingButton
                onClick={handleConfirmarEnvio}
                loading={loading}
                className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                Confirmar Envio
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendenciasForm;