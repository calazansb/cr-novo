import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MessageCircle, Mail, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/ui/loading-button";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { SelectWithAdminEdit } from "@/components/Admin/SelectWithAdminEdit";
import { useClientes } from "@/hooks/useClientes";
import { ORGAOS_LIST } from "@/data/orgaos";
import { openWhatsApp } from "@/lib/utils";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useDecisoes } from "@/hooks/useDecisoes";
import { z } from "zod";

const decisaoSchema = z.object({
  numeroProcesso: z.string().trim().min(1, "Número do processo é obrigatório").max(100, "Máximo 100 caracteres"),
  orgao: z.string().trim().min(1, "Órgão é obrigatório").max(100, "Máximo 100 caracteres"),
  varaTribunal: z.string().trim().min(1, "Vara / Câmara / Turma é obrigatório").max(200, "Máximo 200 caracteres"),
  nomeCliente: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Máximo 100 caracteres"),
  tipoDecisao: z.string().min(1, "Tipo de decisão é obrigatório"),
  nomeMagistrado: z.string().trim().min(1, "Nome do Magistrado é obrigatório").max(100, "Máximo 100 caracteres"),
  advogadoInterno: z.string().trim().min(1, "Adv. Jurídico Interno é obrigatório").max(100, "Máximo 100 caracteres"),
  adverso: z.string().trim().min(1, "Adverso é obrigatório").max(100, "Máximo 100 caracteres"),
  procedimentoObjeto: z.string().trim().min(1, "Objeto / Procedimento é obrigatório").max(200, "Máximo 200 caracteres"),
  resumoDecisao: z.string().trim().min(20, "Resumo deve ter pelo menos 20 caracteres").max(2000, "Máximo 2000 caracteres")
});

