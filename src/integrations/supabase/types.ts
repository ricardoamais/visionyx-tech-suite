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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      caixa_movimentos: {
        Row: {
          caixa_id: string | null
          company_id: string | null
          created_at: string | null
          data_movimento: string | null
          descricao: string
          forma_pagamento: string | null
          id: string
          origem: string | null
          origem_id: string | null
          tipo: string
          valor: number
        }
        Insert: {
          caixa_id?: string | null
          company_id?: string | null
          created_at?: string | null
          data_movimento?: string | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          origem?: string | null
          origem_id?: string | null
          tipo: string
          valor?: number
        }
        Update: {
          caixa_id?: string | null
          company_id?: string | null
          created_at?: string | null
          data_movimento?: string | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          origem?: string | null
          origem_id?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_movimentos_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_movimentos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      caixas: {
        Row: {
          company_id: string | null
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["caixa_status"]
          updated_at: string
          user_id: string
          valor_abertura: number
          valor_fechamento: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["caixa_status"]
          updated_at?: string
          user_id: string
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["caixa_status"]
          updated_at?: string
          user_id?: string
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          company_id: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          company_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          endereco: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          payment_status: string | null
          phone: string | null
          plan: string | null
          plan_expires_at: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          payment_status?: string | null
          phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          payment_status?: string | null
          phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contas: {
        Row: {
          categoria: string | null
          company_id: string | null
          created_at: string
          descricao: string
          forma_pagamento: string | null
          id: string
          orcamento_id: string | null
          ordem_servico_id: string | null
          parcelas: number | null
          status: Database["public"]["Enums"]["conta_status"]
          tipo: Database["public"]["Enums"]["conta_tipo"]
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          orcamento_id?: string | null
          ordem_servico_id?: string | null
          parcelas?: number | null
          status?: Database["public"]["Enums"]["conta_status"]
          tipo: Database["public"]["Enums"]["conta_tipo"]
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          orcamento_id?: string | null
          ordem_servico_id?: string | null
          parcelas?: number | null
          status?: Database["public"]["Enums"]["conta_status"]
          tipo?: Database["public"]["Enums"]["conta_tipo"]
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_pagamentos: {
        Row: {
          company_id: string | null
          contrato_id: string | null
          created_at: string | null
          data_pagamento: string | null
          forma_pagamento: string | null
          id: string
          mes_referencia: string
          observacoes: string | null
          status: string
          valor: number
          vencimento: string
        }
        Insert: {
          company_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?: string | null
          id?: string
          mes_referencia: string
          observacoes?: string | null
          status?: string
          valor: number
          vencimento: string
        }
        Update: {
          company_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?: string | null
          id?: string
          mes_referencia?: string
          observacoes?: string | null
          status?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_pagamentos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_pagamentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cnpj: string | null
          company_id: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          descricao_servicos: string | null
          dia_vencimento: number
          empresa_nome: string
          endereco: string | null
          id: string
          observacoes: string | null
          status: string
          valor_mensal: number
        }
        Insert: {
          cnpj?: string | null
          company_id?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao_servicos?: string | null
          dia_vencimento?: number
          empresa_nome: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          valor_mensal?: number
        }
        Update: {
          cnpj?: string | null
          company_id?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao_servicos?: string | null
          dia_vencimento?: number
          empresa_nome?: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_usuarios: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          acessorios: string | null
          cliente_id: string
          company_id: string | null
          created_at: string
          defeito_relatado: string | null
          id: string
          marca: string
          modelo: string | null
          numero_serie: string | null
          observacoes: string | null
          senha_equipamento: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          acessorios?: string | null
          cliente_id: string
          company_id?: string | null
          created_at?: string
          defeito_relatado?: string | null
          id?: string
          marca: string
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          senha_equipamento?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          acessorios?: string | null
          cliente_id?: string
          company_id?: string | null
          created_at?: string
          defeito_relatado?: string | null
          id?: string
          marca?: string
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          senha_equipamento?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamentos_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          company_id: string | null
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          orcamento_id: string
          quantidade?: number
          valor_unitario?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cliente_id: string
          company_id: string | null
          created_at: string
          id: string
          numero: string
          observacoes: string | null
          ordem_servico_id: string | null
          status: Database["public"]["Enums"]["orcamento_status"]
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_id: string
          company_id?: string | null
          created_at?: string
          id?: string
          numero?: string
          observacoes?: string | null
          ordem_servico_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          valor_total?: number
        }
        Update: {
          cliente_id?: string
          company_id?: string | null
          created_at?: string
          id?: string
          numero?: string
          observacoes?: string | null
          ordem_servico_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          cliente_id: string
          company_id: string | null
          created_at: string
          data_entrada: string
          data_entrega: string | null
          diagnostico: string | null
          equipamento_id: string | null
          foto_url: string | null
          id: string
          numero: string
          observacoes: string | null
          problema_relatado: string | null
          servicos_realizados: string | null
          status: Database["public"]["Enums"]["os_status"]
          tecnico_id: string | null
          updated_at: string
          valor_mao_obra: number
          valor_pecas: number
        }
        Insert: {
          cliente_id: string
          company_id?: string | null
          created_at?: string
          data_entrada?: string
          data_entrega?: string | null
          diagnostico?: string | null
          equipamento_id?: string | null
          foto_url?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          problema_relatado?: string | null
          servicos_realizados?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          updated_at?: string
          valor_mao_obra?: number
          valor_pecas?: number
        }
        Update: {
          cliente_id?: string
          company_id?: string | null
          created_at?: string
          data_entrada?: string
          data_entrega?: string | null
          diagnostico?: string | null
          equipamento_id?: string | null
          foto_url?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          problema_relatado?: string | null
          servicos_realizados?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          updated_at?: string
          valor_mao_obra?: number
          valor_pecas?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      os_fotos: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          legenda: string | null
          ordem_servico_id: string
          url: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          legenda?: string | null
          ordem_servico_id: string
          url: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          legenda?: string | null
          ordem_servico_id?: string
          url?: string
        }
        Relationships: []
      }
      os_pecas: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          ordem_servico_id: string
          peca_id: string
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          ordem_servico_id: string
          peca_id: string
          quantidade?: number
          valor_unitario?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          ordem_servico_id?: string
          peca_id?: string
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_pecas_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_pecas_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      os_servicos: {
        Row: {
          company_id: string | null
          created_at: string
          descricao: string
          id: string
          ordem_servico_id: string
          quantidade: number
          servico_catalogo_id: string | null
          valor_unitario: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          ordem_servico_id: string
          quantidade?: number
          servico_catalogo_id?: string | null
          valor_unitario?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          ordem_servico_id?: string
          quantidade?: number
          servico_catalogo_id?: string | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_servicos_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_servicos_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_servicos_servico_catalogo_id_fkey"
            columns: ["servico_catalogo_id"]
            isOneToOne: false
            referencedRelation: "servicos_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          company_id: string | null
          created_at: string
          estoque_minimo: number
          id: string
          nome: string
          quantidade: number
          updated_at: string
          valor_compra: number
          valor_venda: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          estoque_minimo?: number
          id?: string
          nome: string
          quantidade?: number
          updated_at?: string
          valor_compra?: number
          valor_venda?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          estoque_minimo?: number
          id?: string
          nome?: string
          quantidade?: number
          updated_at?: string
          valor_compra?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "pecas_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          pix_key: string
          pix_name: string
          price_enterprise: number | null
          price_free: number | null
          price_pro: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          pix_key: string
          pix_name: string
          price_enterprise?: number | null
          price_free?: number | null
          price_pro?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          pix_key?: string
          pix_name?: string
          price_enterprise?: number | null
          price_free?: number | null
          price_pro?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_catalogo: {
        Row: {
          ativo: boolean
          categoria: string | null
          company_id: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          valor_padrao?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_catalogo_empresa_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_itens: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          peca_id: string
          quantidade: number
          valor_unitario: number
          venda_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          peca_id: string
          quantidade?: number
          valor_unitario?: number
          venda_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          peca_id?: string
          quantidade?: number
          valor_unitario?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          caixa_id: string
          cliente_id: string | null
          company_id: string | null
          created_at: string
          forma_pagamento: Database["public"]["Enums"]["venda_pagamento"]
          id: string
          observacoes: string | null
          orcamento_id: string | null
          ordem_servico_id: string | null
          origem: string | null
          valor_total: number
        }
        Insert: {
          caixa_id: string
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          forma_pagamento: Database["public"]["Enums"]["venda_pagamento"]
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          ordem_servico_id?: string | null
          origem?: string | null
          valor_total?: number
        }
        Update: {
          caixa_id?: string
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          forma_pagamento?: Database["public"]["Enums"]["venda_pagamento"]
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          ordem_servico_id?: string | null
          origem?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_plan_limit: {
        Args: { feature: string; target_company_id: string }
        Returns: boolean
      }
      get_my_company_id: { Args: never; Returns: string }
      get_user_empresa_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tecnico"
      caixa_status: "aberto" | "fechado"
      conta_status: "pendente" | "pago" | "recebido" | "vencido"
      conta_tipo: "pagar" | "receber"
      orcamento_status: "pendente" | "aprovado" | "reprovado"
      os_status:
        | "aberto"
        | "em_analise"
        | "aguardando_aprovacao"
        | "em_manutencao"
        | "finalizado"
        | "entregue"
      user_role: "admin" | "tecnico" | "financeiro" | "super_admin"
      venda_pagamento: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix"
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
      app_role: ["admin", "tecnico"],
      caixa_status: ["aberto", "fechado"],
      conta_status: ["pendente", "pago", "recebido", "vencido"],
      conta_tipo: ["pagar", "receber"],
      orcamento_status: ["pendente", "aprovado", "reprovado"],
      os_status: [
        "aberto",
        "em_analise",
        "aguardando_aprovacao",
        "em_manutencao",
        "finalizado",
        "entregue",
      ],
      user_role: ["admin", "tecnico", "financeiro", "super_admin"],
      venda_pagamento: ["dinheiro", "cartao_credito", "cartao_debito", "pix"],
    },
  },
} as const
