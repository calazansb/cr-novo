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
import { useClientes } from "@/hooks/useClientes";
import { openWhatsApp } from "@/lib/utils";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useDecisoes } from "@/hooks/useDecisoes";
import { z } from "zod";

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
  valorDisputa: z.number().min(0, "Valor deve ser positivo").optional(),
  resumoDecisao: z.string().trim().min(20, "Resumo deve ter pelo menos 20 caracteres")
});

const DecisaoJudicialFormNova = () => {
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { user } = useAuth();
  const { criarDecisao } = useDecisoes();
  
  const [isAdmin, setIsAdmin] = useState(false);
  
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

  // Calcular economia gerada automaticamente
  useEffect(() => {
    if (formData.poloCliente && formData.resultado && formData.valorDisputa > 0) {
      let economia = 0;
      
      if (formData.poloCliente === 'Passivo') {
        if (formData.resultado === 'Favorável') {
          economia = formData.valorDisputa;
        } else if (formData.resultado === 'Parcialmente Favorável' && formData.percentualExonerado > 0) {
          economia = formData.valorDisputa * (formData.percentualExonerado / 100);
        }
      } else if (formData.poloCliente === 'Ativo') {
        if ((formData.resultado === 'Favorável' || formData.resultado === 'Parcialmente Favorável') 
            && formData.montanteReconhecido > 0) {
          economia = formData.montanteReconhecido;
        }
      }
      
      setFormData(prev => ({ ...prev, economiaGerada: economia }));
    }
  }, [formData.poloCliente, formData.resultado, formData.valorDisputa, formData.percentualExonerado, formData.montanteReconhecido]);

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
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('decisoes-judiciais')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      toast({
        title: "Arquivo enviado",
        description: "Iniciando análise com IA..."
      });

      // Chamar edge function para análise com IA
      setAnalisandoIA(true);
      const { data: analiseData, error: analiseError } = await supabase.functions.invoke('analisar-decisao-ia', {
        body: { 
          filePath: uploadData.path,
          fileName: file.name
        }
      });

      if (analiseError) throw analiseError;

      if (analiseData?.dadosExtraidos) {
        setDadosExtraidos(analiseData.dadosExtraidos);
        
        // Preencher formulário com dados extraídos
        setFormData(prev => ({
          ...prev,
          numeroProcesso: analiseData.dadosExtraidos.numeroProcesso || prev.numeroProcesso,
          autor: analiseData.dadosExtraidos.autor || prev.autor,
          reu: analiseData.dadosExtraidos.reu || prev.reu,
          orgao: analiseData.dadosExtraidos.tribunal || prev.orgao,
          varaTribunal: analiseData.dadosExtraidos.camaraTurma || prev.varaTribunal,
          nomeMagistrado: analiseData.dadosExtraidos.relator || prev.nomeMagistrado,
          dataDecisao: analiseData.dadosExtraidos.dataDecisao || prev.dataDecisao,
          procedimentoObjeto: analiseData.dadosExtraidos.assunto || prev.procedimentoObjeto,
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
      const validatedData = decisaoSchema.parse({
        ...formData,
        valorDisputa: formData.valorDisputa || 0
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
      
      await criarDecisao({
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
      });

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
          <div className="space-y-2 border-2 border-dashed border-muted rounded-lg p-6">
            <Label htmlFor="arquivo" className="flex items-center gap-2 text-lg font-semibold">
              <Upload className="h-5 w-5" />
              Upload da Decisão (PDF, DOCX, HTML)
            </Label>
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
              <Input
                id="varaTribunal"
                value={formData.varaTribunal}
                onChange={(e) => handleInputChange('varaTribunal', e.target.value)}
                placeholder="Ex: 8ª Câmara de Direito Público"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeMagistrado">
                Relator (Juiz/Desembargador/Ministro) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nomeMagistrado"
                value={formData.nomeMagistrado}
                onChange={(e) => handleInputChange('nomeMagistrado', e.target.value)}
                placeholder="Nome do magistrado relator"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeCliente">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.nomeCliente} onValueChange={(value) => handleInputChange('nomeCliente', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Input
                id="advogadoInterno"
                value={formData.advogadoInterno}
                onChange={(e) => handleInputChange('advogadoInterno', e.target.value)}
                placeholder="Nome do advogado responsável"
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
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <h3 className="font-semibold">Valores Financeiros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorDisputa">Valor em Disputa (R$)</Label>
                <Input
                  id="valorDisputa"
                  type="number"
                  step="0.01"
                  value={formData.valorDisputa}
                  onChange={(e) => handleInputChange('valorDisputa', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>

              {formData.poloCliente === 'Passivo' && formData.resultado === 'Parcialmente Favorável' && (
                <div className="space-y-2">
                  <Label htmlFor="percentualExonerado">% Exonerado</Label>
                  <Input
                    id="percentualExonerado"
                    type="number"
                    step="0.01"
                    max="100"
                    value={formData.percentualExonerado}
                    onChange={(e) => handleInputChange('percentualExonerado', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              )}

              {formData.poloCliente === 'Ativo' && (formData.resultado === 'Favorável' || formData.resultado === 'Parcialmente Favorável') && (
                <div className="space-y-2">
                  <Label htmlFor="montanteReconhecido">Montante Reconhecido (R$)</Label>
                  <Input
                    id="montanteReconhecido"
                    type="number"
                    step="0.01"
                    value={formData.montanteReconhecido}
                    onChange={(e) => handleInputChange('montanteReconhecido', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label className="text-lg font-bold text-success">
                  Economia Gerada: R$ {formData.economiaGerada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Calculado automaticamente conforme regras do sistema
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