const DecisaoJudicialForm = () => {
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { user } = useAuth();
  const { criarDecisao } = useDecisoes();
  
  // Verificar se é admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!error && !!data);
      }
    };
    checkAdmin();
  }, [user?.id]);
  
  const [formData, setFormData] = useState({
    numeroProcesso: "",
    comarca: "",
    orgao: "",
    varaTribunal: "",
    nomeCliente: "",
    tipoDecisao: "",
    nomeMagistrado: "",
    advogadoInterno: "",
    adverso: "",
    procedimentoObjeto: "",
    resumoDecisao: ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [clienteOutro, setClienteOutro] = useState("");
  const [showClienteOutro, setShowClienteOutro] = useState(false);
  const [comarcaOutra, setComarcaOutra] = useState("");
  const [showComarcaOutra, setShowComarcaOutra] = useState(false);
  const [varaOutra, setVaraOutra] = useState("");
  const [showVaraOutra, setShowVaraOutra] = useState(false);

  // Auto-save draft
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('decisao-draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('decisao-draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsedDraft }));
        toast({
          title: "Rascunho carregado",
          description: "Seus dados foram recuperados automaticamente.",
        });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [toast]);

  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'numeroProcesso':
        if (!value.trim()) error = 'Número do processo é obrigatório';
        break;
      case 'nomeCliente':
        if (!value.trim()) error = 'Nome do cliente é obrigatório';
        else if (value.trim().length < 3) error = 'Nome deve ter pelo menos 3 caracteres';
        break;
      case 'resumoDecisao':
        if (!value.trim()) error = 'Resumo da decisão é obrigatório';
        else if (value.trim().length < 20) error = 'Resumo deve ter pelo menos 20 caracteres';
        break;
      default:
        if (!value.trim()) error = 'Este campo é obrigatório';
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    
    if (!error && value.trim()) {
      setValidatedFields(prev => new Set(prev).add(field));
    } else {
      setValidatedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
    
    return !error;
  };

  const handleInputChange = async (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    
    // Se o cliente for "Outros", mostrar campo de texto
    if (field === 'nomeCliente') {
      if (value === 'Outros') {
        setShowClienteOutro(true);
      } else {
        setShowClienteOutro(false);
        setClienteOutro('');
      }
    }
    
    // Se a comarca for "Outra", mostrar campo de texto
    if (field === 'comarca') {
      if (value === 'Outra') {
        setShowComarcaOutra(true);
      } else {
        setShowComarcaOutra(false);
        setComarcaOutra('');
      }
    }
    
    // Se a vara for "Outra", mostrar campo de texto
    if (field === 'varaTribunal') {
      if (value === 'Outra') {
        setShowVaraOutra(true);
      } else {
        setShowVaraOutra(false);
        setVaraOutra('');
      }
    }
    
    // Validate after a short delay
    setTimeout(() => validateField(field, value), 300);
  };


  const validateAllFields = () => {
    const requiredFields = [
      'numeroProcesso', 'orgao', 'varaTribunal', 'nomeCliente', 
      'tipoDecisao', 'nomeMagistrado', 'advogadoInterno', 'adverso', 
      'procedimentoObjeto', 'resumoDecisao'
    ];

    let isValid = true;
    const newErrors: { [key: string]: string } = {};

    requiredFields.forEach(field => {
      const value = formData[field as keyof typeof formData] as string;
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const generatePreviewMessage = () => {
    return `
🏛️ *DECISÃO JUDICIAL COMUNICADA*

📋 *Processo:* ${formData.numeroProcesso}
⚖️ *Vara / Câmara / Turma:* ${formData.varaTribunal}
👤 *Cliente:* ${formData.nomeCliente}
📄 *Tipo:* ${formData.tipoDecisao}
👨‍💼 *Advogado:* ${formData.advogadoInterno}
🔄 *Parte Adversa:* ${formData.adverso}
🎯 *Objeto:* ${formData.procedimentoObjeto}

📝 *Resumo da Decisão:*
${formData.resumoDecisao}



---
*Calazans Rossi Advogados*
*Sistema de Comunicação Jurídica*
    `.trim();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const validatedData = decisaoSchema.parse(formData);

      // Usar o cliente digitado se for "Outros"
      const clienteFinal = formData.nomeCliente === 'Outros' ? clienteOutro : validatedData.nomeCliente;

      // Validar cliente personalizado
      if (formData.nomeCliente === 'Outros' && !clienteOutro.trim()) {
        toast({
          title: "Erro de validação",
          description: "Por favor, digite o nome do cliente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Salvar no banco de dados
      const decisao = await criarDecisao({
        numero_processo: validatedData.numeroProcesso,
        comarca: formData.comarca,
        orgao: validatedData.orgao,
        vara_tribunal: validatedData.varaTribunal,
        nome_cliente: clienteFinal,
        tipo_decisao: validatedData.tipoDecisao,
        nome_magistrado: validatedData.nomeMagistrado,
        advogado_interno: validatedData.advogadoInterno,
        adverso: validatedData.adverso,
        procedimento_objeto: validatedData.procedimentoObjeto,
        resumo_decisao: validatedData.resumoDecisao
      });

      const message = `*DECISÃO JUDICIAL - CALAZANS ROSSI ADVOGADOS*
    
*Protocolo:* ${decisao?.codigo_unico}
*Cliente:* ${clienteFinal}
*Processo:* ${validatedData.numeroProcesso}
*Órgão:* ${validatedData.orgao}
*Tipo de Decisão:* ${validatedData.tipoDecisao}
*Vara / Câmara / Turma:* ${validatedData.varaTribunal}
*Magistrado:* ${validatedData.nomeMagistrado}
*Advogado Responsável:* ${validatedData.advogadoInterno}
*Parte Adversa:* ${validatedData.adverso}
*Objeto / Procedimento:* ${validatedData.procedimentoObjeto}

*Resumo da Decisão:*
${validatedData.resumoDecisao}

`;

      openWhatsApp(message);
      
      setFormData({
        numeroProcesso: '',
        comarca: '',
        orgao: '',
        varaTribunal: '',
        nomeCliente: '',
        tipoDecisao: '',
        nomeMagistrado: '',
        advogadoInterno: '',
        adverso: '',
        procedimentoObjeto: '',
        resumoDecisao: ''
      });
      setErrors({});
      setValidatedFields(new Set());
      setClienteOutro('');
      setShowClienteOutro(false);
      setComarcaOutra('');
      setShowComarcaOutra(false);
      setVaraOutra('');
      setShowVaraOutra(false);
      localStorage.removeItem('decisao-draft');
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
          description: "Erro ao registrar decisão.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Decisão Judicial</h2>
          <p className="text-muted-foreground">
            {validatedFields.size > 0 && `${validatedFields.size} de 10 campos validados`}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Auto-salvo</span>
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
        </div>
      </div>
      <Card className="shadow-elevated card-gradient hover-lift">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 hero-gradient rounded-xl shadow-glow animate-float">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-4">
            <CardTitle className="text-4xl font-bold text-gradient animate-slide-up">
              Registro de Decisão Judicial
            </CardTitle>
            <CardDescription className="text-lg leading-relaxed max-w-2xl mx-auto animate-slide-up">
              Centralize suas decisões judiciais aqui e fortaleça nossa comunicação com o cliente.
            </CardDescription>
          </div>
          
          {Object.keys(errors).length > 0 && (
            <div className="bg-destructive-light/20 border border-destructive/20 rounded-lg p-4 animate-slide-in-left">
              <p className="text-sm text-destructive font-medium">
                Por favor, corrija os erros nos campos destacados antes de continuar.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numeroProcesso">
                Número do Processo <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="numeroProcesso"
                  value={formData.numeroProcesso}
                  onChange={(e) => handleInputChange('numeroProcesso', e.target.value)}
                  placeholder="Digite o número do processo (20 dígitos)"
                  className={errors.numeroProcesso ? "border-destructive" : validatedFields.has('numeroProcesso') ? "border-success" : ""}
                />
              </div>
              {errors.numeroProcesso && (
                <p className="text-xs text-destructive">{errors.numeroProcesso}</p>
              )}
              {validatedFields.has('numeroProcesso') && !errors.numeroProcesso && (
                <p className="text-xs text-success">✓ Campo validado</p>
              )}
            </div>

            {/* Comarca - COM GESTÃO ADMIN */}
            <div className="space-y-2">
              <Label htmlFor="comarca">
                Comarca <span className="text-destructive">*</span>
              </Label>
              <SelectWithAdminEdit
                optionSetKey="comarcas"
                value={formData.comarca}
                onValueChange={(value) => handleInputChange('comarca', value)}
                placeholder="Selecione a comarca"
                isAdmin={isAdmin}
                label="Comarca"
                className={errors.comarca ? "border-destructive" : validatedFields.has('comarca') ? "border-success" : ""}
              />
              {showComarcaOutra && (
                <Input
                  placeholder="Digite o nome da comarca"
                  value={comarcaOutra}
                  onChange={(e) => setComarcaOutra(e.target.value)}
                  className="mt-2"
                />
              )}
              {errors.comarca && (
                <p className="text-xs text-destructive">{errors.comarca}</p>
              )}
              {validatedFields.has('comarca') && !errors.comarca && (
                <p className="text-xs text-success">✓ Campo validado</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgao">
                Órgão <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={ORGAOS_LIST.map(orgao => ({ value: orgao, label: orgao }))}
                value={formData.orgao}
                onValueChange={(value) => handleInputChange('orgao', value)}
                placeholder="Selecione o órgão"
                searchPlaceholder="Buscar órgão..."
                emptyMessage="Nenhum órgão encontrado."
                className={errors.orgao ? "border-destructive" : validatedFields.has('orgao') ? "border-success" : ""}
              />
              {errors.orgao && (
                <p className="text-xs text-destructive">{errors.orgao}</p>
              )}
              {validatedFields.has('orgao') && !errors.orgao && (
                <p className="text-xs text-success">✓ Campo validado</p>
              )}
            </div>

            {/* Vara / Câmara / Turma - COM GESTÃO ADMIN */}
            <div className="space-y-2">
              <Label htmlFor="varaTribunal">
                Vara / Câmara / Turma <span className="text-destructive">*</span>
              </Label>
              <SelectWithAdminEdit
                optionSetKey="varas_camaras_turmas"
                value={formData.varaTribunal}
                onValueChange={(value) => handleInputChange('varaTribunal', value)}
                placeholder="Selecione a vara/câmara/turma"
                isAdmin={isAdmin}
                label="Vara / Câmara / Turma"
                className={errors.varaTribunal ? "border-destructive" : validatedFields.has('varaTribunal') ? "border-success" : ""}
              />
              {showVaraOutra && (
                <Input
                  placeholder="Digite o nome da vara/câmara/turma"
                  value={varaOutra}
                  onChange={(e) => setVaraOutra(e.target.value)}
                  className="mt-2"
                />
              )}
              {errors.varaTribunal && (
                <p className="text-xs text-destructive">{errors.varaTribunal}</p>
              )}
              {validatedFields.has('varaTribunal') && !errors.varaTribunal && (
                <p className="text-xs text-success">✓ Campo validado</p>
              )}
            </div>

            {/* Nome do Cliente - Combobox */}
            <div className="space-y-2">
              <Label htmlFor="nomeCliente">
                Nome do Cliente <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={clientes.map(c => ({ value: c, label: c }))}
                value={formData.nomeCliente}
                onValueChange={(value) => handleInputChange('nomeCliente', value)}
                placeholder="Selecione o cliente"
                searchPlaceholder="Buscar cliente..."
                emptyMessage="Nenhum cliente encontrado."
                className={errors.nomeCliente ? "border-destructive" : validatedFields.has('nomeCliente') ? "border-success" : ""}
              />
              
              {showClienteOutro && (
                <Input
                  placeholder="Digite o nome do cliente"
                  value={clienteOutro}
                  onChange={(e) => setClienteOutro(e.target.value)}
                  className="mt-2"
                />
              )}
              
              {errors.nomeCliente && (
                <p className="text-xs text-destructive">{errors.nomeCliente}</p>
              )}
              {validatedFields.has('nomeCliente') && !errors.nomeCliente && (
                <p className="text-xs text-success">✓ Campo validado</p>
              )}
            </div>

            <FormField
              type="input"
              id="adverso"
              label="Adverso"
              value={formData.adverso}
              onChange={(value) => handleInputChange('adverso', value)}
              placeholder="Nome da parte adversa"
              required
              error={errors.adverso}
              success={validatedFields.has('adverso')}
            />

            {/* Decisão (Sentença / Acórdão) - Combobox */}
            <div className="space-y-2">
              <Label htmlFor="tipoDecisao">
                Decisão (Sentença / Acórdão) <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={[
                  { value: 'acordao-favoravel', label: 'Acórdão Favorável' },
                  { value: 'acordao-parcialmente-favoravel', label: 'Acórdão Parcialmente Favorável' },
                  { value: 'acordao-desfavoravel', label: 'Acórdão Desfavorável' },
                  { value: 'sentenca-favoravel', label: 'Sentença / Decisão Favorável' },
                  { value: 'sentenca-parcialmente-favoravel', label: 'Sentença / Decisão Parcialmente Favorável' },
                  { value: 'sentenca-desfavoravel', label: 'Sentença / Decisão Desfavorável' },
                  { value: 'liberacao-valor-bloqueado', label: 'Liberação de Valor Bloqueado' }
                ]}
                value={formData.tipoDecisao}
                onValueChange={(value) => handleInputChange('tipoDecisao', value)}
                placeholder="Selecione o tipo de decisão"
                searchPlaceholder="Buscar tipo de decisão..."
                emptyMessage="Nenhum tipo encontrado."
                className={errors.tipoDecisao ? "border-destructive" : validatedFields.has('tipoDecisao') ? "border-success" : ""}
              />
              {errors.tipoDecisao && (
                <p className="text-xs text-destructive">{errors.tipoDecisao}</p>
              )}
              {validatedFields.has('tipoDecisao') && !errors.tipoDecisao && (
                <p className="text-xs text-success">✓ Campo validado</p>
              )}
            </div>

            {/* Nome do Magistrado - COM GESTÃO ADMIN */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nome do Magistrado <span className="text-destructive">*</span>
              </label>
              <SelectWithAdminEdit
                optionSetKey="magistrados"
                value={formData.nomeMagistrado}
                onValueChange={(value) => handleInputChange('nomeMagistrado', value)}
                placeholder="Selecione o magistrado"
                isAdmin={isAdmin}
                className={errors.nomeMagistrado ? "border-destructive" : validatedFields.has('nomeMagistrado') ? "border-success" : ""}
              />
              <div className="h-4">
                {errors.nomeMagistrado && (
                  <p className="text-xs text-destructive">{errors.nomeMagistrado}</p>
                )}
                {validatedFields.has('nomeMagistrado') && !errors.nomeMagistrado && (
                  <p className="text-xs text-success">✓ Campo validado</p>
                )}
              </div>
            </div>

            <FormField
              type="input"
              id="advogadoInterno"
              label="Adv. Jurídico Interno"
              value={formData.advogadoInterno}
              onChange={(value) => handleInputChange('advogadoInterno', value)}
              placeholder="Nome do advogado responsável"
              required
              error={errors.advogadoInterno}
              success={validatedFields.has('advogadoInterno')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Objeto / Procedimento <span className="text-destructive">*</span>
            </label>
            <SelectWithAdminEdit
              optionSetKey="objeto-procedimento"
              value={formData.procedimentoObjeto}
              onValueChange={(value) => handleInputChange('procedimentoObjeto', value)}
              placeholder="Selecione o objeto/procedimento"
              isAdmin={isAdmin}
              className={errors.procedimentoObjeto ? "border-destructive" : validatedFields.has('procedimentoObjeto') ? "border-success" : ""}
            />
            {errors.procedimentoObjeto && (
              <p className="text-xs text-destructive mt-1">{errors.procedimentoObjeto}</p>
            )}
            {validatedFields.has('procedimentoObjeto') && !errors.procedimentoObjeto && (
              <p className="text-xs text-success mt-1">✓ Campo validado</p>
            )}
          </div>

          <FormField
            type="textarea"
            id="resumoDecisao"
            label="Resumo da Decisão"
            value={formData.resumoDecisao}
            onChange={(value) => handleInputChange('resumoDecisao', value)}
            placeholder="Descreva brevemente o conteúdo da decisão"
            rows={4}
            required
            error={errors.resumoDecisao}
            success={validatedFields.has('resumoDecisao')}
          />


          {showPreview && (
            <div className="space-y-4 animate-scale-in">
              <div className="bg-muted/50 rounded-lg p-4 border">
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview da Mensagem
                </h4>
                <div className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded border">
                  {generatePreviewMessage()}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="lg"
              className="hover-lift"
            >
              <Eye className="h-5 w-5 mr-2" />
              {showPreview ? "Ocultar" : "Visualizar"} Preview
            </Button>
            
            <LoadingButton
              onClick={() => handleSubmit()}
              loading={loading}
              loadingText="Enviando pelo WhatsApp..."
              className="w-full hover-lift"
              size="lg"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Enviar pelo WhatsApp
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DecisaoJudicialForm;