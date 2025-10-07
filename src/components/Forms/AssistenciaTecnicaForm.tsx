import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, MessageCircle, Mail, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { openWhatsApp } from "@/lib/utils";
import { useUsuarios } from "@/hooks/useUsuarios";
import { z } from "zod";

const assistenciaSchema = z.object({
  nomeSolicitante: z.string().trim().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  solicitacaoProblema: z.string().trim().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres"),
  nivelUrgencia: z.string().min(1, "Campo obrigatório")
});

const AssistenciaTecnicaForm = () => {
  const { toast } = useToast();
  const { usuarios } = useUsuarios();
  const [formData, setFormData] = useState({
    nomeSolicitante: "",
    solicitacaoProblema: "",
    nivelUrgencia: ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  // Auto-save draft
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('assistencia-draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('assistencia-draft');
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
      case 'nomeSolicitante':
        if (!value.trim()) error = 'Nome do solicitante é obrigatório';
        else if (value.trim().length < 3) error = 'Nome deve ter pelo menos 3 caracteres';
        break;
      case 'solicitacaoProblema':
        if (!value.trim()) error = 'Solicitação/Problema é obrigatório';
        else if (value.trim().length < 10) error = 'Descrição deve ter pelo menos 10 caracteres';
        break;
      case 'nivelUrgencia':
        if (!value.trim()) error = 'Nível de urgência é obrigatório';
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate after a short delay
    setTimeout(() => validateField(field, value), 300);
  };

  const validateAllFields = () => {
    const requiredFields = ['nomeSolicitante', 'solicitacaoProblema', 'nivelUrgencia'];

    let isValid = true;
    requiredFields.forEach(field => {
      const value = formData[field as keyof typeof formData] as string;
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const generatePreviewMessage = () => {
    const urgencyEmoji = {
      'Alta': '🔴',
      'Média': '🟡',
      'Baixa': '🟢'
    };

    return `
🛠️ *ASSISTÊNCIA TÉCNICA SOLICITADA*

👤 *Solicitante:* ${formData.nomeSolicitante}
${urgencyEmoji[formData.nivelUrgencia as keyof typeof urgencyEmoji] || '⚪'} *Urgência:* ${formData.nivelUrgencia}

📝 *Solicitação/Problema:*
${formData.solicitacaoProblema}

---
*Calazans Rossi Advogados*
*Sistema de Comunicação Jurídica*
    `.trim();
  };

  const handleSubmit = (type: 'whatsapp' | 'email') => {
    try {
      const validatedData = assistenciaSchema.parse(formData);

      const urgencyEmoji = {
        'Alta': '🔴',
        'Média': '🟡', 
        'Baixa': '🟢'
      };

      const message = `*ASSISTÊNCIA TÉCNICA - CALAZANS ROSSI ADVOGADOS*
    
*Solicitante:* ${validatedData.nomeSolicitante}
*Nível de Urgência:* ${urgencyEmoji[validatedData.nivelUrgencia as keyof typeof urgencyEmoji]} ${validatedData.nivelUrgencia}

*Solicitação/Problema Técnico:*
${validatedData.solicitacaoProblema}`;

      openWhatsApp(message);

      toast({
        title: "Solicitação enviada!",
        description: `Assistência técnica preparada para envio por WhatsApp!`,
      });
      
      setFormData({
        nomeSolicitante: '',
        solicitacaoProblema: '',
        nivelUrgencia: ''
      });
      setErrors({});
      setValidatedFields(new Set());
      localStorage.removeItem('assistencia-draft');
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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assistência Técnica</h2>
          <p className="text-muted-foreground">
            {validatedFields.size > 0 && `${validatedFields.size} de 3 campos validados`}
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
              <Settings className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-4">
            <CardTitle className="text-4xl font-bold text-gradient animate-slide-up">
              Solicitação de Assistência Técnica
            </CardTitle>
            <CardDescription className="text-lg leading-relaxed max-w-2xl mx-auto animate-slide-up">
              Registre aqui suas solicitações de suporte técnico para agilizar o atendimento.
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
            {/* Nome do Solicitante - Select */}
            <div className="space-y-2">
              <Label htmlFor="nomeSolicitante">
                Nome do Solicitante <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.nomeSolicitante} 
                onValueChange={(value) => handleInputChange('nomeSolicitante', value)}
              >
                <SelectTrigger className={errors.nomeSolicitante ? "border-destructive" : validatedFields.has('nomeSolicitante') ? "border-success" : ""}>
                  <SelectValue placeholder="Selecione o solicitante" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.nome}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nomeSolicitante && (
                <p className="text-xs text-destructive">{errors.nomeSolicitante}</p>
              )}
              {validatedFields.has('nomeSolicitante') && !errors.nomeSolicitante && (
                <p className="text-xs text-success">✓ Campo validado</p>
              )}
            </div>

            <FormField
              type="select"
              id="nivelUrgencia"
              label="Nível de Urgência"
              value={formData.nivelUrgencia}
              onChange={(value) => handleInputChange('nivelUrgencia', value)}
              placeholder="Selecione o nível de urgência"
              required
              error={errors.nivelUrgencia}
              success={validatedFields.has('nivelUrgencia')}
              options={[
                { value: 'Alta', label: '🔴 Alta' },
                { value: 'Média', label: '🟡 Média' },
                { value: 'Baixa', label: '🟢 Baixa' }
              ]}
            />
          </div>

          <FormField
            type="textarea"
            id="solicitacaoProblema"
            label="Solicitação / Problema Técnico"
            value={formData.solicitacaoProblema}
            onChange={(value) => handleInputChange('solicitacaoProblema', value)}
            placeholder="Descreva detalhadamente sua solicitação ou o problema técnico encontrado"
            rows={6}
            required
            error={errors.solicitacaoProblema}
            success={validatedFields.has('solicitacaoProblema')}
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
            
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <LoadingButton
                onClick={() => handleSubmit('whatsapp')}
                loading={loading}
                loadingText="Enviando para WhatsApp..."
                className="flex-1 hero-gradient hover:bg-primary-hover text-primary-foreground"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Enviar para WhatsApp
              </LoadingButton>
              
              <LoadingButton
                onClick={() => handleSubmit('email')}
                loading={loading}
                loadingText="Enviando por E-mail..."
                variant="outline"
                className="flex-1 hover-lift"
                size="lg"
              >
                <Mail className="h-5 w-5 mr-2" />
                Enviar por E-mail
              </LoadingButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistenciaTecnicaForm;