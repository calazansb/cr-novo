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
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Cliente</Badge>;
    }
    
    const role = getUserRole(item as Profile);
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        {role === 'admin' ? 'Administrador' : 'Usuário'}
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

export default UserManagement;