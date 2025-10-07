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
import { useClientes } from "@/hooks/useClientes";
import { openWhatsApp } from "@/lib/utils";
import { z } from "zod";

const pendenciaSchema = z.object({
  numeroProcesso: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  tipoUrgencia: z.string().min(1, "Campo obrigatório"),
  prazoLimite: z.string().min(1, "Campo obrigatório"),
  responsavel: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  descricao: z.string().trim().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres"),
  cliente: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  observacoes: z.string().max(500, "Máximo 500 caracteres").optional()
});

const PendenciasForm = () => {
  const { toast } = useToast();
  const { clientes } = useClientes();
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
    try {
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
        return;
      }

      const message = `*PENDÊNCIA/URGÊNCIA - CALAZANS ROSSI ADVOGADOS*
    
*Processo:* ${validatedData.numeroProcesso}
*Tipo de Urgência:* ${validatedData.tipoUrgencia}
*Prazo Limite:* ${validatedData.prazoLimite}
*Adv. Jurídico Interno:* ${validatedData.responsavel}
*Cliente:* ${clienteFinal}

*Descrição da Pendência:*
${validatedData.descricao}

${validatedData.observacoes ? `*Observações:*\n${validatedData.observacoes}` : ''}

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
    }
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