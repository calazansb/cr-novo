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
import { Users, Edit, Shield, Mail, Key, Trash2, UserPlus, Search, Building2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  // Aplicar filtros
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

    setFilteredItems(resultado);
  }, [filtroTipo, filtroBusca, items]);

  const getUserRole = (user: Profile): 'admin' | 'advogado' | 'cliente' => {
    return user.roles?.[0]?.role || 'advogado';
  };

  const getRoleBadge = (item: ItemLista) => {
    if (item.tipo === 'cliente') {
      return <Badge variant="outline" className="flex items-center gap-1"><Building2 className="w-3 h-3" />Cliente</Badge>;
    }
    const role = getUserRole(item as Profile);
    if (role === 'admin') {
      return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="w-3 h-3" />Administrador</Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1"><Users className="w-3 h-3" />Advogado</Badge>;
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser({ ...user });
    setIsEditUserDialogOpen(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente({ ...cliente });
    setIsEditClienteDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // Atualizar nome no profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nome: editingUser.nome })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Atualizar role
      const currentRole = editingUser.roles?.[0]?.role || 'advogado';
      const newRole = (editingUser as any).newRole || currentRole;

      if (newRole !== currentRole) {
        // Deletar role antiga
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id);

        // Inserir nova role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: editingUser.id, role: newRole });

        if (roleError) throw roleError;
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso.",
      });

      setIsEditUserDialogOpen(false);
      setEditingUser(null);
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

  const handleSaveCliente = async () => {
    if (!editingCliente) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: editingCliente.nome,
          email: editingCliente.email,
          telefone: editingCliente.telefone,
          cpf_cnpj: editingCliente.cpf_cnpj,
          endereco: editingCliente.endereco,
          observacoes: editingCliente.observacoes
        })
        .eq('id', editingCliente.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso.",
      });

      setIsEditClienteDialogOpen(false);
      setEditingCliente(null);
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

  const handleDeleteUser = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso.",
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCliente = async (cliente: Cliente) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente removido com sucesso.",
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUserForPassword || !newPassword) {
      toast({
        title: "Erro",
        description: "Digite uma nova senha.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await fetch('https://yqeufugteljrmvlvfpcd.supabase.co/functions/v1/admin-reset-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserForPassword.user_id,
          newPassword: newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar senha');
      }

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
        description: error instanceof Error ? error.message : "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const openPasswordDialog = (user: Profile) => {
    setSelectedUserForPassword(user);
    setIsPasswordDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar usuário via auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            nome: newUser.nome
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Criar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_id: authData.user.id,
          nome: newUser.nome,
          email: newUser.email
        });

      if (profileError) throw profileError;

      // Criar role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: newUser.role
        });

      if (roleError) throw roleError;

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
        description: "Nome do cliente é obrigatório.",
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gerenciar Usuários e Clientes</h2>
          <p className="text-muted-foreground">Gerencie usuários, permissões e clientes do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-nome">Nome</Label>
                  <Input
                    id="new-nome"
                    value={newUser.nome}
                    onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Perfil</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: 'admin' | 'advogado') => 
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advogado">Advogado</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateUserDialogOpen(false);
                      setNewUser({ nome: '', email: '', password: '', role: 'advogado' });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    className="flex-1"
                  >
                    Criar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateClienteDialogOpen} onOpenChange={setIsCreateClienteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Building2 className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="cliente-nome">Nome *</Label>
                  <Input
                    id="cliente-nome"
                    value={newCliente.nome}
                    onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente-email">Email</Label>
                  <Input
                    id="cliente-email"
                    type="email"
                    value={newCliente.email}
                    onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente-telefone">Telefone</Label>
                  <Input
                    id="cliente-telefone"
                    value={newCliente.telefone}
                    onChange={(e) => setNewCliente({ ...newCliente, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente-cpf">CPF/CNPJ</Label>
                  <Input
                    id="cliente-cpf"
                    value={newCliente.cpf_cnpj}
                    onChange={(e) => setNewCliente({ ...newCliente, cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente-endereco">Endereço</Label>
                  <Input
                    id="cliente-endereco"
                    value={newCliente.endereco}
                    onChange={(e) => setNewCliente({ ...newCliente, endereco: e.target.value })}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente-obs">Observações</Label>
                  <Input
                    id="cliente-obs"
                    value={newCliente.observacoes}
                    onChange={(e) => setNewCliente({ ...newCliente, observacoes: e.target.value })}
                    placeholder="Observações adicionais"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateClienteDialogOpen(false);
                      setNewCliente({ nome: '', email: '', telefone: '', cpf_cnpj: '', endereco: '', observacoes: '' });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateCliente}
                    className="flex-1"
                  >
                    Criar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-tipo">Filtrar por Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger id="filtro-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="advogado">Advogado</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro-busca">Buscar por Nome ou Email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="filtro-busca"
                  className="pl-10"
                  placeholder="Digite para buscar..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {item.email || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(item)}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {item.tipo === 'usuario' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(item as Profile)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPasswordDialog(item as Profile)}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o usuário <strong>{item.nome}</strong>? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(item as Profile)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCliente(item as Cliente)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o cliente <strong>{item.nome}</strong>? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCliente(item as Cliente)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Editar Usuário */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input
                  id="edit-nome"
                  value={editingUser.nome}
                  onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editingUser.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-perfil">Perfil</Label>
                <Select
                  value={(editingUser as any).newRole || getUserRole(editingUser)}
                  onValueChange={(value: 'admin' | 'advogado') => 
                    setEditingUser({ ...editingUser, newRole: value } as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advogado">Advogado</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditUserDialogOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveUser} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Cliente */}
      <Dialog open={isEditClienteDialogOpen} onOpenChange={setIsEditClienteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingCliente && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-nome">Nome *</Label>
                <Input
                  id="edit-cliente-nome"
                  value={editingCliente.nome}
                  onChange={(e) => setEditingCliente({ ...editingCliente, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-email">Email</Label>
                <Input
                  id="edit-cliente-email"
                  type="email"
                  value={editingCliente.email || ''}
                  onChange={(e) => setEditingCliente({ ...editingCliente, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-telefone">Telefone</Label>
                <Input
                  id="edit-cliente-telefone"
                  value={editingCliente.telefone || ''}
                  onChange={(e) => setEditingCliente({ ...editingCliente, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-cpf">CPF/CNPJ</Label>
                <Input
                  id="edit-cliente-cpf"
                  value={editingCliente.cpf_cnpj || ''}
                  onChange={(e) => setEditingCliente({ ...editingCliente, cpf_cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-endereco">Endereço</Label>
                <Input
                  id="edit-cliente-endereco"
                  value={editingCliente.endereco || ''}
                  onChange={(e) => setEditingCliente({ ...editingCliente, endereco: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-obs">Observações</Label>
                <Input
                  id="edit-cliente-obs"
                  value={editingCliente.observacoes || ''}
                  onChange={(e) => setEditingCliente({ ...editingCliente, observacoes: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditClienteDialogOpen(false);
                    setEditingCliente(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveCliente} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Alterando senha para: <strong>{selectedUserForPassword?.nome}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                minLength={6}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setNewPassword('');
                  setSelectedUserForPassword(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleChangePassword} className="flex-1">
                Alterar Senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;