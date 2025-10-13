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
      clientes: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      decisoes_judiciais: {
        Row: {
          adverso: string
          advogado_interno: string
          codigo_unico: string
          comarca: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          id: string
          nome_cliente: string
          nome_magistrado: string
          numero_processo: string
          orgao: string
          procedimento_objeto: string
          resumo_decisao: string
          tipo_decisao: string
          user_id: string | null
          vara_tribunal: string
        }
        Insert: {
          adverso: string
          advogado_interno: string
          codigo_unico: string
          comarca?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          nome_cliente: string
          nome_magistrado: string
          numero_processo: string
          orgao: string
          procedimento_objeto: string
          resumo_decisao: string
          tipo_decisao: string
          user_id?: string | null
          vara_tribunal: string
        }
        Update: {
          adverso?: string
          advogado_interno?: string
          codigo_unico?: string
          comarca?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: string
          nome_cliente?: string
          nome_magistrado?: string
          numero_processo?: string
          orgao?: string
          procedimento_objeto?: string
          resumo_decisao?: string
          tipo_decisao?: string
          user_id?: string | null
          vara_tribunal?: string
        }
        Relationships: []
      }
      option_audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["option_audit_action"]
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          option_item_id: string | null
          option_set_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["option_audit_action"]
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          option_item_id?: string | null
          option_set_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["option_audit_action"]
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          option_item_id?: string | null
          option_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_audit_logs_option_item_id_fkey"
            columns: ["option_item_id"]
            isOneToOne: false
            referencedRelation: "option_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_audit_logs_option_set_id_fkey"
            columns: ["option_set_id"]
            isOneToOne: false
            referencedRelation: "option_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      option_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          meta: Json | null
          option_set_id: string
          order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
          meta?: Json | null
          option_set_id: string
          order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          meta?: Json | null
          option_set_id?: string
          order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_items_option_set_id_fkey"
            columns: ["option_set_id"]
            isOneToOne: false
            referencedRelation: "option_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      option_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      option_versions: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          option_set_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          option_set_id: string
          snapshot: Json
          version: number
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          option_set_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "option_versions_option_set_id_fkey"
            columns: ["option_set_id"]
            isOneToOne: false
            referencedRelation: "option_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      pendencias_urgencias: {
        Row: {
          cliente: string
          codigo_unico: string
          created_at: string
          descricao: string
          id: string
          numero_processo: string
          observacoes: string | null
          orgao: string
          prazo_limite: string
          responsavel: string
          tipo_urgencia: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cliente: string
          codigo_unico: string
          created_at?: string
          descricao: string
          id?: string
          numero_processo: string
          observacoes?: string | null
          orgao: string
          prazo_limite: string
          responsavel: string
          tipo_urgencia: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cliente?: string
          codigo_unico?: string
          created_at?: string
          descricao?: string
          id?: string
          numero_processo?: string
          observacoes?: string | null
          orgao?: string
          prazo_limite?: string
          responsavel?: string
          tipo_urgencia?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string | null
          perfil: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nome?: string | null
          perfil?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          perfil?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      solicitacoes_controladoria: {
        Row: {
          anexos: string[] | null
          anexos_resposta: string[] | null
          cliente: string
          codigo_unico: string
          data_atualizacao: string
          data_criacao: string
          descricao_detalhada: string
          id: string
          nome_solicitante: string
          numero_processo: string | null
          objeto_solicitacao: string
          observacoes: string | null
          prazo_retorno: string | null
          status: string | null
          tipo_solicitacao: string | null
          ultima_modificacao_em: string | null
          ultima_modificacao_por: string | null
          user_id: string | null
        }
        Insert: {
          anexos?: string[] | null
          anexos_resposta?: string[] | null
          cliente: string
          codigo_unico: string
          data_atualizacao?: string
          data_criacao?: string
          descricao_detalhada: string
          id?: string
          nome_solicitante: string
          numero_processo?: string | null
          objeto_solicitacao: string
          observacoes?: string | null
          prazo_retorno?: string | null
          status?: string | null
          tipo_solicitacao?: string | null
          ultima_modificacao_em?: string | null
          ultima_modificacao_por?: string | null
          user_id?: string | null
        }
        Update: {
          anexos?: string[] | null
          anexos_resposta?: string[] | null
          cliente?: string
          codigo_unico?: string
          data_atualizacao?: string
          data_criacao?: string
          descricao_detalhada?: string
          id?: string
          nome_solicitante?: string
          numero_processo?: string | null
          objeto_solicitacao?: string
          observacoes?: string | null
          prazo_retorno?: string | null
          status?: string | null
          tipo_solicitacao?: string | null
          ultima_modificacao_em?: string | null
          ultima_modificacao_por?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_controladoria_ultima_modificacao_por_fkey"
            columns: ["ultima_modificacao_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "advogado" | "cliente"
      option_audit_action:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "RESTORE"
        | "ACTIVATE"
        | "DEACTIVATE"
        | "REORDER"
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
      app_role: ["admin", "advogado", "cliente"],
      option_audit_action: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "RESTORE",
        "ACTIVATE",
        "DEACTIVATE",
        "REORDER",
      ],
    },
  },
} as const
