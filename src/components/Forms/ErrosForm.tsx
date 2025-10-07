import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";
import { AlertTriangle, MessageCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClientes } from "@/hooks/useClientes";
import { openWhatsApp } from "@/lib/utils";
import { z } from "zod";

const erroSchema = z.object({
  tipoErro: z.string().min(1, "Campo obrigatório"),
  gravidade: z.string().min(1, "Campo obrigatório"),
  numeroProcesso: z.string().max(100, "Máximo 100 caracteres").optional(),
  descricaoErro: z.string().trim().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres"),
  impacto: z.string().trim().min(10, "Mínimo 10 caracteres").max(500, "Máximo 500 caracteres"),
  responsavel: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  cliente: z.string().max(100, "Máximo 100 caracteres").optional(),
  acaoCorretiva: z.string().max(500, "Máximo 500 caracteres").optional(),
  prazoCorrecao: z.string().optional()
});

const ErrosForm = () => {
  const { toast } = useToast();
  const { clientes } = useClientes();
  const [formData, setFormData] = useState({
    tipoErro: "",
    gravidade: "",
    numeroProcesso: "",
    descricaoErro: "",
    impacto: "",
    responsavel: "",
    cliente: "",
    acaoCorretiva: "",
    prazoCorrecao: ""
  });

  const [loading, setLoading] = useState(false);
  const [clienteOutro, setClienteOutro] = useState("");
  const [showClienteOutro, setShowClienteOutro] = useState(false);

  const handleInputChange = (field: string, value: string) => {
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


  const handleSubmit = () => {
    setLoading(true);

    try {
      const validatedData = erroSchema.parse(formData);

      // Usar o cliente digitado se for "Outros"
      const clienteFinal = formData.cliente === 'Outros' ? clienteOutro : (validatedData.cliente || 'N/A');

      const message = `*🚨 RELATÓRIO DE ERRO*

*Tipo de Erro:* ${validatedData.tipoErro}
*Gravidade:* ${validatedData.gravidade}
*Processo:* ${validatedData.numeroProcesso || 'N/A'}
*Cliente:* ${clienteFinal}
*Responsável:* ${validatedData.responsavel}

*Descrição do Erro:*
${validatedData.descricaoErro}

*Impacto:*
${validatedData.impacto}

*Ação Corretiva:*
${validatedData.acaoCorretiva || 'N/A'}

*Prazo para Correção:* ${validatedData.prazoCorrecao || 'N/A'}

---
Relatório gerado automaticamente pelo Sistema Calazans Rossi`;

      openWhatsApp(message);
      
      toast({
        title: "Erro reportado!",
        description: `Relatório de erro enviado via WhatsApp com sucesso.`,
      });

      setFormData({
        tipoErro: "",
        gravidade: "",
        numeroProcesso: "",
        descricaoErro: "",      
        impacto: "",
        responsavel: "",
        cliente: "",
        acaoCorretiva: "",
        prazoCorrecao: ""
      });
      setClienteOutro('');
      setShowClienteOutro(false);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Card className="shadow-elevated bg-gradient-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-xl">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gradient">Relatório de Erros</CardTitle>
          <CardDescription className="text-lg">
            Registre erros e problemas para correção imediata e melhoria contínua
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tipoErro" className="text-sm font-medium">
                Tipo de Erro *
              </Label>
              <Select value={formData.tipoErro} onValueChange={(value) => handleInputChange('tipoErro', value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o tipo de erro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processual">Erro Processual</SelectItem>
                  <SelectItem value="documentacao">Erro de Documentação</SelectItem>
                  <SelectItem value="prazo">Perda de Prazo</SelectItem>
                  <SelectItem value="comunicacao">Falha na Comunicação</SelectItem>
                  <SelectItem value="sistema">Erro de Sistema</SelectItem>
                  <SelectItem value="cadastral">Erro Cadastral</SelectItem>
                  <SelectItem value="financeiro">Erro Financeiro</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gravidade" className="text-sm font-medium">
                Gravidade *
              </Label>
              <Select value={formData.gravidade} onValueChange={(value) => handleInputChange('gravidade', value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione a gravidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroProcesso" className="text-sm font-medium">
                Número do Processo
              </Label>
              <Input
                id="numeroProcesso"
                placeholder="Ex: 1234567-89.2024.8.26.0001 (se aplicável)"
                value={formData.numeroProcesso}
                onChange={(e) => handleInputChange('numeroProcesso', e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel" className="text-sm font-medium">
                Responsável *
              </Label>
              <Input
                id="responsavel"
                placeholder="Nome do responsável"
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente" className="text-sm font-medium">
                Cliente Afetado
              </Label>
              <Select 
                value={formData.cliente} 
                onValueChange={(value) => handleInputChange('cliente', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o cliente (opcional)" />
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

            <DateField
              label="Prazo para Correção"
              id="prazoCorrecao"
              value={formData.prazoCorrecao}
              onChange={(value) => handleInputChange('prazoCorrecao', value)}
              placeholder="Selecione o prazo para correção"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricaoErro" className="text-sm font-medium">
              Descrição do Erro *
            </Label>
            <Textarea
              id="descricaoErro"
              placeholder="Descreva detalhadamente o erro ocorrido, quando aconteceu e as circunstâncias"
              value={formData.descricaoErro}
              onChange={(e) => handleInputChange('descricaoErro', e.target.value)}
              className="min-h-32 bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="impacto" className="text-sm font-medium">
              Impacto do Erro *
            </Label>
            <Textarea
              id="impacto"
              placeholder="Qual foi o impacto deste erro? Como afetou o cliente, o processo ou o escritório?"
              value={formData.impacto}
              onChange={(e) => handleInputChange('impacto', e.target.value)}
              className="min-h-24 bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acaoCorretiva" className="text-sm font-medium">
              Ação Corretiva Proposta
            </Label>
            <Textarea
              id="acaoCorretiva"
              placeholder="Que ações devem ser tomadas para corrigir este erro e evitar sua recorrência?"
              value={formData.acaoCorretiva}
              onChange={(e) => handleInputChange('acaoCorretiva', e.target.value)}
              className="min-h-24 bg-background"
            />
          </div>


          <Button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors"
            size="lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            {loading ? "Enviando..." : "Enviar para WhatsApp"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrosForm;