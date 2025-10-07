export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assistencia_tecnica: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string
          id: string
          prioridade: string | null
          solicitante: string
          status: string | null
          tecnico_responsavel: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          prioridade?: string | null
          solicitante: string
          status?: string | null
          tecnico_responsavel?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          prioridade?: string | null
          solicitante?: string
          status?: string | null
          tecnico_responsavel?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      "Balcão Virtual": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      decisoes_judiciais: {
        Row: {
          cliente: string
          conteudo_decisao: string
          created_at: string | null
          id: string
          numero_processo: string
          status: string | null
          tipo_decisao: string
          updated_at: string | null
        }
        Insert: {
          cliente: string
          conteudo_decisao: string
          created_at?: string | null
          id?: string
          numero_processo: string
          status?: string | null
          tipo_decisao: string
          updated_at?: string | null
        }
        Update: {
          cliente?: string
          conteudo_decisao?: string
          created_at?: string | null
          id?: string
          numero_processo?: string
          status?: string | null
          tipo_decisao?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      erros: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          reportado_por: string
          severidade: string | null
          sistema_afetado: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          reportado_por: string
          severidade?: string | null
          sistema_afetado?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          reportado_por?: string
          severidade?: string | null
          sistema_afetado?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pendencias: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          prazo_limite: string | null
          prioridade: string | null
          responsavel: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          prazo_limite?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          prazo_limite?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string
          perfil: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          nome: string
          perfil?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          perfil?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      solicitacoes_controladoria: {
        Row: {
          anexos: Json | null
          cliente: string
          codigo_unico: string
          data_atualizacao: string | null
          data_criacao: string | null
          descricao_detalhada: string
          id: string
          nome_solicitante: string
          numero_processo: string | null
          objeto_solicitacao: string
          observacoes: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          anexos?: Json | null
          cliente: string
          codigo_unico: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao_detalhada: string
          id?: string
          nome_solicitante: string
          numero_processo?: string | null
          objeto_solicitacao: string
          observacoes?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          anexos?: Json | null
          cliente?: string
          codigo_unico?: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao_detalhada?: string
          id?: string
          nome_solicitante?: string
          numero_processo?: string | null
          objeto_solicitacao?: string
          observacoes?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sugestoes: {
        Row: {
          autor: string
          categoria: string | null
          created_at: string | null
          descricao: string
          id: string
          status: string | null
          titulo: string
          updated_at: string | null
          votos_positivos: number | null
        }
        Insert: {
          autor: string
          categoria?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          status?: string | null
          titulo: string
          updated_at?: string | null
          votos_positivos?: number | null
        }
        Update: {
          autor?: string
          categoria?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          status?: string | null
          titulo?: string
          updated_at?: string | null
          votos_positivos?: number | null
        }
        Relationships: []
      }
      treinamento_progresso: {
        Row: {
          concluido: boolean | null
          concluido_em: string | null
          id: string
          iniciado_em: string | null
          pagina_atual: number | null
          tempo_total_segundos: number | null
          total_paginas: number | null
          treinamento_id: string
          user_id: string
        }
        Insert: {
          concluido?: boolean | null
          concluido_em?: string | null
          id?: string
          iniciado_em?: string | null
          pagina_atual?: number | null
          tempo_total_segundos?: number | null
          total_paginas?: number | null
          treinamento_id: string
          user_id: string
        }
        Update: {
          concluido?: boolean | null
          concluido_em?: string | null
          id?: string
          iniciado_em?: string | null
          pagina_atual?: number | null
          tempo_total_segundos?: number | null
          total_paginas?: number | null
          treinamento_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_progresso_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_tempo_detalhado: {
        Row: {
          created_at: string | null
          id: string
          pagina: number
          progresso_id: string
          secao: string | null
          segundos_gastos: number | null
          tempo_fim: string | null
          tempo_inicio: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pagina: number
          progresso_id: string
          secao?: string | null
          segundos_gastos?: number | null
          tempo_fim?: string | null
          tempo_inicio: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pagina?: number
          progresso_id?: string
          secao?: string | null
          segundos_gastos?: number | null
          tempo_fim?: string | null
          tempo_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_tempo_detalhado_progresso_id_fkey"
            columns: ["progresso_id"]
            isOneToOne: false
            referencedRelation: "treinamento_progresso"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          ativo: boolean | null
          created_at: string | null
          created_by: string
          descricao: string | null
          id: string
          obrigatorio: boolean | null
          tipo_conteudo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          ativo?: boolean | null
          created_at?: string | null
          created_by: string
          descricao?: string | null
          id?: string
          obrigatorio?: boolean | null
          tipo_conteudo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string
          descricao?: string | null
          id?: string
          obrigatorio?: boolean | null
          tipo_conteudo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_codigo_controladoria: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "advogado" | "moderator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "advogado", "moderator"],
    },
  },
} as const
