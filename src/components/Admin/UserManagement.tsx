import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Edit, Shield, Mail, Key, Trash2, UserPlus, Search, Building2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'advogado' | 'cliente';
}

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
}

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf_cnpj: string | null;
  endereco: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

type ItemLista = (Profile & { tipo: 'usuario' }) | (Cliente & { tipo: 'cliente' });

const UserManagement = () => {
  const [items, setItems] = useState<ItemLista[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isEditClienteDialogOpen, setIsEditClienteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateClienteDialogOpen, setIsCreateClienteDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', role: 'advogado' as 'admin' | 'advogado' });
  const [newCliente, setNewCliente] = useState({ nome: '', email: '', telefone: '', cpf_cnpj: '', endereco: '', observacoes: '' });
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroBusca, setFiltroBusca] = useState<string>('');
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState<'nome' | 'tipo' | 'created_at' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário atual é admin
      const { data: adminCheck } = await supabase.rpc('is_admin');
      setIsAdmin(adminCheck === true);
      
      if (!adminCheck) {
        throw new Error('Acesso negado: Apenas administradores podem gerenciar usuários e clientes');
      }

      // Buscar profiles (usuários) com roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles para cada usuário
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientesError) throw clientesError;

      // Combinar dados de usuários
      const usersWithRoles: ItemLista[] = (profilesData || []).map(profile => ({
        ...profile,
        roles: (rolesData || []).filter(role => role.user_id === profile.id),
        tipo: 'usuario' as const
      }));

      // Combinar dados de clientes
      const clientesWithType: ItemLista[] = (clientesData || []).map(cliente => ({
        ...cliente,
        tipo: 'cliente' as const
      }));

      // Juntar tudo
      const allItems = [...usersWithRoles, ...clientesWithType];
      setItems(allItems);
      setFilteredItems(allItems);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Aplicar filtros e ordenação
  useEffect(() => {
    let resultado = [...items];

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      if (filtroTipo === 'cliente') {
        resultado = resultado.filter(item => item.tipo === 'cliente');
      } else {
        resultado = resultado.filter(item => {
          if (item.tipo === 'usuario') {
            const userRole = getUserRole(item as Profile);
            return userRole === filtroTipo;
          }
          return false;
        });
      }
    }

    // Filtro por busca (nome ou email)
    if (filtroBusca.trim()) {
      const busca = filtroBusca.toLowerCase();
      resultado = resultado.filter(item => 
        item.nome.toLowerCase().includes(busca) ||
        (item.email && item.email.toLowerCase().includes(busca))
      );
    }

    // Aplicar ordenação
    if (sortField) {
      resultado.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === 'nome') {
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
        } else if (sortField === 'tipo') {
          aValue = a.tipo === 'cliente' ? 'cliente' : getUserRole(a as Profile);
          bValue = b.tipo === 'cliente' ? 'cliente' : getUserRole(b as Profile);
        } else if (sortField === 'created_at') {
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setCurrentPage(1);
    setFilteredItems(resultado);
  }, [filtroTipo, filtroBusca, items, sortField, sortDirection]);

  const getUserRole = (user: Profile | null): 'admin' | 'advogado' | 'cliente' => {
    if (!user) return 'advogado';
    return user.roles?.[0]?.role || 'advogado';
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: editingUser.nome,
          email: editingUser.email,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      const currentRole = getUserRole(editingUser);
      const newRole = (editingUser as any).newRole || currentRole;

      if (currentRole !== newRole) {
        await supabase.from('user_roles').delete().eq('user_id', editingUser.id);
        await supabase.from('user_roles').insert({ user_id: editingUser.id, role: newRole });
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso.",
      });

      setIsEditUserDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          nome: newUser.nome,
          role: newUser.role
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso.",
      });

      setIsCreateUserDialogOpen(false);
      setNewUser({ nome: '', email: '', password: '', role: 'advogado' });
      fetchData();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCliente = async () => {
    if (!newCliente.nome) {
      toast({
        title: "Erro",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .insert({
          nome: newCliente.nome,
          email: newCliente.email || null,
          telefone: newCliente.telefone || null,
          cpf_cnpj: newCliente.cpf_cnpj || null,
          endereco: newCliente.endereco || null,
          observacoes: newCliente.observacoes || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso.",
      });

      setIsCreateClienteDialogOpen(false);
      setNewCliente({ nome: '', email: '', telefone: '', cpf_cnpj: '', endereco: '', observacoes: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCliente = async () => {
    if (!editingCliente) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: editingCliente.nome,
          email: editingCliente.email || null,
          telefone: editingCliente.telefone || null,
          cpf_cnpj: editingCliente.cpf_cnpj || null,
          endereco: editingCliente.endereco || null,
          observacoes: editingCliente.observacoes || null
        })
        .eq('id', editingCliente.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso.",
      });

      setIsEditClienteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCliente = async (clienteId: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente deletado com sucesso.",
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserForPassword || !newPassword) {
      toast({
        title: "Erro",
        description: "Preencha a nova senha.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: selectedUserForPassword.id,
          newPassword: newPassword,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso.",
      });

      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUserForPassword(null);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso.",
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o usuário.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (item: ItemLista) => {
    if (item.tipo === 'cliente') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Cliente</Badge>;
    }
    
    const role = getUserRole(item as Profile);
    
    if (role === 'admin') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Administrador</Badge>;
    }
    
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Usuário
      </Badge>
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (field: 'nome' | 'tipo' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'nome' | 'tipo' | 'created_at') => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (loading) {
    return (
      <section className="p-4">
        <p>Carregando...</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="p-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <p>Apenas administradores podem acessar esta seção.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4 p-2">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Usuários e Clientes</h2>
        <div className="flex flex-col gap-2 md:flex-row">
          <Button
            onClick={() => setIsCreateUserDialogOpen(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
          <Button
            onClick={() => setIsCreateClienteDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex w-full flex-col gap-2 md:flex-row">
          <div className="relative md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            <Input
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              placeholder="Buscar por nome ou email"
              className="pl-9"
              aria-label="Buscar por nome ou email"
            />
          </div>
          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v)}>
            <SelectTrigger className="md:w-56" aria-label="Filtrar por tipo">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="cliente">Clientes</SelectItem>
              <SelectItem value="advogado">Usuários</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {currentItems.length === 0 ? (
            <div className="p-6 text-sm opacity-75">Nenhum registro encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('nome')}
                        className="h-8 px-2 hover:bg-muted/50"
                      >
                        Nome
                        {getSortIcon('nome')}
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('tipo')}
                        className="h-8 px-2 hover:bg-muted/50"
                      >
                        Tipo
                        {getSortIcon('tipo')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('created_at')}
                        className="h-8 px-2 hover:bg-muted/50"
                      >
                        Criado em
                        {getSortIcon('created_at')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((item) => (
                    <TableRow key={`${item.tipo}-${item.id}`}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>{(item as any).email || '-'}</TableCell>
                      <TableCell>{getRoleBadge(item)}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {item.tipo === 'usuario' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(item as Profile);
                                setIsEditUserDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserForPassword(item as Profile);
                                setIsPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(item.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCliente(item as Cliente);
                                setIsEditClienteDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCliente(item.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination className="py-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) handlePageChange(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Dialog de Edição de Usuário */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={editingUser?.nome || ''}
                onChange={(e) => setEditingUser(prev => prev ? {...prev, nome: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Perfil</Label>
              <Select
                value={(editingUser as any)?.newRole || getUserRole(editingUser as Profile)}
                onValueChange={(value) => setEditingUser(prev => prev ? {...prev, newRole: value} as any : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advogado">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Alteração de Senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Alterando senha para: <strong>{selectedUserForPassword?.nome}</strong>
            </p>
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsPasswordDialogOpen(false);
                setNewPassword('');
                setSelectedUserForPassword(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword}>Alterar Senha</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de Usuário */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-nome">Nome *</Label>
              <Input
                id="new-nome"
                value={newUser.nome}
                onChange={(e) => setNewUser(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <Label htmlFor="new-email">Email *</Label>
              <Input
                id="new-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="new-user-password">Senha *</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Senha do usuário"
              />
            </div>
            <div>
              <Label htmlFor="new-role">Perfil</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: 'admin' | 'advogado') => setNewUser(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advogado">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreateUserDialogOpen(false);
                setNewUser({ nome: '', email: '', password: '', role: 'advogado' });
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>Criar Usuário</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de Cliente */}
      <Dialog open={isCreateClienteDialogOpen} onOpenChange={setIsCreateClienteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-cliente-nome">Nome *</Label>
              <Input
                id="new-cliente-nome"
                value={newCliente.nome}
                onChange={(e) => setNewCliente(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <Label htmlFor="new-cliente-email">Email</Label>
              <Input
                id="new-cliente-email"
                type="email"
                value={newCliente.email}
                onChange={(e) => setNewCliente(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="new-cliente-telefone">Telefone</Label>
              <Input
                id="new-cliente-telefone"
                value={newCliente.telefone}
                onChange={(e) => setNewCliente(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="new-cliente-cpf">CPF/CNPJ</Label>
              <Input
                id="new-cliente-cpf"
                value={newCliente.cpf_cnpj}
                onChange={(e) => setNewCliente(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label htmlFor="new-cliente-endereco">Endereço</Label>
              <Input
                id="new-cliente-endereco"
                value={newCliente.endereco}
                onChange={(e) => setNewCliente(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <Label htmlFor="new-cliente-obs">Observações</Label>
              <Input
                id="new-cliente-obs"
                value={newCliente.observacoes}
                onChange={(e) => setNewCliente(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreateClienteDialogOpen(false);
                setNewCliente({ nome: '', email: '', telefone: '', cpf_cnpj: '', endereco: '', observacoes: '' });
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCliente}>Criar Cliente</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Cliente */}
      <Dialog open={isEditClienteDialogOpen} onOpenChange={setIsEditClienteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-cliente-nome">Nome</Label>
              <Input
                id="edit-cliente-nome"
                value={editingCliente?.nome || ''}
                onChange={(e) => setEditingCliente(prev => prev ? {...prev, nome: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-cliente-email">Email</Label>
              <Input
                id="edit-cliente-email"
                type="email"
                value={editingCliente?.email || ''}
                onChange={(e) => setEditingCliente(prev => prev ? {...prev, email: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-cliente-telefone">Telefone</Label>
              <Input
                id="edit-cliente-telefone"
                value={editingCliente?.telefone || ''}
                onChange={(e) => setEditingCliente(prev => prev ? {...prev, telefone: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-cliente-cpf">CPF/CNPJ</Label>
              <Input
                id="edit-cliente-cpf"
                value={editingCliente?.cpf_cnpj || ''}
                onChange={(e) => setEditingCliente(prev => prev ? {...prev, cpf_cnpj: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-cliente-endereco">Endereço</Label>
              <Input
                id="edit-cliente-endereco"
                value={editingCliente?.endereco || ''}
                onChange={(e) => setEditingCliente(prev => prev ? {...prev, endereco: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-cliente-obs">Observações</Label>
              <Input
                id="edit-cliente-obs"
                value={editingCliente?.observacoes || ''}
                onChange={(e) => setEditingCliente(prev => prev ? {...prev, observacoes: e.target.value} : null)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditClienteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCliente}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default UserManagement;