import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Edit, Shield, Mail, Calendar, Key, Trash2, UserPlus, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'advogado';
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

const UserManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', role: 'advogado' as 'admin' | 'advogado' });
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário atual é admin
      const { data: adminCheck } = await supabase.rpc('is_admin');
      setIsAdmin(adminCheck === true);
      
      if (!adminCheck) {
        throw new Error('Acesso negado: Apenas administradores podem gerenciar usuários');
      }

      // Buscar profiles com roles
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

      // Combinar dados
      const usersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        roles: (rolesData || []).filter(role => role.user_id === profile.user_id)
      }));

      setUsers(usersWithRoles as Profile[]);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: Profile) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
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
          .eq('user_id', editingUser.user_id);

        // Inserir nova role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: editingUser.user_id, role: newRole });

        if (roleError) throw roleError;
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso.",
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: Profile) => {
    try {
      // Primeiro deletar da tabela profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário.",
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
      // Usar edge function para resetar senha com privilégios de admin
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Não autenticado')
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
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar senha')
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

      setIsCreateDialogOpen(false);
      setNewUser({ nome: '', email: '', password: '', role: 'advogado' });
      fetchUsers();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleImportUsers = async () => {
    if (!importText.trim()) {
      toast({
        title: "Erro",
        description: "Cole a lista de usuários para importar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse a lista - formato: Nome \t Email ou Nome * \t Email
      const lines = importText.split('\n').filter(line => line.trim());
      const usersToImport: Array<{ nome: string; email: string }> = [];

      for (const line of lines) {
        const parts = line.split('\t').map(p => p.trim());
        if (parts.length >= 2) {
          const nome = parts[0].replace(/\*+$/g, '').trim(); // Remove todos os asteriscos do final
          const email = parts[1].trim();
          
          if (nome && email && email.includes('@')) {
            usersToImport.push({ nome, email });
          }
        }
      }

      if (usersToImport.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum usuário válido encontrado. Verifique o formato da lista.",
          variant: "destructive",
        });
        return;
      }

      // Confirmar importação
      const confirmed = confirm(`Deseja importar ${usersToImport.length} usuários?\n\nSenha padrão: CalazansRossi2024\n\nTodos os usuários serão criados com perfil 'Advogado'.`);
      if (!confirmed) return;

      let successCount = 0;
      let errorCount = 0;
      const defaultPassword = 'CalazansRossi2024';

      setImportProgress({ current: 0, total: usersToImport.length });

      for (let i = 0; i < usersToImport.length; i++) {
        const user = usersToImport[i];
        
        try {
          // Criar usuário via auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: defaultPassword,
            options: {
              data: {
                nome: user.nome
              }
            }
          });

          if (authError) {
            console.error(`Erro ao criar ${user.email}:`, authError);
            errorCount++;
            continue;
          }

          if (!authData.user) {
            errorCount++;
            continue;
          }

          // Criar profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              user_id: authData.user.id,
              nome: user.nome,
              email: user.email
            });

          if (profileError) {
            console.error(`Erro ao criar profile ${user.email}:`, profileError);
            errorCount++;
            continue;
          }

          // Criar role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'advogado'
            });

          if (roleError) {
            console.error(`Erro ao criar role ${user.email}:`, roleError);
            errorCount++;
            continue;
          }

          successCount++;
          setImportProgress({ current: i + 1, total: usersToImport.length });

          // Delay para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Erro ao processar ${user.email}:`, error);
          errorCount++;
        }
      }

      setImportProgress(null);

      toast({
        title: "Importação Concluída",
        description: `${successCount} usuários criados com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ''}.`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      setIsImportDialogOpen(false);
      setImportText('');
      fetchUsers();
    } catch (error) {
      console.error('Erro ao importar usuários:', error);
      setImportProgress(null);
      toast({
        title: "Erro",
        description: "Erro ao processar importação.",
        variant: "destructive",
      });
    }
  };

  const getUserRole = (user: Profile): 'admin' | 'advogado' => {
    return user.roles?.[0]?.role || 'advogado';
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? Shield : Users;
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
          <p className="text-sm text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">Gerencie usuários e suas permissões no sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {users.length} usuários
          </Badge>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importar Usuários
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Importar Usuários em Massa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Alert>
                  <AlertDescription>
                    <p className="font-semibold mb-2">Instruções:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Cole a lista de usuários com formato: <code>Nome [TAB] Email</code></li>
                      <li>Todos os usuários serão criados com senha padrão: <strong>CalazansRossi2024</strong></li>
                      <li>Perfil padrão: <strong>Advogado</strong></li>
                      <li>Você pode editar o perfil individualmente depois</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="import-text">Lista de Usuários</Label>
                  <textarea
                    id="import-text"
                    className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                    placeholder="Marlus Riani*&#9;marlus@calazansrossi.com.br&#10;Aline Martins*&#9;aline@calazansrossi.com.br&#10;..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    disabled={!!importProgress}
                  />
                  {importProgress && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Importando... {importProgress.current} de {importProgress.total}
                      </p>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      setImportText('');
                    }}
                    className="flex-1"
                    disabled={!!importProgress}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImportUsers}
                    className="flex-1"
                    disabled={!!importProgress}
                  >
                    {importProgress ? 'Importando...' : 'Importar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                      setIsCreateDialogOpen(false);
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
        </div>
      </div>

      {users.length === 0 ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Nenhum usuário encontrado no sistema.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => {
            const userRole = getUserRole(user);
            const RoleIcon = getRoleIcon(userRole);
            return (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold">
                        {user.nome}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(userRole)} className="flex items-center gap-1 shrink-0">
                      <RoleIcon className="w-3 h-3" />
                      {userRole === 'admin' ? 'Admin' : 'Advogado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="space-y-2">
                      <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setEditingUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Editar Usuário</DialogTitle>
                        </DialogHeader>
                        {editingUser && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="nome">Nome</Label>
                              <Input
                                id="nome"
                                value={editingUser.nome}
                                onChange={(e) => setEditingUser({
                                  ...editingUser,
                                  nome: e.target.value
                                })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                value={editingUser.email}
                                disabled
                                className="bg-muted"
                              />
                              <p className="text-xs text-muted-foreground">
                                O email não pode ser alterado
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="perfil">Perfil</Label>
                              <Select
                                value={(editingUser as any).newRole || getUserRole(editingUser)}
                                onValueChange={(value: 'admin' | 'advogado') => 
                                  setEditingUser({
                                    ...editingUser,
                                    newRole: value
                                  } as any)
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
                                  setIsEditDialogOpen(false);
                                  setEditingUser(null);
                                }}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleSaveUser}
                                className="flex-1"
                              >
                                Salvar
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openPasswordDialog(user)}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá excluir permanentemente o usuário
                            <strong> {user.nome} </strong> e remover todos os seus dados do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(user)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Dialog para alterar senha */}
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
              <Button
                onClick={handleChangePassword}
                className="flex-1"
              >
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