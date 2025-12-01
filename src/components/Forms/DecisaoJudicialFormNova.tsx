import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Upload, Sparkles, Calculator, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SelectWithAdminEdit } from "@/components/Admin/SelectWithAdminEdit";
import { Combobox } from "@/components/ui/combobox";
import { DragDropUpload } from "./DragDropUpload";
import { PdfPreview } from "./PdfPreview";
import { useClientes } from "@/hooks/useClientes";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useCNJSearch } from "@/hooks/useCNJSearch";
import { openWhatsApp } from "@/lib/utils";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useDecisoes } from "@/hooks/useDecisoes";
import { z } from "zod";
// PDF text extraction (client-side)
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl as unknown as string;

const decisaoSchema = z.object({
  numeroProcesso: z.string().trim().min(1, "Número do processo é obrigatório"),
  autor: z.string().trim().min(1, "Autor é obrigatório"),
  reu: z.string().trim().min(1, "Réu é obrigatório"),
  orgao: z.string().trim().min(1, "Tribunal é obrigatório"),
  varaTribunal: z.string().trim().min(1, "Câmara/Turma é obrigatória"),
  nomeCliente: z.string().trim().min(3, "Nome do cliente é obrigatório"),
  poloCliente: z.string().min(1, "Polo do cliente é obrigatório"),
  tipoDecisao: z.string().min(1, "Tipo de decisão é obrigatório"),
  resultado: z.string().min(1, "Resultado é obrigatório"),
  dataDecisao: z.string().min(1, "Data da decisão é obrigatória"),
  nomeMagistrado: z.string().trim().min(1, "Nome do Relator é obrigatório"),
  advogadoInterno: z.string().trim().min(1, "Advogado interno é obrigatório"),
  adverso: z.string().trim().min(1, "Parte adversa é obrigatória"),
  procedimentoObjeto: z.string().trim().min(1, "Assunto/Tema é obrigatório"),
  valorDisputa: z.number().min(0, "Valor em Disputa é obrigatório e deve ser positivo"),
  economiaGerada: z.number().min(0, "Economia Gerada é obrigatória e deve ser positiva"),
  resumoDecisao: z.string().trim().min(20, "Resumo deve ter pelo menos 20 caracteres")
});

