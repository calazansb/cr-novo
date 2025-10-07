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
import { openWhatsApp } from "@/lib/utils";

const ErrosForm = () => {
  const { toast } = useToast();
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleSubmit = async () => {
    const requiredFields = ['tipoErro', 'gravidade', 'descricaoErro', 'impacto', 'responsavel'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const message = `*🚨 RELATÓRIO DE ERRO*

*Tipo de Erro:* ${formData.tipoErro}
*Gravidade:* ${formData.gravidade}
*Processo:* ${formData.numeroProcesso || 'N/A'}
*Cliente:* ${formData.cliente || 'N/A'}
*Responsável:* ${formData.responsavel}

*Descrição do Erro:*
${formData.descricaoErro}

*Impacto:*
${formData.impacto}

*Ação Corretiva:*
${formData.acaoCorretiva || 'N/A'}

*Prazo para Correção:* ${formData.prazoCorrecao || 'N/A'}

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
    } catch (error) {
      toast({
        title: "Erro no envio",
        description: "Ocorreu um erro ao enviar o relatório. Tente novamente.",
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
              <Input
                id="cliente"
                placeholder="Nome do cliente (se aplicável)"
                value={formData.cliente}
                onChange={(e) => handleInputChange('cliente', e.target.value)}
                className="bg-background"
              />
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