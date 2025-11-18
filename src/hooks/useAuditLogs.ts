import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuditLog {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
  metadata: any;
}

export interface AuditSummary {
  table_name: string;
  operation: string;
  total_operations: number;
  unique_users: number;
  first_operation: string;
  last_operation: string;
}

export interface AuditStats {
  totalLogs: number;
  totalUsers: number;
  operationsByType: { operation: string; count: number }[];
  activityByTable: { table: string; count: number }[];
  topUsers: { email: string; count: number }[];
  recentActivity: AuditLog[];
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const carregarLogs = async (filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    tableName?: string;
    operation?: string;
    limit?: number;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.tableName) {
        query = query.eq('table_name', filters.tableName);
      }
      if (filters?.operation) {
        query = query.eq('operation', filters.operation as any);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(1000);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "Erro ao carregar logs",
        description: "Não foi possível carregar os logs de auditoria.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarResumo = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_summary')
        .select('*');

      if (error) throw error;
      setSummary(data || []);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const { data: allLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;
      if (!allLogs) return;

      // Total de logs
      const totalLogs = allLogs.length;

      // Total de usuários únicos
      const uniqueUsers = new Set(allLogs.filter(l => l.user_id).map(l => l.user_id)).size;

      // Operações por tipo
      const operationsMap = new Map<string, number>();
      allLogs.forEach(log => {
        operationsMap.set(log.operation, (operationsMap.get(log.operation) || 0) + 1);
      });
      const operationsByType = Array.from(operationsMap.entries()).map(([operation, count]) => ({
        operation,
        count
      }));

      // Atividade por tabela
      const tablesMap = new Map<string, number>();
      allLogs.forEach(log => {
        tablesMap.set(log.table_name, (tablesMap.get(log.table_name) || 0) + 1);
      });
      const activityByTable = Array.from(tablesMap.entries())
        .map(([table, count]) => ({ table, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top usuários
      const usersMap = new Map<string, number>();
      allLogs.forEach(log => {
        if (log.user_email) {
          usersMap.set(log.user_email, (usersMap.get(log.user_email) || 0) + 1);
        }
      });
      const topUsers = Array.from(usersMap.entries())
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Atividade recente
      const recentActivity = allLogs.slice(0, 50);

      setStats({
        totalLogs,
        totalUsers: uniqueUsers,
        operationsByType,
        activityByTable,
        topUsers,
        recentActivity
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const limparLogsAntigos = async (retentionDays: number = 365) => {
    try {
      const { data, error } = await supabase.rpc('clean_old_audit_logs', {
        retention_days: retentionDays
      });

      if (error) throw error;

      toast({
        title: "Logs limpos com sucesso",
        description: `${data} registros foram removidos.`,
      });

      await carregarLogs();
      await carregarEstatisticas();
    } catch (error: any) {
      console.error('Erro ao limpar logs:', error);
      toast({
        title: "Erro ao limpar logs",
        description: error.message || "Não foi possível limpar os logs antigos.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    carregarLogs();
    carregarResumo();
    carregarEstatisticas();
  }, []);

  return {
    logs,
    summary,
    stats,
    loading,
    carregarLogs,
    carregarResumo,
    carregarEstatisticas,
    limparLogsAntigos
  };
};
