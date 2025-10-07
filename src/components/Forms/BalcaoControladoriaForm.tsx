import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { DateField } from "@/components/ui/date-field";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCodigo } from "@/lib/utils";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useSolicitacoes, NovasolicitacaoControladoria } from "@/hooks/useSolicitacoes";
import { z } from "zod";

const balcaoSchema = z.object({
  nomeSolicitante: z.string().trim().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  numeroProcesso: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  cliente: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  tribunalOrgao: z.string().trim().min(1, "Campo obrigatório").max(100, "Máximo 100 caracteres"),
  prazoRetorno: z.string().min(1, "Campo obrigatório"),
  solicitacao: z.string().trim().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres")
});

const BalcaoControladoriaForm = () => {
  const { toast } = useToast();
  const { criarSolicitacao } = useSolicitacoes();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nomeSolicitante: "",
    numeroProcesso: "",
    cliente: "",
    tribunalOrgao: "",
    prazoRetorno: "",
    solicitacao: ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [clientes] = useState<string[]>([
    "Affiance Life",
    "Casu - UFMG",
    "Cemig Saúde",
    "Confiança LTDA",
    "Hapvida Assistência Médica LTDA",
    "Samp ES Assistência Médica",
    "Unimed Curvelo",
    "Unimed Divinópolis",
    "Unimed Itaúna",
    "Unimed Norte Fluminense",
    "Unimed São José do Rio Preto",
    "Unimed Vertente do Caparaó",
    "Unimed Vitória"
  ]);
  const [clienteOutro, setClienteOutro] = useState("");
  const [showClienteOutro, setShowClienteOutro] = useState(false);

  // Auto-save draft
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('balcao-controladoria-draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Buscar usuários registrados
  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .order('nome');
      
      if (data && !error) {
        // Remover asteriscos dos nomes
        const usuariosLimpos = data.map(u => ({
          ...u,
          nome: u.nome?.replace(/\*+$/, '').trim() || ''
        })).filter(u => u.nome); // Remover usuários sem nome
        setUsuarios(usuariosLimpos);
      }
    };
    
    fetchUsuarios();
  }, []);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('balcao-controladoria-draft');
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
      case 'numeroProcesso':
        if (!value.trim()) error = 'Número do processo é obrigatório';
        break;
      case 'cliente':
        if (!value.trim()) error = 'Cliente é obrigatório';
        break;
      case 'tribunalOrgao':
        if (!value.trim()) error = 'Tribunal/Órgão é obrigatório';
        break;
      case 'prazoRetorno':
        if (!value.trim()) error = 'Prazo para retorno é obrigatório';
        break;
      case 'solicitacao':
        if (!value.trim()) error = 'Solicitação é obrigatória';
        else if (value.trim().length < 10) error = 'Solicitação deve ter pelo menos 10 caracteres';
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
    
    // Se o cliente for "Outros", mostrar campo de texto
    if (field === 'cliente') {
      if (value === 'Outros') {
        setShowClienteOutro(true);
      } else {
        setShowClienteOutro(false);
        setClienteOutro('');
      }
    }
    
    // Validate after a short delay
    setTimeout(() => validateField(field, value), 300);
  };


  const validateAllFields = () => {
    const requiredFields = [
      'nomeSolicitante', 'numeroProcesso', 'cliente', 
      'tribunalOrgao', 'prazoRetorno', 'solicitacao'
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


  const gerarCodigoLocal = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CTRL-${day}-${month}-${year}-${seq}`;
  };

  const uploadArquivos = async (codigoUnico: string): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploadingFiles(true);
    const uploadedUrls: string[] = [];

    try {
      console.log('📤 Iniciando upload de', selectedFiles.length, 'arquivo(s)...');
      
      for (const file of selectedFiles) {
        const fileName = `${codigoUnico}/${Date.now()}-${file.name}`;
        
        console.log('📁 Fazendo upload do arquivo:', fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('solicitacoes-anexos')
          .upload(fileName, file);

        if (uploadError) {
          console.error('❌ Erro ao fazer upload:', uploadError);
          toast({
            title: "Erro no upload",
            description: `Não foi possível enviar o arquivo ${file.name}: ${uploadError.message}`,
            variant: "destructive"
          });
          continue;
        }

        console.log('✅ Upload concluído:', uploadData);

        // Obter URL pública do arquivo
        const { data: urlData } = await supabase.storage
          .from('solicitacoes-anexos')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          console.log('🔗 URL pública gerada:', urlData.publicUrl);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      console.log('✅ Upload finalizado. Total de URLs:', uploadedUrls.length);
      return uploadedUrls;
    } catch (error) {
      console.error('❌ Erro durante upload:', error);
      return uploadedUrls;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const validatedData = balcaoSchema.parse(formData);

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

      // Tenta salvar no Supabase; se não houver, gera código local e prossegue
      let codigoUnico = gerarCodigoLocal();

      // Upload dos arquivos primeiro
      const anexosUrls = await uploadArquivos(codigoUnico);
      
      console.log('📋 Dados da solicitação antes de salvar:', {
        codigo: codigoUnico,
        anexos: anexosUrls,
        totalAnexos: anexosUrls.length
      });

      const solicitacaoData: NovasolicitacaoControladoria = {
        nome_solicitante: validatedData.nomeSolicitante,
        numero_processo: validatedData.numeroProcesso || '',
        cliente: clienteFinal,
        objeto_solicitacao: validatedData.tribunalOrgao,
        descricao_detalhada: validatedData.solicitacao,
        user_id: user?.id || '',
        anexos: anexosUrls.length > 0 ? anexosUrls : [],
        prazo_retorno: validatedData.prazoRetorno
      };
      
      const codigoSalvo = await criarSolicitacao(solicitacaoData);

      if (codigoSalvo) {
        codigoUnico = codigoSalvo;
        
        const displayCodigo = formatCodigo(codigoUnico);
        toast({
          title: "Solicitação registrada com sucesso!",
          description: `Código: ${displayCodigo}. Sua solicitação foi salva no sistema.`,
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível registrar a solicitação. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Reset form
      setFormData({
        nomeSolicitante: "",
        numeroProcesso: "",
        cliente: "",
        tribunalOrgao: "",
        prazoRetorno: "",
        solicitacao: ""
      });
      setSelectedFiles([]);
      setClienteOutro('');
      setShowClienteOutro(false);
      setErrors({});
      setValidatedFields(new Set());
      localStorage.removeItem('balcao-controladoria-draft');
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        console.error('Erro ao enviar solicitação:', error);
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro ao registrar a solicitação. Tente novamente.",
          variant: "destructive"
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
          <h2 className="text-2xl font-bold text-foreground">Balcão da Controladoria</h2>
          <p className="text-muted-foreground">
            {validatedFields.size > 0 && `${validatedFields.size} de 6 campos validados`}
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
              <Building className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-4">
            <CardTitle className="text-4xl font-bold text-gradient animate-slide-up">
              Solicitação ao Balcão da Controladoria
            </CardTitle>
            <CardDescription className="text-lg leading-relaxed max-w-2xl mx-auto animate-slide-up">
              Registre suas solicitações para o balcão da controladoria e mantenha o controle dos prazos.
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Solicitante - Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nome do Solicitante <span className="text-destructive">*</span>
              </label>
              <Select 
                value={formData.nomeSolicitante} 
                onValueChange={(value) => handleInputChange('nomeSolicitante', value)}
              >
                <SelectTrigger className={`h-9 ${errors.nomeSolicitante ? "border-destructive" : validatedFields.has('nomeSolicitante') ? "border-success" : ""}`}>
                  <SelectValue placeholder="Selecione o solicitante" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background max-h-60 overflow-y-auto">
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
            </div>

            <FormField
              type="input"
              id="numeroProcesso"
              label="Número do Processo"
              value={formData.numeroProcesso}
              onChange={(value) => handleInputChange('numeroProcesso', value)}
              placeholder="Digite o número do processo"
              required
              error={errors.numeroProcesso}
              success={validatedFields.has('numeroProcesso')}
            />

            {/* Cliente - Select com opção Outros */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Cliente <span className="text-destructive">*</span>
              </label>
              <Select 
                value={formData.cliente} 
                onValueChange={(value) => handleInputChange('cliente', value)}
              >
                <SelectTrigger className={`h-9 ${errors.cliente ? "border-destructive" : validatedFields.has('cliente') ? "border-success" : ""}`}>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background max-h-60 overflow-y-auto">
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
                  ))}
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {showClienteOutro && (
                <Input
                  placeholder="Digite o nome do cliente"
                  value={clienteOutro}
                  onChange={(e) => setClienteOutro(e.target.value)}
                  className="mt-2 h-9"
                />
              )}
              {errors.cliente && (
                <p className="text-xs text-destructive">{errors.cliente}</p>
              )}
            </div>

            <FormField
              type="input"
              id="tribunalOrgao"
              label="Tribunal / Órgão"
              value={formData.tribunalOrgao}
              onChange={(value) => handleInputChange('tribunalOrgao', value)}
              placeholder="Ex: TJ-SP, STJ, Tribunal Regional"
              required
              error={errors.tribunalOrgao}
              success={validatedFields.has('tribunalOrgao')}
            />

            {/* Prazo Para Retorno */}
            <div className="md:col-span-1">
            </div>
          </div>

          <DateField
            label="Prazo Para Retorno"
            id="prazoRetorno"
            value={formData.prazoRetorno}
            onChange={(value) => handleInputChange('prazoRetorno', value)}
            placeholder="Selecione o prazo para retorno"
            required
            error={errors.prazoRetorno}
            success={validatedFields.has('prazoRetorno')}
          />

          <FormField
            type="textarea"
            id="solicitacao"
            label="Solicitação"
            value={formData.solicitacao}
            onChange={(value) => handleInputChange('solicitacao', value)}
            placeholder="Descreva detalhadamente sua solicitação"
            rows={4}
            required
            error={errors.solicitacao}
            success={validatedFields.has('solicitacao')}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-2">
              <Paperclip className="h-3.5 w-3.5" />
              Anexar Arquivos (Opcional)
            </label>
            <FileUpload
              files={selectedFiles}
              onFilesChange={setSelectedFiles}
              maxFiles={5}
              maxSize={10}
              acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx']}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 5 arquivos, 10MB cada
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <LoadingButton
              onClick={() => handleSubmit()}
              loading={loading || uploadingFiles}
              loadingText={uploadingFiles ? "Enviando..." : "Salvando..."}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Building className="h-4 w-4 mr-2" />
              Enviar Solicitação
              {selectedFiles.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-primary-foreground/20 rounded-full text-xs">
                  {selectedFiles.length}
                </span>
              )}
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalcaoControladoriaForm;