import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";
import { ClipboardList, MessageCircle, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openWhatsApp } from "@/lib/utils";

const PendenciasForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    numeroProcesso: "",
    tipoUrgencia: "",
    prazoLimite: "",
    responsavel: "",
    descricao: "",
    cliente: "",
    observacoes: ""
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleSubmit = () => {
    const requiredFields = ['numeroProcesso', 'tipoUrgencia', 'prazoLimite', 'responsavel', 'descricao', 'cliente'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const message = `*PENDÊNCIA/URGÊNCIA - CALAZANS ROSSI ADVOGADOS*
    
*Processo:* ${formData.numeroProcesso}
*Tipo de Urgência:* ${formData.tipoUrgencia}
*Prazo Limite:* ${formData.prazoLimite}
*Advogado Responsável:* ${formData.responsavel}
*Cliente:* ${formData.cliente}

*Descrição da Pendência:*
${formData.descricao}

${formData.observacoes ? `*Observações:*\n${formData.observacoes}` : ''}

`;

    openWhatsApp(message);

    toast({
      title: "Pendência comunicada!",
      description: `Urgência preparada para envio via WhatsApp.`,
    });

    setFormData({
      numeroProcesso: "",
      tipoUrgencia: "",
      prazoLimite: "",
      responsavel: "",
      descricao: "",
      cliente: "",
      observacoes: ""
    });
  };

  return (
    <div className="animate-fade-in">
      <Card className="shadow-elevated bg-gradient-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-warning/20 to-warning/10 rounded-xl">
              <ClipboardList className="h-12 w-12 text-warning" />
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
              <Input
                id="numeroProcesso"
                placeholder="Ex: 1234567-89.2024.8.26.0001"
                value={formData.numeroProcesso}
                onChange={(e) => handleInputChange('numeroProcesso', e.target.value)}
                className="bg-background"
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
                Advogado Responsável *
              </Label>
              <Input
                id="responsavel"
                placeholder="Nome do advogado responsável"
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cliente" className="text-sm font-medium">
                Cliente *
              </Label>
              <Input
                id="cliente"
                placeholder="Nome do cliente"
                value={formData.cliente}
                onChange={(e) => handleInputChange('cliente', e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-sm font-medium">
              Descrição da Pendência *
            </Label>
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


          <Button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full bg-warning hover:bg-warning/90 text-warning-foreground transition-colors"
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

export default PendenciasForm;