import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Upload, Sparkles, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectWithAdminEdit } from "@/components/Admin/SelectWithAdminEdit";
import { Combobox } from "@/components/ui/combobox";
import { useClientes } from "@/hooks/useClientes";
import { useUsuarios } from "@/hooks/useUsuarios";
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
    resumoDecisao: ""
  });

  const [arquivoDecisao, setArquivoDecisao] = useState<File | null>(null);
  const [uploadandoArquivo, setUploadandoArquivo] = useState(false);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState<any>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, envie um arquivo PDF, DOCX ou HTML.",
        variant: "destructive"
      });
      return;
    }

    setArquivoDecisao(file);
    setUploadandoArquivo(true);

    try {
      // Upload do arquivo para o Supabase Storage
      // Remover caracteres especiais do nome do arquivo
      const sanitizedFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9.-]/g, '_'); // Substitui caracteres especiais por _
      
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('decisoes-judiciais')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      toast({
        title: "Arquivo enviado",
        description: "Iniciando análise com IA..."
      });
      const extractedText = await extractTextFromFile(file);

      // Chamar edge function para análise com IA
      setAnalisandoIA(true);
      const { data: analiseData, error: analiseError } = await supabase.functions.invoke('analisar-decisao-ia', {
        body: { 
          filePath: uploadData.path,
          fileName: file.name,
          fileText: extractedText?.slice(0, 20000)
        }
      });

      if (analiseError) throw analiseError;

      if (analiseData?.dadosExtraidos) {
        console.log('IA dadosExtraidos:', analiseData.dadosExtraidos);
        setDadosExtraidos(analiseData.dadosExtraidos);
        
        // Preencher formulário com dados extraídos (com normalizações)
        setFormData(prev => ({
          ...prev,
          numeroProcesso: analiseData.dadosExtraidos.numeroProcesso || prev.numeroProcesso,
          autor: analiseData.dadosExtraidos.autor || prev.autor,
          reu: analiseData.dadosExtraidos.reu || prev.reu,
          orgao: analiseData.dadosExtraidos.tribunal || prev.orgao,
          varaTribunal: analiseData.dadosExtraidos.camaraTurma || prev.varaTribunal,
          nomeMagistrado: analiseData.dadosExtraidos.relator || prev.nomeMagistrado,
          dataDecisao: toISODate(analiseData.dadosExtraidos.dataDecisao, prev.dataDecisao),
          adverso: analiseData.dadosExtraidos.adverso || prev.adverso,
          procedimentoObjeto: analiseData.dadosExtraidos.assunto || prev.procedimentoObjeto,
          tipoDecisao: normalizeTipoDecisao(analiseData.dadosExtraidos.tipoDecisao) || prev.tipoDecisao,
          resultado: normalizeResultado(analiseData.dadosExtraidos.resultado) || prev.resultado,
          poloCliente: normalizePolo(analiseData.dadosExtraidos.poloCliente) || prev.poloCliente,
          valorDisputa: toNumber(analiseData.dadosExtraidos.valorDisputa, prev.valorDisputa),
          economiaGerada: toNumber(analiseData.dadosExtraidos.economiaGerada, prev.economiaGerada),
          percentualExonerado: toNumber(analiseData.dadosExtraidos.percentualExonerado, prev.percentualExonerado),
          montanteReconhecido: toNumber(analiseData.dadosExtraidos.montanteReconhecido, prev.montanteReconhecido),
          resumoDecisao: analiseData.dadosExtraidos.resumo || prev.resumoDecisao
        }));

        toast({
          title: "Análise concluída!",
          description: "Dados extraídos do documento. Revise e complete as informações.",
        });
      }
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
      
      // Incluir análise IA se disponível
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
        resumo_decisao: formData.resumoDecisao
      };

      // Adicionar análise IA se disponível
      if (dadosExtraidos) {
        dadosParaSalvar.analise_ia = dadosExtraidos;
      }
      
      const decisaoCriada = await criarDecisao(dadosParaSalvar);

      // Arquivar no SharePoint em background (não bloqueia a UI)
      if (decisaoCriada && arquivoDecisao) {
        // Obter o path do arquivo do storage
        const sanitizedFileName = arquivoDecisao.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9.-]/g, '_');
        const arquivoPath = `${Date.now()}-${sanitizedFileName}`;

        const metadados = {
          tema: formData.procedimentoObjeto || 'Outros',
          tribunal: formData.orgao || 'Tribunal',
          camaraTurma: formData.varaTribunal || 'Vara',
          ano: formData.dataDecisao ? new Date(formData.dataDecisao).getFullYear().toString() : new Date().getFullYear().toString(),
          numeroProcesso: formData.numeroProcesso || 'SEM-NUMERO',
          relator: formData.nomeMagistrado || 'Relator Não Informado'
        };

        console.log('Iniciando arquivamento no SharePoint...', {
          decisaoId: decisaoCriada.id,
          arquivoPath,
          metadados
        });

        // Chamar edge function em background
        supabase.functions.invoke('arquivar-sharepoint', {
          body: {
            decisaoId: decisaoCriada.id,
            filePath: arquivoPath,
            fileName: arquivoDecisao.name,
            metadados
          }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Erro ao arquivar no SharePoint:', error);
            toast({
              title: "Aviso",
              description: "Decisão salva, mas houve erro ao arquivar no SharePoint.",
              variant: "default",
            });
          } else {
            console.log('Arquivado no SharePoint com sucesso:', data);
            toast({
              title: "Sucesso completo! ✅",
              description: "Decisão salva e arquivada no SharePoint!",
            });
          }
        });
      }

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
        description: "Decisão registrada com sucesso!",
      });
      
      // Limpar formulário
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
        resumoDecisao: ""
      });
      setArquivoDecisao(null);
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
        <CardHeader className="text-center">
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
          {/* Upload de Arquivo */}
          <div className="space-y-2 border-2 border-dashed border-primary/50 rounded-lg p-6 bg-primary/5">
            <Label htmlFor="arquivo" className="flex items-center gap-2 text-lg font-semibold">
              <Upload className="h-5 w-5" />
              Upload da Decisão (PDF, DOCX, HTML) <span className="text-destructive">* OBRIGATÓRIO</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              O arquivo da decisão é necessário para alimentar o Power BI e a Jurimetria
            </p>
            <Input
              id="arquivo"
              type="file"
              accept=".pdf,.docx,.html"
              onChange={handleFileUpload}
              disabled={uploadandoArquivo || analisandoIA}
            />
            {analisandoIA && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Sparkles className="h-4 w-4 animate-spin" />
                Analisando documento com IA...
              </div>
            )}
            {arquivoDecisao && !analisandoIA && (
              <p className="text-sm text-success mt-2">
                ✓ Arquivo carregado: {arquivoDecisao.name}
              </p>
            )}
          </div>

          {/* Dados do Processo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroProcesso">
                Número do Processo (CNJ) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="numeroProcesso"
                value={formData.numeroProcesso}
                onChange={(e) => handleInputChange('numeroProcesso', e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataDecisao">
                Data da Decisão <span className="text-destructive">*</span>
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
