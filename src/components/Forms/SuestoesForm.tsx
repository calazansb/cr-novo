import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, MessageCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openWhatsApp } from "@/lib/utils";
import { z } from "zod";

const sugestaoSchema = z.object({
  categoria: z.string().min(1, "Campo obrigatório"),
  titulo: z.string().trim().min(5, "Mínimo 5 caracteres").max(100, "Máximo 100 caracteres"),
  descricao: z.string().trim().min(20, "Mínimo 20 caracteres").max(1000, "Máximo 1000 caracteres"),
  prioridade: z.string().min(1, "Campo obrigatório"),
  departamento: z.string().min(1, "Campo obrigatório"),
  solicitante: z.string().trim().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  beneficios: z.string().max(500, "Máximo 500 caracteres").optional(),
  implementacao: z.string().max(500, "Máximo 500 caracteres").optional()
});

const SuestoesForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    categoria: "",
    titulo: "",
    descricao: "",
    prioridade: "",
    departamento: "",
    solicitante: "",
    beneficios: "",
    implementacao: ""
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleSubmit = () => {
    try {
      const validatedData = sugestaoSchema.parse(formData);

      const message = `*SUGESTÃO - CALAZANS ROSSI ADVOGADOS*
    
*Título:* ${validatedData.titulo}
*Categoria:* ${validatedData.categoria}
*Prioridade:* ${validatedData.prioridade}
*Departamento:* ${validatedData.departamento}
*Solicitante:* ${validatedData.solicitante}

*Descrição:*
${validatedData.descricao}

${validatedData.beneficios ? `*Benefícios Esperados:*\n${validatedData.beneficios}` : ''}

${validatedData.implementacao ? `*Proposta de Implementação:*\n${validatedData.implementacao}` : ''}

`;

      const phoneNumber = '5531998259845';
      openWhatsApp(message, phoneNumber);

      toast({
        title: "Sugestão enviada!",
        description: `Sua sugestão foi preparada para envio via WhatsApp.`,
      });

      setFormData({
        categoria: "",
        titulo: "",
        descricao: "",
        prioridade: "",
        departamento: "",
        solicitante: "",
        beneficios: "",
        implementacao: ""
      });
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
            <div className="p-4 bg-gradient-to-br from-success/20 to-success/10 rounded-xl">
              <Lightbulb className="h-12 w-12 text-success" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gradient">Sugestões</CardTitle>
          <CardDescription className="text-lg">
            Compartilhe suas ideias para melhorar nossos processos e comunicações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-sm font-medium">
                Categoria *
              </Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processos">Melhoria de Processos</SelectItem>
                  <SelectItem value="comunicacao">Comunicação</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="atendimento">Atendimento ao Cliente</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade" className="text-sm font-medium">
                Prioridade *
              </Label>
              <Select value={formData.prioridade} onValueChange={(value) => handleInputChange('prioridade', value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione a prioridade" />
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
              <Label htmlFor="departamento" className="text-sm font-medium">
                Departamento Afetado *
              </Label>
              <Select value={formData.departamento} onValueChange={(value) => handleInputChange('departamento', value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juridico">Jurídico</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">Recursos Humanos</SelectItem>
                  <SelectItem value="ti">Tecnologia da Informação</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="solicitante" className="text-sm font-medium">
                Solicitante *
              </Label>
              <Input
                id="solicitante"
                placeholder="Seu nome completo"
                value={formData.solicitante}
                onChange={(e) => handleInputChange('solicitante', e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-sm font-medium">
              Título da Sugestão *
            </Label>
            <Input
              id="titulo"
              placeholder="Resumo da sua sugestão em uma linha"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-sm font-medium">
              Descrição Detalhada *
            </Label>
            <Textarea
              id="descricao"
              placeholder="Descreva sua sugestão detalhadamente, incluindo o problema atual e a solução proposta"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="min-h-32 bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficios" className="text-sm font-medium">
              Benefícios Esperados
            </Label>
            <Textarea
              id="beneficios"
              placeholder="Quais benefícios esta sugestão pode trazer para o escritório?"
              value={formData.beneficios}
              onChange={(e) => handleInputChange('beneficios', e.target.value)}
              className="min-h-24 bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="implementacao" className="text-sm font-medium">
              Proposta de Implementação
            </Label>
            <Textarea
              id="implementacao"
              placeholder="Como você sugere que esta melhoria seja implementada?"
              value={formData.implementacao}
              onChange={(e) => handleInputChange('implementacao', e.target.value)}
              className="min-h-24 bg-background"
            />
          </div>


          <Button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full bg-success hover:bg-success/90 text-success-foreground transition-colors"
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

export default SuestoesForm;