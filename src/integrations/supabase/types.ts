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
      analises_decisoes: {
        Row: {
          created_at: string | null
          data_analise: string | null
          decisao_id: string
          doutrinas_citadas: Json | null
          id: string
          julgados_citados: Json | null
          padrao_decisao: string | null
          termos_frequentes: Json | null
        }
        Insert: {
          created_at?: string | null
          data_analise?: string | null
          decisao_id: string
          doutrinas_citadas?: Json | null
          id?: string
          julgados_citados?: Json | null
          padrao_decisao?: string | null
          termos_frequentes?: Json | null
        }
        Update: {
          created_at?: string | null
          data_analise?: string | null
          decisao_id?: string
          doutrinas_citadas?: Json | null
          id?: string
          julgados_citados?: Json | null
          padrao_decisao?: string | null
          termos_frequentes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analises_decisoes_decisao_id_fkey"
            columns: ["decisao_id"]
            isOneToOne: false
            referencedRelation: "decisoes_judiciais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analises_decisoes_decisao_id_fkey"
            columns: ["decisao_id"]
            isOneToOne: false
            referencedRelation: "fato_decisao"
            referencedColumns: ["decisao_id"]
          },
        ]
      }
      assistencia_tecnica: {
        Row: {
          codigo_unico: string
          created_at: string
          id: string
          nivel_urgencia: string
          nome_solicitante: string
          observacoes: string | null
          solicitacao_problema: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          codigo_unico: string
          created_at?: string
          id?: string
          nivel_urgencia: string
          nome_solicitante: string
          observacoes?: string | null
          solicitacao_problema: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          codigo_unico?: string
          created_at?: string
          id?: string
          nivel_urgencia?: string
          nome_solicitante?: string
          observacoes?: string | null
          solicitacao_problema?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bloqueios_judiciais: {
        Row: {
          agencia: string | null
          cliente: string
          codigo_unico: string
          conta: string | null
          created_at: string
          data_bloqueio: string
          descricao: string
          id: string
          instituicao_financeira: string | null
          numero_processo: string
          observacoes: string | null
          orgao: string
          responsavel: string
          tipo_bloqueio: string
          updated_at: string
          user_id: string | null
          valor_bloqueado: number | null
        }
        Insert: {
          agencia?: string | null
          cliente: string
          codigo_unico: string
          conta?: string | null
          created_at?: string
          data_bloqueio: string
          descricao: string
          id?: string
          instituicao_financeira?: string | null
          numero_processo: string
          observacoes?: string | null
          orgao: string
          responsavel: string
          tipo_bloqueio: string
          updated_at?: string
          user_id?: string | null
          valor_bloqueado?: number | null
        }
        Update: {
          agencia?: string | null
          cliente?: string
          codigo_unico?: string
          conta?: string | null
          created_at?: string
          data_bloqueio?: string
          descricao?: string
          id?: string
          instituicao_financeira?: string | null
          numero_processo?: string
          observacoes?: string | null
          orgao?: string
          responsavel?: string
          tipo_bloqueio?: string
          updated_at?: string
          user_id?: string | null
          valor_bloqueado?: number | null
        }
        Relationships: []
      }
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
          arquivo_nome: string | null
          arquivo_url: string | null
          autor: string | null
          codigo_unico: string
          comarca: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_decisao: string | null
          economia_gerada: number | null
          hash_arquivo: string | null
          id: string
          montante_reconhecido: number | null
          nome_cliente: string
          nome_magistrado: string
          numero_processo: string
          orgao: string
          percentual_exonerado: number | null
          polo_cliente: string | null
          procedimento_objeto: string
          resultado: string | null
          resumo_decisao: string
          reu: string | null
          sharepoint_drive_id: string | null
          sharepoint_item_id: string | null
          tipo_decisao: string
          user_id: string | null
          valor_disputa: number | null
          vara_tribunal: string
        }
        Insert: {
          adverso: string
          advogado_interno: string
          arquivo_nome?: string | null
          arquivo_url?: string | null
          autor?: string | null
          codigo_unico: string
          comarca?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_decisao?: string | null
          economia_gerada?: number | null
          hash_arquivo?: string | null
          id?: string
          montante_reconhecido?: number | null
          nome_cliente: string
          nome_magistrado: string
          numero_processo: string
          orgao: string
          percentual_exonerado?: number | null
          polo_cliente?: string | null
          procedimento_objeto: string
          resultado?: string | null
          resumo_decisao: string
          reu?: string | null
          sharepoint_drive_id?: string | null
          sharepoint_item_id?: string | null
          tipo_decisao: string
          user_id?: string | null
          valor_disputa?: number | null
          vara_tribunal: string
        }
        Update: {
          adverso?: string
          advogado_interno?: string
          arquivo_nome?: string | null
          arquivo_url?: string | null
          autor?: string | null
          codigo_unico?: string
          comarca?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_decisao?: string | null
          economia_gerada?: number | null
          hash_arquivo?: string | null
          id?: string
          montante_reconhecido?: number | null
          nome_cliente?: string
          nome_magistrado?: string
          numero_processo?: string
          orgao?: string
          percentual_exonerado?: number | null
          polo_cliente?: string | null
          procedimento_objeto?: string
          resultado?: string | null
          resumo_decisao?: string
          reu?: string | null
          sharepoint_drive_id?: string | null
          sharepoint_item_id?: string | null
          tipo_decisao?: string
          user_id?: string | null
          valor_disputa?: number | null
          vara_tribunal?: string
        }
        Relationships: []
      }
      decisores: {
        Row: {
          camara_turma: string | null
          created_at: string | null
          id: string
          nome: string
          tipo: string | null
          tribunal: string | null
        }
        Insert: {
          camara_turma?: string | null
          created_at?: string | null
          id?: string
          nome: string
          tipo?: string | null
          tribunal?: string | null
        }
        Update: {
          camara_turma?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string | null
          tribunal?: string | null
        }
        Relationships: []
      }
      doutrinas: {
        Row: {
          analise_id: string | null
          created_at: string | null
          doutrinador: string | null
          fonte: string | null
          id: string
          obra: string | null
          trecho: string | null
        }
        Insert: {
          analise_id?: string | null
          created_at?: string | null
          doutrinador?: string | null
          fonte?: string | null
          id?: string
          obra?: string | null
          trecho?: string | null
        }
        Update: {
          analise_id?: string | null
          created_at?: string | null
          doutrinador?: string | null
          fonte?: string | null
          id?: string
          obra?: string | null
          trecho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doutrinas_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "analises_decisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      julgados_citados: {
        Row: {
          analise_id: string | null
          created_at: string | null
          data_julgamento: string | null
          fonte: string | null
          id: string
          numero_processo: string | null
          trecho: string | null
          tribunal: string | null
        }
        Insert: {
          analise_id?: string | null
          created_at?: string | null
          data_julgamento?: string | null
          fonte?: string | null
          id?: string
          numero_processo?: string | null
          trecho?: string | null
          tribunal?: string | null
        }
        Update: {
          analise_id?: string | null
          created_at?: string | null
          data_julgamento?: string | null
          fonte?: string | null
          id?: string
          numero_processo?: string | null
          trecho?: string | null
          tribunal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "julgados_citados_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "analises_decisoes"
            referencedColumns: ["id"]
          },
        ]
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
      partes: {
        Row: {
          documento: string | null
          id: string
          nome: string
          processo_id: string | null
          tipo: string | null
        }
        Insert: {
          documento?: string | null
          id?: string
          nome: string
          processo_id?: string | null
          tipo?: string | null
        }
        Update: {
          documento?: string | null
          id?: string
          nome?: string
          processo_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
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
      processos: {
        Row: {
          assunto: string | null
          camara_turma: string | null
          classe_processual: string | null
          cliente_id: string | null
          created_at: string | null
          id: string
          instancia: string | null
          numero_cnj: string
          polo_cliente: string | null
          tribunal: string | null
          updated_at: string | null
          valor_causa: number | null
          vara: string | null
        }
        Insert: {
          assunto?: string | null
          camara_turma?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          instancia?: string | null
          numero_cnj: string
          polo_cliente?: string | null
          tribunal?: string | null
          updated_at?: string | null
          valor_causa?: number | null
          vara?: string | null
        }
        Update: {
          assunto?: string | null
          camara_turma?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          instancia?: string | null
          numero_cnj?: string
          polo_cliente?: string | null
          tribunal?: string | null
          updated_at?: string | null
          valor_causa?: number | null
          vara?: string | null
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
      sugestoes_erros: {
        Row: {
          acao_corretiva: string | null
          beneficios: string | null
          categoria: string
          cliente: string | null
          codigo_unico: string
          created_at: string
          descricao: string
          gravidade: string | null
          id: string
          impacto: string | null
          numero_processo: string | null
          observacoes: string | null
          prazo_correcao: string | null
          responsavel: string | null
          status: string | null
          tipo: string
          tipo_erro: string | null
          titulo: string
          updated_at: string
          urgencia: string
          user_id: string | null
        }
        Insert: {
          acao_corretiva?: string | null
          beneficios?: string | null
          categoria: string
          cliente?: string | null
          codigo_unico: string
          created_at?: string
          descricao: string
          gravidade?: string | null
          id?: string
          impacto?: string | null
          numero_processo?: string | null
          observacoes?: string | null
          prazo_correcao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo: string
          tipo_erro?: string | null
          titulo: string
          updated_at?: string
          urgencia: string
          user_id?: string | null
        }
        Update: {
          acao_corretiva?: string | null
          beneficios?: string | null
          categoria?: string
          cliente?: string | null
          codigo_unico?: string
          created_at?: string
          descricao?: string
          gravidade?: string | null
          id?: string
          impacto?: string | null
          numero_processo?: string | null
          observacoes?: string | null
          prazo_correcao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string
          tipo_erro?: string | null
          titulo?: string
          updated_at?: string
          urgencia?: string
          user_id?: string | null
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
      dim_magistrado: {
        Row: {
          camara_turma: string | null
          nome: string | null
          tribunal: string | null
        }
        Relationships: []
      }
      dim_tema: {
        Row: {
          tema_normalizado: string | null
        }
        Relationships: []
      }
      dim_tribunal: {
        Row: {
          esfera: string | null
          tribunal: string | null
        }
        Relationships: []
      }
      fato_decisao: {
        Row: {
          ano: number | null
          camara_turma: string | null
          cliente: string | null
          count_desfavoravel: number | null
          count_favoravel: number | null
          count_parcial: number | null
          data_decisao: string | null
          decisao_id: string | null
          economia_gerada_brl: number | null
          magistrado_nome: string | null
          mes: number | null
          percentual_exito: number | null
          polo_cliente: string | null
          processo_id: string | null
          tema: string | null
          tipo_decisao: string | null
          tribunal: string | null
          trimestre: number | null
          valor_em_disputa_brl: number | null
        }
        Insert: {
          ano?: never
          camara_turma?: string | null
          cliente?: string | null
          count_desfavoravel?: never
          count_favoravel?: never
          count_parcial?: never
          data_decisao?: string | null
          decisao_id?: string | null
          economia_gerada_brl?: number | null
          magistrado_nome?: string | null
          mes?: never
          percentual_exito?: never
          polo_cliente?: string | null
          processo_id?: string | null
          tema?: string | null
          tipo_decisao?: string | null
          tribunal?: string | null
          trimestre?: never
          valor_em_disputa_brl?: number | null
        }
        Update: {
          ano?: never
          camara_turma?: string | null
          cliente?: string | null
          count_desfavoravel?: never
          count_favoravel?: never
          count_parcial?: never
          data_decisao?: string | null
          decisao_id?: string | null
          economia_gerada_brl?: number | null
          magistrado_nome?: string | null
          mes?: never
          percentual_exito?: never
          polo_cliente?: string | null
          processo_id?: string | null
          tema?: string | null
          tipo_decisao?: string | null
          tribunal?: string | null
          trimestre?: never
          valor_em_disputa_brl?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
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
