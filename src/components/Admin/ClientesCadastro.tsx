import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import { useClientesCadastro } from '@/hooks/useClientesCadastro';
import { gerarSugestoesAbreviacao, validarAbreviacao } from '@/lib/abreviacoes';

export const ClientesCadastro = () => {
  const { clientes, loading, criarCliente, atualizarCliente, deletarCliente } = useClientesCadastro();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    abreviacao: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    endereco: '',
    observacoes: ''
  });
  const [sugestoesAbreviacao, setSugestoesAbreviacao] = useState<string[]>([]);
  const [erroAbreviacao, setErroAbreviacao] = useState<string>('');

  // Gerar sugestões quando o nome mudar
  useEffect(() => {
    if (formData.nome && formData.nome.length >= 3) {
      const sugestoes = gerarSugestoesAbreviacao(formData.nome);
      setSugestoesAbreviacao(sugestoes);
      
      // Se não houver abreviação definida, usar a primeira sugestão
      if (!formData.abreviacao && sugestoes.length > 0) {
        setFormData(prev => ({ ...prev, abreviacao: sugestoes[0] }));
      }
    } else {
      setSugestoesAbreviacao([]);
    }
  }, [formData.nome]);

  // Validar abreviação quando mudar
  useEffect(() => {
    if (formData.abreviacao) {
      const resultado = validarAbreviacao(formData.abreviacao);
      setErroAbreviacao(resultado.valido ? '' : resultado.erro || '');
    } else {
      setErroAbreviacao('');
    }
  }, [formData.abreviacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar abreviação antes de enviar
    if (formData.abreviacao) {
      const resultado = validarAbreviacao(formData.abreviacao);
      if (!resultado.valido) {
        setErroAbreviacao(resultado.erro || 'Abreviação inválida');
        return;
      }
    }
    
    if (editando) {
      await atualizarCliente(editando, formData);
    } else {
      await criarCliente(formData);
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      abreviacao: '',
      email: '',
      telefone: '',
      cpf_cnpj: '',
      endereco: '',
      observacoes: ''
    });
    setSugestoesAbreviacao([]);
    setErroAbreviacao('');
    setEditando(null);
  };

  const handleEdit = (cliente: any) => {
    setFormData({
      nome: cliente.nome,
      abreviacao: cliente.abreviacao || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      cpf_cnpj: cliente.cpf_cnpj || '',
      endereco: cliente.endereco || '',
      observacoes: cliente.observacoes || ''
    });
    setEditando(cliente.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      await deletarCliente(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cadastro de Clientes</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abreviacao">
                    Abreviação
                    <Sparkles className="inline-block ml-1 h-3 w-3 text-primary" />
                  </Label>
                  <Input
                    id="abreviacao"
                    value={formData.abreviacao}
                    onChange={(e) => setFormData({ ...formData, abreviacao: e.target.value.toUpperCase() })}
                    placeholder="Ex: HAP, CEMIG, etc"
                    maxLength={10}
                    className={erroAbreviacao ? 'border-destructive' : ''}
                  />
                  {erroAbreviacao && (
                    <p className="text-xs text-destructive">{erroAbreviacao}</p>
                  )}
                  {sugestoesAbreviacao.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Sugestões automáticas:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {sugestoesAbreviacao.map((sugestao) => (
                          <Badge
                            key={sugestao}
                            variant={formData.abreviacao === sugestao ? 'default' : 'outline'}
                            className="cursor-pointer hover:bg-primary/20"
                            onClick={() => setFormData({ ...formData, abreviacao: sugestao })}
                          >
                            {sugestao}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Usado em nomes de arquivos e pastas no SharePoint
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editando ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Abreviação</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    {cliente.abreviacao || '-'}
                  </span>
                </TableCell>
                <TableCell>{cliente.email || '-'}</TableCell>
                <TableCell>{cliente.telefone || '-'}</TableCell>
                <TableCell>{cliente.cpf_cnpj || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
