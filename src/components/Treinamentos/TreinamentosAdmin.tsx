// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { ArrowLeft, Plus, Users, Clock, BookOpen, Eye, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TempoDetalhadoViewer from './TempoDetalhadoViewer';

interface TreinamentosAdminProps {
  onBack: () => void;
  onRefresh: () => void;
}

interface Treinamento {
  id: string;
  titulo: string;
  descricao?: string;
  obrigatorio: boolean;
  ativo: boolean;
  arquivo_url?: string;
  arquivo_nome?: string;
  tipo_conteudo: string; // Change to string to match database
  created_at: string;
}

interface ProgressoUsuario {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  concluido: boolean;
  tempo_total_segundos: number;
  pagina_atual: number;
  total_paginas: number;
  iniciado_em: string;
  concluido_em?: string;
}

const TreinamentosAdmin: React.FC<TreinamentosAdminProps> = ({ onBack, onRefresh }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [progressosDetalhados, setProgressosDetalhados] = useState<ProgressoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTreinamento, setSelectedTreinamento] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showTempoDetalhado, setShowTempoDetalhado] = useState(false);
  const [selectedProgressoId, setSelectedProgressoId] = useState<string>('');
  const [selectedUsuarioNome, setSelectedUsuarioNome] = useState<string>('');
  const [selectedTreinamentoTitulo, setSelectedTreinamentoTitulo] = useState<string>('');
  const [editingTreinamento, setEditingTreinamento] = useState<Treinamento | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');

  // Form states
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    obrigatorio: false,
    ativo: true,
    arquivo_url: '',
    arquivo_nome: '',
    tipo_conteudo: 'pdf' as 'pdf' | 'video' | 'texto' | 'link'
  });

  useEffect(() => {
    loadTreinamentos();
  }, []);

  const loadTreinamentos = async () => {
    const { data, error } = await supabase
      .from('treinamentos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar treinamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os treinamentos.",
        variant: "destructive",
      });
    } else {
      setTreinamentos(data || []);
    }
    setLoading(false);
  };

  const loadProgressosDetalhados = async (treinamentoId: string) => {
    const { data, error } = await supabase
      .from('treinamento_progresso')
      .select(`
        id,
        user_id,
        concluido,
        tempo_total_segundos,
        pagina_atual,
        total_paginas,
        iniciado_em,
        concluido_em,
        profiles!inner(nome, email)
      `)
      .eq('treinamento_id', treinamentoId);
    
    if (error) {
      console.error('Erro ao carregar progressos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os progressos.",
        variant: "destructive",
      });
    } else {
      const progressosFormatados = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        nome: (item.profiles as any).nome,
        email: (item.profiles as any).email,
        concluido: item.concluido,
        tempo_total_segundos: item.tempo_total_segundos,
        pagina_atual: item.pagina_atual,
        total_paginas: item.total_paginas,
        iniciado_em: item.iniciado_em,
        concluido_em: item.concluido_em
      })) || [];
      
      setProgressosDetalhados(progressosFormatados);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('treinamentos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('treinamentos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleCreateTreinamento = async () => {
    console.log('handleCreateTreinamento chamado', { user, formData, uploadMode, uploadedFiles });
    
    if (!user || !formData.titulo.trim()) {
      console.log('Erro de validação:', { user: !!user, titulo: formData.titulo });
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Validar se tem arquivo ou URL dependendo do modo
    if (uploadMode === 'upload' && (!uploadedFiles || uploadedFiles.length === 0 || !uploadedFiles[0] || !uploadedFiles[0].name)) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para upload.",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === 'url' && !formData.arquivo_url.trim()) {
      toast({
        title: "Erro",
        description: "Informe a URL do arquivo.",
        variant: "destructive",
      });
      return;
    }

    let arquivo_url = formData.arquivo_url;
    let arquivo_nome = formData.arquivo_nome;

    // Se o modo é upload e há arquivos, faz o upload
    if (uploadMode === 'upload' && uploadedFiles.length > 0) {
      console.log('Iniciando upload do arquivo:', uploadedFiles[0]);
      try {
        const file = uploadedFiles[0];
        arquivo_url = await handleFileUpload(file);
        arquivo_nome = file.name;
        console.log('Upload concluído:', { arquivo_url, arquivo_nome });
      } catch (error) {
        console.error('Erro no upload:', error);
        toast({
          title: "Erro",
          description: "Erro ao fazer upload do arquivo.",
          variant: "destructive",
        });
        return;
      }
    } else {
      console.log('Sem upload necessário:', { uploadMode, filesCount: uploadedFiles.length });
    }

    console.log('Dados para inserir:', {
      ...formData,
      arquivo_url,
      arquivo_nome,
      created_by: user.id
    });

    const { error } = await supabase
      .from('treinamentos')
      .insert({
        ...formData,
        arquivo_url,
        arquivo_nome,
        created_by: user.id
      });

    console.log('Resposta do Supabase:', { error });

    if (error) {
      console.error('Erro ao criar treinamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o treinamento.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Treinamento criado com sucesso!",
      });
      setShowCreateDialog(false);
      resetForm();
      loadTreinamentos();
      onRefresh();
    }
  };

  const handleEditTreinamento = async () => {
    if (!editingTreinamento || !formData.titulo.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    let arquivo_url = formData.arquivo_url;
    let arquivo_nome = formData.arquivo_nome;

    // Se o modo é upload e há arquivos, faz o upload
    if (uploadMode === 'upload' && uploadedFiles.length > 0) {
      try {
        const file = uploadedFiles[0];
        arquivo_url = await handleFileUpload(file);
        arquivo_nome = file.name;
      } catch (error) {
        console.error('Erro no upload:', error);
        toast({
          title: "Erro",
          description: "Erro ao fazer upload do arquivo.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase
      .from('treinamentos')
      .update({
        ...formData,
        arquivo_url,
        arquivo_nome
      })
      .eq('id', editingTreinamento.id);

    if (error) {
      console.error('Erro ao atualizar treinamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o treinamento.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Treinamento atualizado com sucesso!",
      });
      setShowEditDialog(false);
      setEditingTreinamento(null);
      resetForm();
      loadTreinamentos();
      onRefresh();
    }
  };

  const handleDeleteTreinamento = async (treinamento: Treinamento) => {
    if (!confirm(`Tem certeza que deseja excluir o treinamento "${treinamento.titulo}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('treinamentos')
      .delete()
      .eq('id', treinamento.id);

    if (error) {
      console.error('Erro ao excluir treinamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treinamento.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Treinamento excluído com sucesso!",
      });
      loadTreinamentos();
      onRefresh();
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      obrigatorio: false,
      ativo: true,
      arquivo_url: '',
      arquivo_nome: '',
      tipo_conteudo: 'pdf'
    });
    setUploadedFiles([]);
    setUploadMode('upload');
  };

  const handleEditClick = (treinamento: Treinamento) => {
    setEditingTreinamento(treinamento);
    setFormData({
      titulo: treinamento.titulo,
      descricao: treinamento.descricao || '',
      obrigatorio: treinamento.obrigatorio,
      ativo: treinamento.ativo,
      arquivo_url: treinamento.arquivo_url || '',
      arquivo_nome: treinamento.arquivo_nome || '',
      tipo_conteudo: treinamento.tipo_conteudo as 'pdf' | 'video' | 'texto' | 'link'
    });
    setUploadMode(treinamento.arquivo_url ? 'url' : 'upload');
    setShowEditDialog(true);
  };

  const calcularTempoLegivel = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  };

  const handleViewProgress = async (treinamentoId: string) => {
    setSelectedTreinamento(treinamentoId);
    const treinamento = treinamentos.find(t => t.id === treinamentoId);
    setSelectedTreinamentoTitulo(treinamento?.titulo || '');
    await loadProgressosDetalhados(treinamentoId);
    setShowProgressDialog(true);
  };

  const handleViewTempoDetalhado = (progressoId: string, nomeUsuario: string) => {
    setSelectedProgressoId(progressoId);
    setSelectedUsuarioNome(nomeUsuario);
    setShowTempoDetalhado(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Dashboard - Treinamentos</h1>
          <p className="text-muted-foreground">
            Gerencie treinamentos e acompanhe o progresso dos usuários
          </p>
        </div>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Treinamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treinamentos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {treinamentos.filter(t => t.ativo).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Obrigatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {treinamentos.filter(t => t.obrigatorio).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <Clock className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Treinamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Treinamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Digite o título do treinamento"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva o conteúdo do treinamento"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_conteudo">Tipo de Conteúdo</Label>
                      <Select 
                        value={formData.tipo_conteudo} 
                        onValueChange={(value: 'pdf' | 'video' | 'texto' | 'link') => 
                          setFormData({ ...formData, tipo_conteudo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="texto">Texto</SelectItem>
                          <SelectItem value="link">Link Externo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Método de Adição</Label>
                      <Select value={uploadMode} onValueChange={(value: 'upload' | 'url') => setUploadMode(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upload">Upload de Arquivo</SelectItem>
                          <SelectItem value="url">URL/Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {uploadMode === 'upload' ? (
                      <div className="space-y-2">
                        <Label>Arquivo do Treinamento</Label>
                        <FileUpload
                          onFilesChange={setUploadedFiles}
                          files={uploadedFiles}
                          maxFiles={1}
                          acceptedTypes={formData.tipo_conteudo === 'pdf' ? ['.pdf'] : formData.tipo_conteudo === 'video' ? ['.mp4', '.avi', '.mkv'] : []}
                          maxSize={50 * 1024 * 1024} // 50MB
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="arquivo_url">URL do Arquivo/Link</Label>
                        <Input
                          id="arquivo_url"
                          value={formData.arquivo_url}
                          onChange={(e) => setFormData({ ...formData, arquivo_url: e.target.value })}
                          placeholder="https://exemplo.com/arquivo.pdf"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="obrigatorio"
                        checked={formData.obrigatorio}
                        onCheckedChange={(checked) => setFormData({ ...formData, obrigatorio: checked })}
                      />
                      <Label htmlFor="obrigatorio">Treinamento Obrigatório</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ativo"
                        checked={formData.ativo}
                        onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                      />
                      <Label htmlFor="ativo">Ativo</Label>
                    </div>
                  </div>
                  
                  <Button onClick={handleCreateTreinamento} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Treinamento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Lista de treinamentos para admin */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Treinamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {treinamentos.map((treinamento) => (
              <Card key={treinamento.id} className="border border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{treinamento.titulo}</CardTitle>
                        {treinamento.obrigatorio && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                        <Badge variant={treinamento.ativo ? "default" : "secondary"}>
                          {treinamento.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {treinamento.tipo_conteudo.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {treinamento.descricao && (
                        <CardDescription>{treinamento.descricao}</CardDescription>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProgress(treinamento.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Ver Progressos
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(treinamento)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDeleteTreinamento(treinamento)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Dialog para editar treinamento */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Treinamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Título *</Label>
              <Input
                id="edit-titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título do treinamento"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o conteúdo do treinamento"
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tipo_conteudo">Tipo de Conteúdo</Label>
                <Select 
                  value={formData.tipo_conteudo} 
                  onValueChange={(value: 'pdf' | 'video' | 'texto' | 'link') => 
                    setFormData({ ...formData, tipo_conteudo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="link">Link Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Método de Adição</Label>
                <Select value={uploadMode} onValueChange={(value: 'upload' | 'url') => setUploadMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Upload de Arquivo</SelectItem>
                    <SelectItem value="url">URL/Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {uploadMode === 'upload' ? (
                <div className="space-y-2">
                  <Label>Arquivo do Treinamento</Label>
                  <FileUpload
                    onFilesChange={setUploadedFiles}
                    files={uploadedFiles}
                    maxFiles={1}
                    acceptedTypes={formData.tipo_conteudo === 'pdf' ? ['.pdf'] : formData.tipo_conteudo === 'video' ? ['.mp4', '.avi', '.mkv'] : []}
                    maxSize={50 * 1024 * 1024} // 50MB
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-arquivo_url">URL do Arquivo/Link</Label>
                  <Input
                    id="edit-arquivo_url"
                    value={formData.arquivo_url}
                    onChange={(e) => setFormData({ ...formData, arquivo_url: e.target.value })}
                    placeholder="https://exemplo.com/arquivo.pdf"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-obrigatorio"
                  checked={formData.obrigatorio}
                  onCheckedChange={(checked) => setFormData({ ...formData, obrigatorio: checked })}
                />
                <Label htmlFor="edit-obrigatorio">Treinamento Obrigatório</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="edit-ativo">Ativo</Label>
              </div>
            </div>
            
            <Button onClick={handleEditTreinamento} className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver progressos */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Progresso dos Usuários</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {progressosDetalhados.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Tempo Gasto</TableHead>
                      <TableHead>Iniciado em</TableHead>
                      <TableHead>Concluído em</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                        {progressosDetalhados.map((progresso) => {
                          const tempoTotal = calcularTempoLegivel(progresso.tempo_total_segundos);
                          const eficiencia = progresso.total_paginas > 0 
                            ? Math.round(progresso.tempo_total_segundos / progresso.total_paginas)
                            : 0;
                          
                          return (
                            <TableRow key={progresso.user_id}>
                              <TableCell className="font-medium">{progresso.nome}</TableCell>
                              <TableCell>{progresso.email}</TableCell>
                              <TableCell>
                                <Badge variant={progresso.concluido ? "default" : "secondary"}>
                                  {progresso.concluido ? "Concluído" : "Em andamento"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div>
                                    {progresso.pagina_atual}/{progresso.total_paginas} páginas
                                    ({Math.round((progresso.pagina_atual / progresso.total_paginas) * 100)}%)
                                  </div>
                                  <Progress 
                                    value={(progresso.pagina_atual / progresso.total_paginas) * 100} 
                                    className="h-1" 
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{tempoTotal}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ~{calcularTempoLegivel(eficiencia)}/página
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(progresso.iniciado_em).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell className="text-sm">
                                {progresso.concluido_em 
                                  ? new Date(progresso.concluido_em).toLocaleString('pt-BR')
                                  : '-'
                                }
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewTempoDetalhado(progresso.id, progresso.nome)}
                                  className="flex items-center gap-2"
                                >
                                  <Clock className="h-3 w-3" />
                                  Ver Detalhes
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum usuário iniciou este treinamento ainda.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para tempo detalhado */}
      <TempoDetalhadoViewer
        open={showTempoDetalhado}
        onClose={() => setShowTempoDetalhado(false)}
        progressoId={selectedProgressoId}
        nomeUsuario={selectedUsuarioNome}
        tituloTreinamento={selectedTreinamentoTitulo}
      />
    </div>
  );
};

export default TreinamentosAdmin;