const DecisaoJudicialFormNova = () => {
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { usuarios } = useUsuarios();
  const { user } = useAuth();
  const { criarDecisao } = useDecisoes();
  const { buscarProcesso, loading: loadingCNJ } = useCNJSearch();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [camarasDisponiveis, setCamarasDisponiveis] = useState<string[]>([]);
  const [magistradosDisponiveis, setMagistradosDisponiveis] = useState<string[]>([]);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!data);
      }
    };
    checkAdmin();
  }, [user?.id]);

  // Carregar câmaras/turmas únicas do banco
  useEffect(() => {
    const fetchCamaras = async () => {
      const { data } = await supabase
        .from('decisoes_judiciais')
        .select('vara_tribunal')
        .not('vara_tribunal', 'is', null);
      
      if (data) {
        const camarasUnicas = [...new Set(data.map(d => d.vara_tribunal).filter(Boolean))];
        setCamarasDisponiveis(camarasUnicas.sort());
      }
    };
    fetchCamaras();
  }, []);

  // Carregar magistrados únicos do banco
  useEffect(() => {
    const fetchMagistrados = async () => {
      const { data } = await supabase
        .from('decisoes_judiciais')
        .select('nome_magistrado')
        .not('nome_magistrado', 'is', null);
      
      if (data) {
        const magistradosUnicos = [...new Set(data.map(d => d.nome_magistrado).filter(Boolean))];
        setMagistradosDisponiveis(magistradosUnicos.sort());
      }
    };
    fetchMagistrados();
  }, []);
  
  const [formData, setFormData] = useState({
    numeroProcesso: "",
    autor: "",
    reu: "",
    orgao: "",
    varaTribunal: "",
    nomeCliente: "",
    poloCliente: "",
    tipoDecisao: "",
    resultado: "",
    dataDecisao: "",
    nomeMagistrado: "",
    advogadoInterno: "",
    adverso: "",
    procedimentoObjeto: "",
    valorDisputa: 0,
    economiaGerada: 0,
    percentualExonerado: 0,
    montanteReconhecido: 0,
    resumoDecisao: "",
    sharepointDriveId: "",
    sharepointItemId: ""
  });

  const [arquivoDecisao, setArquivoDecisao] = useState<File | null>(null);
  const [uploadandoArquivo, setUploadandoArquivo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState<any>(null);
  const [scoresConfianca, setScoresConfianca] = useState<Record<string, number>>({});
  const [urlArquivoSharePoint, setUrlArquivoSharePoint] = useState<string>("");
  const [nomeArquivoSharePoint, setNomeArquivoSharePoint] = useState<string>("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [buscandoProcesso, setBuscandoProcesso] = useState(false);

  // Função para limpar todos os campos
  const limparFormulario = () => {
    setFormData({
      numeroProcesso: "",
      autor: "",
      reu: "",
      orgao: "",
      varaTribunal: "",
      nomeCliente: "",
      poloCliente: "",
      tipoDecisao: "",
      resultado: "",
      dataDecisao: "",
      nomeMagistrado: "",
      advogadoInterno: "",
      adverso: "",
      procedimentoObjeto: "",
      valorDisputa: 0,
      economiaGerada: 0,
      percentualExonerado: 0,
      montanteReconhecido: 0,
      resumoDecisao: "",
      sharepointDriveId: "",
      sharepointItemId: ""
    });
    setArquivoDecisao(null);
    setUrlArquivoSharePoint("");
    setNomeArquivoSharePoint("");
    setDadosExtraidos(null);
    setScoresConfianca({});
    setMostrarFormulario(false);
    setUploadProgress(0);
    setBuscandoProcesso(false);
  };

  // Limpar formulário ao montar o componente (atualização de página)
  useEffect(() => {
    limparFormulario();
  }, []);

  // Busca automática de processo quando número é digitado
  useEffect(() => {
    const timer = setTimeout(async () => {
      const numeroLimpo = formData.numeroProcesso.replace(/\D/g, '');
      
      // Só busca se tiver pelo menos 20 dígitos (padrão CNJ)
      if (numeroLimpo.length >= 20 && !buscandoProcesso) {
        setBuscandoProcesso(true);
        const resultado = await buscarProcesso(formData.numeroProcesso);
        setBuscandoProcesso(false);
        
        if (resultado) {
          // Preencher campos automaticamente com dados encontrados
          setFormData(prev => ({
            ...prev,
            orgao: resultado.tribunal || prev.orgao,
            varaTribunal: resultado.orgaoJulgador || prev.varaTribunal,
            procedimentoObjeto: resultado.assuntos || prev.procedimentoObjeto,
            // Preencher autor com primeira parte do polo ativo
            autor: resultado.partesPoloAtivo[0] || prev.autor,
            // Preencher réu com primeira parte do polo passivo
            reu: resultado.partesPoloPassivo[0] || prev.reu,
          }));
        }
      }
    }, 1000); // Debounce de 1 segundo

    return () => clearTimeout(timer);
  }, [formData.numeroProcesso]);

  // Helper para renderizar badge de confiança
  const renderConfidenceBadge = (fieldName: string, value: any) => {
    const confidence = scoresConfianca[`${fieldName}Confianca`];
    if (!confidence || !value) return null;
    
    const getColor = (score: number) => {
      if (score >= 0.9) return 'bg-green-500/10 text-green-700 border-green-200';
      if (score >= 0.7) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      return 'bg-red-500/10 text-red-700 border-red-200';
    };
    
    const getIcon = (score: number) => {
      if (score >= 0.9) return '✓';
      if (score >= 0.7) return '⚠';
      return '!';
    };
    
    return (
      <Badge variant="outline" className={`ml-2 ${getColor(confidence)}`}>
        {getIcon(confidence)} {Math.round(confidence * 100)}%
      </Badge>
    );
  };

  // Helpers
  const toNumber = (v: any, fallback: number) => {
    if (v === null || v === undefined || v === "") return fallback;
    if (typeof v === 'number') return isNaN(v) ? fallback : v;
    const cleaned = String(v).replace(/[^\d.,-]/g, '').replace(/\.(?=.*\.)/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? fallback : n;
  };
  const normalize = (s?: string | null) => (s ?? '').toString().trim();
  const normalizeTipoDecisao = (s?: string | null) => {
    const v = normalize(s).toLowerCase();
    if (!v) return '';
    if (v.includes('acord')) return 'Acórdão';
    if (v.includes('senten')) return 'Sentença';
    if (v.includes('monocr') || v.includes('efeito susp')) return 'Decisão Monocrática (Efeito Suspensivo)';
    return '';
  };
  const normalizeResultado = (s?: string | null) => {
    const v = normalize(s).toLowerCase();
    if (!v) return '';
    if (v.includes('parcial')) return 'Parcialmente Favorável';
    if (v.includes('desfav') || v.includes('nega')) return 'Desfavorável';
    if (v.includes('favor')) return 'Favorável';
    return '';
  };
  const normalizePolo = (s?: string | null) => {
    const v = normalize(s).toLowerCase();
    if (!v) return '';
    if (v.includes('ativo') || v.includes('autor')) return 'Ativo';
    if (v.includes('passivo') || v.includes('réu') || v.includes('reu')) return 'Passivo';
    return '';
  };
  const toISODate = (s?: string | null, fallback = '') => {
    const v = normalize(s);
    if (!v) return fallback;
    // already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // dd/mm/yyyy or dd-mm-yyyy
    const m = v.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m) {
      const [_, d, mo, y] = m;
      return `${y}-${mo}-${d}`;
    }
    // try Date parse
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString().slice(0,10);
      return iso;
    }
    return fallback;
  };
  // Leitura de texto local para IA
  const extractTextFromFile = async (file: File): Promise<string | null> => {
    try {
      if (file.type === 'application/pdf') {
        const data = await file.arrayBuffer();
        const pdf = await getDocument({ data }).promise;
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 50);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content: any = await page.getTextContent();
          const pageText = (content.items || []).map((it: any) => it?.str || '').join(' ');
          fullText += pageText + '\n';
        }
        return fullText;
      }
      if (file.type.startsWith('text/')) {
        return await file.text();
      }
      return null;
    } catch (e) {
      console.warn('Falha ao extrair texto local do arquivo:', e);
      return null;
    }
  };

  const handleFileSelect = async (file: File) => {
    setArquivoDecisao(file);
    setUploadandoArquivo(true);
    setUploadProgress(0);

    try {
      // Preparar metadados para SharePoint
      const metadata = {
        nomeCliente: formData.nomeCliente || 'Cliente',
        numeroProcesso: formData.numeroProcesso || 'Processo',
        tipoDecisao: formData.tipoDecisao || 'Decisao',
        ano: new Date().getFullYear().toString(),
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        iniciaisAdvogado: user?.user_metadata?.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'XX'
      };

      // Criar FormData para envio
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('metadata', JSON.stringify(metadata));

      toast({
        title: "Enviando para SharePoint",
        description: "Fazendo upload do arquivo..."
      });

      setUploadProgress(30);

      // Fazer upload direto para SharePoint via edge function usando fetch
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/upload-decisao-sharepoint`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: uploadFormData
        }
      );

      setUploadProgress(60);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro no upload');
      }

      const uploadData = await response.json();

      if (!uploadData?.success) {
        throw new Error(uploadData?.error || "Erro desconhecido no upload");
      }

      console.log('Upload para SharePoint concluído:', uploadData);
      setUploadProgress(80);

      // Armazenar URL do arquivo
      setUrlArquivoSharePoint(uploadData.fileUrl || '');
      setNomeArquivoSharePoint(uploadData.fileName || '');

      toast({
        title: "Arquivo enviado",
        description: "Analisando documento com IA..."
      });

      setAnalisandoIA(true);
      setUploadProgress(90);

      // Preencher formulário com dados da análise de IA
      if (uploadData?.analiseIA?.dadosExtraidos) {
        console.log('IA dadosExtraidos:', uploadData.analiseIA.dadosExtraidos);
        setDadosExtraidos(uploadData.analiseIA.dadosExtraidos);
        
        const analise = uploadData.analiseIA.dadosExtraidos;
        
        // Extrair scores de confiança
        const scores: Record<string, number> = {};
        Object.keys(analise).forEach(key => {
          if (key.endsWith('Confianca')) {
            scores[key] = analise[key];
          }
        });
        setScoresConfianca(scores);
        
        // Preencher formulário com dados extraídos (com normalizações)
        setFormData(prev => ({
          ...prev,
          numeroProcesso: normalize(analise.numeroProcesso) || prev.numeroProcesso,
          autor: normalize(analise.autor) || prev.autor,
          reu: normalize(analise.reu) || prev.reu,
          orgao: normalize(analise.tribunal) || prev.orgao,
          varaTribunal: normalize(analise.camaraTurma) || prev.varaTribunal,
          nomeMagistrado: normalize(analise.relator) || prev.nomeMagistrado,
          dataDecisao: toISODate(analise.dataDecisao, prev.dataDecisao),
          adverso: normalize(analise.adverso) || prev.adverso,
          procedimentoObjeto: normalize(analise.assunto) || prev.procedimentoObjeto,
          tipoDecisao: normalizeTipoDecisao(analise.tipoDecisao) || prev.tipoDecisao,
          resultado: normalizeResultado(analise.resultado) || prev.resultado,
          poloCliente: normalizePolo(analise.poloCliente) || prev.poloCliente,
          valorDisputa: toNumber(analise.valorDisputa, prev.valorDisputa),
          economiaGerada: toNumber(analise.economiaGerada, prev.economiaGerada),
          percentualExonerado: toNumber(analise.percentualExonerado, prev.percentualExonerado),
          montanteReconhecido: toNumber(analise.montanteReconhecido, prev.montanteReconhecido),
          resumoDecisao: analise.resumo || prev.resumoDecisao,
        }));

        setUploadProgress(100);
        toast({
          title: "Análise concluída!",
          description: "Dados extraídos do documento. Revise e complete as informações.",
        });
      } else {
        setUploadProgress(100);
        toast({
          title: "Upload concluído",
          description: "Análise de IA não disponível. Preencha os campos manualmente.",
          variant: "default",
        });
      }
      
      // Mostrar formulário após upload
      setMostrarFormulario(true);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setUploadandoArquivo(false);
      setAnalisandoIA(false);
    }
  };

  const handleRemoveFile = () => {
    setArquivoDecisao(null);
    setUrlArquivoSharePoint("");
    setNomeArquivoSharePoint("");
    setDadosExtraidos(null);
    setScoresConfianca({});
    setMostrarFormulario(false);
    setUploadProgress(0);
  };

  const handleLimparCampos = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os campos? Esta ação não pode ser desfeita.')) {
      limparFormulario();
      toast({
        title: "Campos limpos",
        description: "Todos os campos foram resetados.",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validar se o arquivo foi enviado
      if (!arquivoDecisao) {
        toast({
          title: "Arquivo obrigatório",
          description: "Por favor, faça o upload do arquivo da decisão antes de continuar.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const validatedData = decisaoSchema.parse({
        ...formData,
        valorDisputa: formData.valorDisputa,
        economiaGerada: formData.economiaGerada
      });

      setIsConfirmDialogOpen(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEnvio = async () => {
    try {
      setLoading(true);
      
      // Incluir análise IA se disponível e dados do SharePoint
      const dadosParaSalvar: any = {
        numero_processo: formData.numeroProcesso,
        autor: formData.autor,
        reu: formData.reu,
        orgao: formData.orgao,
        vara_tribunal: formData.varaTribunal,
        nome_cliente: formData.nomeCliente,
        polo_cliente: formData.poloCliente,
        tipo_decisao: formData.tipoDecisao,
        resultado: formData.resultado,
        data_decisao: formData.dataDecisao,
        nome_magistrado: formData.nomeMagistrado,
        advogado_interno: formData.advogadoInterno,
        adverso: formData.adverso,
        procedimento_objeto: formData.procedimentoObjeto,
        valor_disputa: formData.valorDisputa,
        economia_gerada: formData.economiaGerada,
        percentual_exonerado: formData.percentualExonerado,
        montante_reconhecido: formData.montanteReconhecido,
        resumo_decisao: formData.resumoDecisao,
        arquivo_url: urlArquivoSharePoint,
        arquivo_nome: nomeArquivoSharePoint,
        sharepoint_drive_id: formData.sharepointDriveId,
        sharepoint_item_id: formData.sharepointItemId
      };

      // Adicionar análise IA se disponível
      if (dadosExtraidos) {
        dadosParaSalvar.analise_ia = dadosExtraidos;
      }
      
      await criarDecisao(dadosParaSalvar);

      const message = `*DECISÃO JUDICIAL - CALAZANS ROSSI ADVOGADOS*
    
*Cliente:* ${formData.nomeCliente}
*Processo:* ${formData.numeroProcesso}
*Tribunal:* ${formData.orgao}
*Câmara/Turma:* ${formData.varaTribunal}
*Tipo:* ${formData.tipoDecisao}
*Resultado:* ${formData.resultado}
*Relator:* ${formData.nomeMagistrado}
*Data:* ${new Date(formData.dataDecisao).toLocaleDateString('pt-BR')}
*Economia Gerada:* R$ ${formData.economiaGerada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

*Resumo:*
${formData.resumoDecisao}
`;

      openWhatsApp(message);
      
      setIsConfirmDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Decisão registrada e arquivo salvo no SharePoint!",
      });
      
      // Limpar formulário após sucesso
      limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar decisão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a decisão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="shadow-elevated">
        <CardHeader className="text-center relative pb-8">
          {/* Botão Limpar Campos no canto superior direito */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimparCampos}
              className="gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <AlertCircle className="h-4 w-4" />
              Limpar Campos
            </Button>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="p-4 hero-gradient rounded-xl shadow-glow">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            Gestão de Resultados e Jurimetria
          </CardTitle>
          <CardDescription className="text-lg">
            Registro detalhado de decisões judiciais com análise automatizada por IA
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Upload de Arquivo com Drag & Drop */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-lg">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <Label className="text-2xl font-bold text-primary">
                  1º PASSO: Upload da Decisão Judicial
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  A IA irá analisar o documento e preencher automaticamente os campos abaixo
                </p>
              </div>
            </div>
            
            <DragDropUpload
              onFileSelect={handleFileSelect}
              onUploadProgress={setUploadProgress}
              currentFile={arquivoDecisao}
              onRemoveFile={handleRemoveFile}
              accept=".pdf,.docx,.html"
              maxSize={20}
            />
            
            {(uploadandoArquivo || analisandoIA) && (
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="font-semibold text-primary">
                    {uploadandoArquivo ? 'Enviando documento...' : 'Analisando com IA...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {uploadProgress}% completo
                  </p>
                </div>
              </div>
            )}
            
            {dadosExtraidos && Object.keys(scoresConfianca).length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Análise de IA Concluída</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Os campos foram preenchidos automaticamente. Revise os dados com atenção, 
                      especialmente aqueles com confiança baixa (marcados em amarelo ou vermelho).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview do PDF */}
          {arquivoDecisao && mostrarFormulario && (
            <PdfPreview file={arquivoDecisao} />
          )}

          {/* Formulário - Só aparece após upload e análise */}
          {mostrarFormulario && (
            <>
              <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                <p className="font-semibold text-primary">2º PASSO: Revisar e Completar Informações</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os campos foram preenchidos automaticamente pela IA. Revise e ajuste conforme necessário.
                </p>
              </div>

              {/* Dados do Processo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroProcesso" className="flex items-center gap-2">
                Número do Processo (CNJ) <span className="text-destructive">*</span>
                {buscandoProcesso && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-spin" />
                    Buscando dados...
                  </span>
                )}
                {renderConfidenceBadge('numeroProcesso', formData.numeroProcesso)}
              </Label>
              <Input
                id="numeroProcesso"
                value={formData.numeroProcesso}
                onChange={(e) => handleInputChange('numeroProcesso', e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
                disabled={buscandoProcesso}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataDecisao">
                Data da Decisão <span className="text-destructive">*</span>
                {renderConfidenceBadge('dataDecisao', formData.dataDecisao)}
              </Label>
              <Input
                id="dataDecisao"
                type="date"
                value={formData.dataDecisao}
                onChange={(e) => handleInputChange('dataDecisao', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="autor">
                Autor <span className="text-destructive">*</span>
                {renderConfidenceBadge('autor', formData.autor)}
              </Label>
              <Input
                id="autor"
                value={formData.autor}
                onChange={(e) => handleInputChange('autor', e.target.value)}
                placeholder="Nome do autor da ação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reu">
                Réu <span className="text-destructive">*</span>
                {renderConfidenceBadge('reu', formData.reu)}
              </Label>
              <Input
                id="reu"
                value={formData.reu}
                onChange={(e) => handleInputChange('reu', e.target.value)}
                placeholder="Nome do réu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgao">
                Tribunal <span className="text-destructive">*</span>
              </Label>
              <SelectWithAdminEdit
                optionSetKey="tribunais"
                value={formData.orgao}
                onValueChange={(value) => handleInputChange('orgao', value)}
                placeholder="Ex: TJSP, TRF3, STJ, STF"
                isAdmin={isAdmin}
                label="Tribunal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="varaTribunal">
                Câmara / Turma <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={camarasDisponiveis.map(c => ({ value: c, label: c }))}
                value={formData.varaTribunal}
                onValueChange={(value) => handleInputChange('varaTribunal', value)}
                placeholder="Buscar ou digitar câmara/turma..."
                searchPlaceholder="Buscar câmara/turma..."
                emptyMessage="Nenhuma câmara encontrada. Digite para adicionar."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeMagistrado">
                Relator (Juiz/Desembargador/Ministro) <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={magistradosDisponiveis.map(m => ({ value: m, label: m }))}
                value={formData.nomeMagistrado}
                onValueChange={(value) => handleInputChange('nomeMagistrado', value)}
                placeholder="Buscar ou digitar nome do magistrado..."
                searchPlaceholder="Buscar magistrado..."
                emptyMessage="Nenhum magistrado encontrado. Digite para adicionar."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeCliente">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={clientes.map(c => ({ value: c, label: c }))}
                value={formData.nomeCliente}
                onValueChange={(value) => handleInputChange('nomeCliente', value)}
                placeholder="Buscar cliente..."
                searchPlaceholder="Buscar cliente..."
                emptyMessage="Nenhum cliente encontrado."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poloCliente">
                Polo do Cliente <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.poloCliente} onValueChange={(value) => handleInputChange('poloCliente', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o polo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo (Cliente é o Autor)</SelectItem>
                  <SelectItem value="Passivo">Passivo (Cliente é o Réu)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoDecisao">
                Tipo de Decisão <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.tipoDecisao} onValueChange={(value) => handleInputChange('tipoDecisao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sentença">Sentença</SelectItem>
                  <SelectItem value="Acórdão">Acórdão</SelectItem>
                  <SelectItem value="Decisão Monocrática (Efeito Suspensivo)">Decisão Monocrática (Efeito Suspensivo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultado">
                Resultado <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.resultado} onValueChange={(value) => handleInputChange('resultado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Favorável">Favorável</SelectItem>
                  <SelectItem value="Parcialmente Favorável">Parcialmente Favorável</SelectItem>
                  <SelectItem value="Desfavorável">Desfavorável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advogadoInterno">
                Advogado Interno <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={usuarios.map(u => ({ value: u.nome, label: u.nome }))}
                value={formData.advogadoInterno}
                onValueChange={(value) => handleInputChange('advogadoInterno', value)}
                placeholder="Buscar advogado..."
                searchPlaceholder="Buscar advogado..."
                emptyMessage="Nenhum usuário encontrado."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adverso">
                Parte Adversa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adverso"
                value={formData.adverso}
                onChange={(e) => handleInputChange('adverso', e.target.value)}
                placeholder="Nome da parte adversa"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="procedimentoObjeto">
                Assunto / Tema <span className="text-destructive">*</span>
              </Label>
              <Input
                id="procedimentoObjeto"
                value={formData.procedimentoObjeto}
                onChange={(e) => handleInputChange('procedimentoObjeto', e.target.value)}
                placeholder="Ex: Direito Tributário - ICMS"
              />
            </div>
          </div>

          {/* Valores Financeiros */}
          <div className="border-2 border-primary/50 rounded-lg p-4 space-y-4 bg-primary/5">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <h3 className="font-semibold">Valores Financeiros <span className="text-destructive">* OBRIGATÓRIOS</span></h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorDisputa">
                  Valor em Disputa (R$) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="valorDisputa"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorDisputa || ''}
                  onChange={(e) => handleInputChange('valorDisputa', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Valor total em discussão no processo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="economiaGerada">
                  Economia Gerada (R$) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="economiaGerada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.economiaGerada || ''}
                  onChange={(e) => handleInputChange('economiaGerada', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Valor economizado pelo cliente com esta decisão
                </p>
              </div>
            </div>
          </div>

          {/* Resumo da Decisão */}
          <div className="space-y-2">
            <Label htmlFor="resumoDecisao">
              Resumo da Decisão <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="resumoDecisao"
              value={formData.resumoDecisao}
              onChange={(e) => handleInputChange('resumoDecisao', e.target.value)}
              placeholder="Descreva brevemente a decisão e seus principais pontos..."
              rows={6}
            />
          </div>

              {/* Botão de Enviar */}
              <div className="flex justify-end gap-4 pt-4">
                <LoadingButton
                  onClick={handleSubmit}
                  loading={loading}
                  className="w-full md:w-auto"
                >
                  Registrar Decisão
                </LoadingButton>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Registro da Decisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Revise os dados antes de confirmar:</p>
            <div className="space-y-2 text-sm">
              <p><strong>Processo:</strong> {formData.numeroProcesso}</p>
              <p><strong>Cliente:</strong> {formData.nomeCliente}</p>
              <p><strong>Tribunal:</strong> {formData.orgao}</p>
              <p><strong>Resultado:</strong> {formData.resultado}</p>
              <p><strong>Economia Gerada:</strong> R$ {formData.economiaGerada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancelar
              </Button>
              <LoadingButton onClick={handleConfirmarEnvio} loading={loading}>
                Confirmar e Enviar
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecisaoJudicialFormNova;
