import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClientes } from "@/hooks/useClientes";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { openWhatsApp } from "@/lib/utils";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sugestaoSchema = z.object({
  categoria: z.string().min(1, "Selecione uma categoria"),
  titulo: z.string().trim().min(5, "Mínimo 5 caracteres").max(150, "Máximo 150 caracteres"),
  descricao: z.string().trim().min(20, "Mínimo 20 caracteres").max(1000, "Máximo 1000 caracteres"),
  beneficios: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  urgencia: z.string().min(1, "Selecione a urgência")
});

const erroSchema = z.object({
  tipoErro: z.string().min(1, "Selecione o tipo de erro"),
  gravidade: z.string().min(1, "Selecione a gravidade"),
  numeroProcesso: z.string().trim().max(100, "Máximo 100 caracteres").optional(),
  responsavel: z.string().trim().max(100, "Máximo 100 caracteres").optional(),
  cliente: z.string().trim().min(1, "Cliente é obrigatório").max(100, "Máximo 100 caracteres"),
  prazoCorrecao: z.string().optional(),
  descricaoErro: z.string().trim().min(20, "Mínimo 20 caracteres").max(1000, "Máximo 1000 caracteres"),
  impacto: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  acaoCorretiva: z.string().trim().max(500, "Máximo 500 caracteres").optional()
});

const SugestoesErrosForm = () => {
  const { toast } = useToast();
  const { clientes } = useClientes();
  
  // Estados para Sugestões
  const [sugestaoData, setSugestaoData] = useState({
    categoria: "",
    titulo: "",
    descricao: "",
    beneficios: "",
    urgencia: ""
  });
  
  // Estados para Erros
  const [erroData, setErroData] = useState({
    tipoErro: "",
    gravidade: "",
    numeroProcesso: "",
    responsavel: "",
    cliente: "",
    prazoCorrecao: "",
    descricaoErro: "",
    impacto: "",
    acaoCorretiva: ""
  });
  
  const [loadingSugestao, setLoadingSugestao] = useState(false);
  const [loadingErro, setLoadingErro] = useState(false);
  const [clienteOutro, setClienteOutro] = useState("");
  const [showClienteOutro, setShowClienteOutro] = useState(false);

  const handleSubmitSugestao = async () => {
    setLoadingSugestao(true);
    try {
      const validatedData = sugestaoSchema.parse(sugestaoData);

      const message = `*SUGESTÃO DE MELHORIA - CALAZANS ROSSI ADVOGADOS*

*Categoria:* ${validatedData.categoria}
*Título:* ${validatedData.titulo}
*Urgência:* ${validatedData.urgencia}

*Descrição da Sugestão:*
${validatedData.descricao}

${validatedData.beneficios ? `*Benefícios Esperados:*\n${validatedData.beneficios}` : ''}
`;

      openWhatsApp(message);
      
      toast({
        title: "Sugestão enviada!",
        description: "Sua sugestão está pronta para envio via WhatsApp.",
      });

      setSugestaoData({
        categoria: "",
        titulo: "",
        descricao: "",
        beneficios: "",
        urgencia: ""
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao processar a sugestão.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingSugestao(false);
    }
  };

  const handleSubmitErro = async () => {
    setLoadingErro(true);
    try {
      const validatedData = erroSchema.parse(erroData);
      const clienteFinal = erroData.cliente === 'Outros' ? clienteOutro : validatedData.cliente;

      if (erroData.cliente === 'Outros' && !clienteOutro.trim()) {
        toast({
          title: "Erro de validação",
          description: "Por favor, digite o nome do cliente.",
          variant: "destructive",
        });
        return;
      }

      const message = `*REGISTRO DE ERRO - CALAZANS ROSSI ADVOGADOS*

*Tipo de Erro:* ${validatedData.tipoErro}
*Gravidade:* ${validatedData.gravidade}
${validatedData.numeroProcesso ? `*Processo:* ${validatedData.numeroProcesso}` : ''}
${validatedData.responsavel ? `*Responsável:* ${validatedData.responsavel}` : ''}
*Cliente:* ${clienteFinal}
${validatedData.prazoCorrecao ? `*Prazo para Correção:* ${validatedData.prazoCorrecao}` : ''}

*Descrição do Erro:*
${validatedData.descricaoErro}

${validatedData.impacto ? `*Impacto:*\n${validatedData.impacto}` : ''}

${validatedData.acaoCorretiva ? `*Ação Corretiva Sugerida:*\n${validatedData.acaoCorretiva}` : ''}
`;

      openWhatsApp(message);
      
      toast({
        title: "Erro registrado!",
        description: "O erro está pronto para envio via WhatsApp.",
      });

      setErroData({
        tipoErro: "",
        gravidade: "",
        numeroProcesso: "",
        responsavel: "",
        cliente: "",
        prazoCorrecao: "",
        descricaoErro: "",
        impacto: "",
        acaoCorretiva: ""
      });
      setClienteOutro('');
      setShowClienteOutro(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao processar o registro.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingErro(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Tabs defaultValue="sugestoes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sugestoes" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="erros" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Erros
          </TabsTrigger>
        </TabsList>

        {/* Tab Sugestões */}
        <TabsContent value="sugestoes">
          <Card className="shadow-elevated card-gradient hover-lift">
            <CardHeader className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 hero-gradient rounded-xl shadow-glow animate-float">
                  <Lightbulb className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-4">
                <CardTitle className="text-4xl font-bold text-gradient animate-slide-up">
                  Sugestões de Melhoria
                </CardTitle>
                <CardDescription className="text-lg leading-relaxed max-w-2xl mx-auto animate-slide-up">
                  Compartilhe suas ideias para melhorar nossos processos e serviços.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  type="select"
                  id="categoria"
                  label="Categoria"
                  value={sugestaoData.categoria}
                  onChange={(value) => setSugestaoData({ ...sugestaoData, categoria: value })}
                  placeholder="Selecione a categoria"
                  required
                  options={[
                    { value: 'processo', label: 'Processos Internos' },
                    { value: 'tecnologia', label: 'Tecnologia/Sistema' },
                    { value: 'atendimento', label: 'Atendimento ao Cliente' },
                    { value: 'comunicacao', label: 'Comunicação' },
                    { value: 'outros', label: 'Outros' }
                  ]}
                />

                <FormField
                  type="select"
                  id="urgencia"
                  label="Urgência"
                  value={sugestaoData.urgencia}
                  onChange={(value) => setSugestaoData({ ...sugestaoData, urgencia: value })}
                  placeholder="Selecione a urgência"
                  required
                  options={[
                    { value: 'baixa', label: 'Baixa - Melhoria futura' },
                    { value: 'media', label: 'Média - Importante mas não urgente' },
                    { value: 'alta', label: 'Alta - Necessita atenção prioritária' }
                  ]}
                />
              </div>

              <FormField
                type="input"
                id="titulo"
                label="Título da Sugestão"
                value={sugestaoData.titulo}
                onChange={(value) => setSugestaoData({ ...sugestaoData, titulo: value })}
                placeholder="Resuma sua sugestão em uma frase"
                required
              />

              <FormField
                type="textarea"
                id="descricao"
                label="Descrição Detalhada"
                value={sugestaoData.descricao}
                onChange={(value) => setSugestaoData({ ...sugestaoData, descricao: value })}
                placeholder="Descreva sua sugestão detalhadamente"
                rows={5}
                required
              />

              <FormField
                type="textarea"
                id="beneficios"
                label="Benefícios Esperados (Opcional)"
                value={sugestaoData.beneficios}
                onChange={(value) => setSugestaoData({ ...sugestaoData, beneficios: value })}
                placeholder="Que benefícios essa sugestão pode trazer?"
                rows={3}
              />

              <Button
                onClick={handleSubmitSugestao}
                disabled={loadingSugestao}
                className="w-full hero-gradient"
                size="lg"
              >
                <Lightbulb className="h-5 w-5 mr-2" />
                {loadingSugestao ? "Enviando..." : "Enviar Sugestão via WhatsApp"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Erros */}
        <TabsContent value="erros">
          <Card className="shadow-elevated card-gradient hover-lift">
            <CardHeader className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-destructive/10 rounded-xl shadow-glow animate-float">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <div className="space-y-4">
                <CardTitle className="text-4xl font-bold text-gradient animate-slide-up">
                  Registro de Erros
                </CardTitle>
                <CardDescription className="text-lg leading-relaxed max-w-2xl mx-auto animate-slide-up">
                  Reporte erros e problemas encontrados no sistema ou processos.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  type="select"
                  id="tipoErro"
                  label="Tipo de Erro"
                  value={erroData.tipoErro}
                  onChange={(value) => setErroData({ ...erroData, tipoErro: value })}
                  placeholder="Selecione o tipo"
                  required
                  options={[
                    { value: 'sistema', label: 'Erro de Sistema' },
                    { value: 'processo', label: 'Erro de Processo' },
                    { value: 'dados', label: 'Erro de Dados/Informação' },
                    { value: 'comunicacao', label: 'Erro de Comunicação' },
                    { value: 'prazo', label: 'Erro de Prazo' },
                    { value: 'outros', label: 'Outros' }
                  ]}
                />

                <FormField
                  type="select"
                  id="gravidade"
                  label="Gravidade"
                  value={erroData.gravidade}
                  onChange={(value) => setErroData({ ...erroData, gravidade: value })}
                  placeholder="Selecione a gravidade"
                  required
                  options={[
                    { value: 'baixa', label: 'Baixa - Sem impacto significativo' },
                    { value: 'media', label: 'Média - Impacto moderado' },
                    { value: 'alta', label: 'Alta - Impacto significativo' },
                    { value: 'critica', label: 'Crítica - Requer ação imediata' }
                  ]}
                />

                <FormField
                  type="input"
                  id="numeroProcesso"
                  label="Número do Processo (Opcional)"
                  value={erroData.numeroProcesso}
                  onChange={(value) => setErroData({ ...erroData, numeroProcesso: value })}
                  placeholder="Nº do processo relacionado"
                />

                <FormField
                  type="input"
                  id="responsavel"
                  label="Responsável (Opcional)"
                  value={erroData.responsavel}
                  onChange={(value) => setErroData({ ...erroData, responsavel: value })}
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente *</label>
                <Select 
                  value={erroData.cliente} 
                  onValueChange={(value) => {
                    setErroData({ ...erroData, cliente: value });
                    setShowClienteOutro(value === 'Outros');
                  }}
                >
                  <SelectTrigger>
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
                    className="mt-2"
                  />
                )}
              </div>

              <FormField
                type="input"
                id="prazoCorrecao"
                label="Prazo para Correção (Opcional)"
                value={erroData.prazoCorrecao}
                onChange={(value) => setErroData({ ...erroData, prazoCorrecao: value })}
                placeholder="Ex: 24/48 horas, 5 dias úteis"
              />

              <FormField
                type="textarea"
                id="descricaoErro"
                label="Descrição do Erro"
                value={erroData.descricaoErro}
                onChange={(value) => setErroData({ ...erroData, descricaoErro: value })}
                placeholder="Descreva o erro encontrado"
                rows={5}
                required
              />

              <FormField
                type="textarea"
                id="impacto"
                label="Impacto (Opcional)"
                value={erroData.impacto}
                onChange={(value) => setErroData({ ...erroData, impacto: value })}
                placeholder="Qual o impacto deste erro?"
                rows={3}
              />

              <FormField
                type="textarea"
                id="acaoCorretiva"
                label="Ação Corretiva Sugerida (Opcional)"
                value={erroData.acaoCorretiva}
                onChange={(value) => setErroData({ ...erroData, acaoCorretiva: value })}
                placeholder="Como este erro pode ser corrigido?"
                rows={3}
              />

              <Button
                onClick={handleSubmitErro}
                disabled={loadingErro}
                className="w-full bg-destructive hover:bg-destructive/90"
                size="lg"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                {loadingErro ? "Enviando..." : "Registrar Erro via WhatsApp"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SugestoesErrosForm;