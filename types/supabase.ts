export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      animal: {
        Row: {
          created_at: string
          created_by: string | null
          crotal: string | null
          es_reproductora: boolean
          especie: Database["public"]["Enums"]["especie_enum"]
          estado_reproductivo:
            | Database["public"]["Enums"]["estado_reproductivo_enum"]
            | null
          estado_sanitario: Database["public"]["Enums"]["estado_sanitario_enum"]
          estado_vital: Database["public"]["Enums"]["estado_vital_enum"]
          evento_creacion_id: string | null
          evento_origen_id: string | null
          fecha_nacimiento: string | null
          fecha_nacimiento_estimada: string | null
          id: string
          lote_id: string | null
          lote_origen_id: string | null
          madre_id: string | null
          num_hierro: string | null
          origen: Database["public"]["Enums"]["origen_animal_enum"]
          padre_id: string | null
          raza_id: string | null
          sexo: Database["public"]["Enums"]["sexo_enum"]
          tipo_productivo_id: string | null
          ubicacion_actual_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crotal?: string | null
          es_reproductora?: boolean
          especie: Database["public"]["Enums"]["especie_enum"]
          estado_reproductivo?:
            | Database["public"]["Enums"]["estado_reproductivo_enum"]
            | null
          estado_sanitario?: Database["public"]["Enums"]["estado_sanitario_enum"]
          estado_vital?: Database["public"]["Enums"]["estado_vital_enum"]
          evento_creacion_id?: string | null
          evento_origen_id?: string | null
          fecha_nacimiento?: string | null
          fecha_nacimiento_estimada?: string | null
          id?: string
          lote_id?: string | null
          lote_origen_id?: string | null
          madre_id?: string | null
          num_hierro?: string | null
          origen: Database["public"]["Enums"]["origen_animal_enum"]
          padre_id?: string | null
          raza_id?: string | null
          sexo: Database["public"]["Enums"]["sexo_enum"]
          tipo_productivo_id?: string | null
          ubicacion_actual_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crotal?: string | null
          es_reproductora?: boolean
          especie?: Database["public"]["Enums"]["especie_enum"]
          estado_reproductivo?:
            | Database["public"]["Enums"]["estado_reproductivo_enum"]
            | null
          estado_sanitario?: Database["public"]["Enums"]["estado_sanitario_enum"]
          estado_vital?: Database["public"]["Enums"]["estado_vital_enum"]
          evento_creacion_id?: string | null
          evento_origen_id?: string | null
          fecha_nacimiento?: string | null
          fecha_nacimiento_estimada?: string | null
          id?: string
          lote_id?: string | null
          lote_origen_id?: string | null
          madre_id?: string | null
          num_hierro?: string | null
          origen?: Database["public"]["Enums"]["origen_animal_enum"]
          padre_id?: string | null
          raza_id?: string | null
          sexo?: Database["public"]["Enums"]["sexo_enum"]
          tipo_productivo_id?: string | null
          ubicacion_actual_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_lote_origen_id_fkey"
            columns: ["lote_origen_id"]
            isOneToOne: false
            referencedRelation: "lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_madre_id_fkey"
            columns: ["madre_id"]
            isOneToOne: false
            referencedRelation: "animal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_padre_id_fkey"
            columns: ["padre_id"]
            isOneToOne: false
            referencedRelation: "animal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_raza_id_fkey"
            columns: ["raza_id"]
            isOneToOne: false
            referencedRelation: "raza"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_tipo_productivo_id_fkey"
            columns: ["tipo_productivo_id"]
            isOneToOne: false
            referencedRelation: "tipo_productivo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_animal_evento_creacion"
            columns: ["evento_creacion_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_animal_evento_origen"
            columns: ["evento_origen_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      categoria_financiera: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          parent_id: string | null
          tipo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          parent_id?: string | null
          tipo: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          parent_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "categoria_financiera_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categoria_financiera"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclo_reproductivo: {
        Row: {
          animal_id: string
          created_at: string
          created_by: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          numero_ciclo: number
          resultado: Database["public"]["Enums"]["resultado_ciclo_enum"] | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          created_by?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          numero_ciclo: number
          resultado?: Database["public"]["Enums"]["resultado_ciclo_enum"] | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          created_by?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          numero_ciclo?: number
          resultado?: Database["public"]["Enums"]["resultado_ciclo_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ciclo_reproductivo_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string
          descripcion: string | null
          entidad_id: string
          entidad_tipo: string
          id: string
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          entidad_id: string
          entidad_tipo: string
          id?: string
          tipo: string
          url: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          entidad_id?: string
          entidad_tipo?: string
          id?: string
          tipo?: string
          url?: string
        }
        Relationships: []
      }
      evento_animales: {
        Row: {
          animal_id: string
          evento_id: string
          rol: string | null
        }
        Insert: {
          animal_id: string
          evento_id: string
          rol?: string | null
        }
        Update: {
          animal_id?: string
          evento_id?: string
          rol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_animales_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_animales_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_lotes: {
        Row: {
          cantidad: number
          evento_id: string
          lote_id: string
          lote_origen_id: string | null
          rol: string
        }
        Insert: {
          cantidad: number
          evento_id: string
          lote_id: string
          lote_origen_id?: string | null
          rol: string
        }
        Update: {
          cantidad?: number
          evento_id?: string
          lote_id?: string
          lote_origen_id?: string | null
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_lotes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_lotes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_lotes_lote_origen_id_fkey"
            columns: ["lote_origen_id"]
            isOneToOne: false
            referencedRelation: "lote"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          ciclo_id: string | null
          created_at: string
          created_by: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          evento_referencia_id: string | null
          fecha: string
          id: string
          metadata_json: Json | null
          motivo_id: string | null
          movimiento_id: string | null
          tipo_evento_id: string
        }
        Insert: {
          ciclo_id?: string | null
          created_at?: string
          created_by?: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          evento_referencia_id?: string | null
          fecha: string
          id?: string
          metadata_json?: Json | null
          motivo_id?: string | null
          movimiento_id?: string | null
          tipo_evento_id: string
        }
        Update: {
          ciclo_id?: string | null
          created_at?: string
          created_by?: string | null
          especie?: Database["public"]["Enums"]["especie_enum"]
          evento_referencia_id?: string | null
          fecha?: string
          id?: string
          metadata_json?: Json | null
          motivo_id?: string | null
          movimiento_id?: string | null
          tipo_evento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclo_reproductivo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_evento_referencia_id_fkey"
            columns: ["evento_referencia_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_motivo_id_fkey"
            columns: ["motivo_id"]
            isOneToOne: false
            referencedRelation: "motivos_movimiento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_movimiento_id_fkey"
            columns: ["movimiento_id"]
            isOneToOne: false
            referencedRelation: "movimiento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_tipo_evento_id_fkey"
            columns: ["tipo_evento_id"]
            isOneToOne: false
            referencedRelation: "tipo_evento"
            referencedColumns: ["id"]
          },
        ]
      }
      factura: {
        Row: {
          created_at: string
          fecha: string
          id: string
          tercero_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          fecha: string
          id?: string
          tercero_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          tercero_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "factura_tercero_id_fkey"
            columns: ["tercero_id"]
            isOneToOne: false
            referencedRelation: "tercero"
            referencedColumns: ["id"]
          },
        ]
      }
      factura_linea: {
        Row: {
          created_at: string
          factura_id: string
          id: string
          total_importe: number | null
          total_kg: number | null
          venta_linea_id: string | null
        }
        Insert: {
          created_at?: string
          factura_id: string
          id?: string
          total_importe?: number | null
          total_kg?: number | null
          venta_linea_id?: string | null
        }
        Update: {
          created_at?: string
          factura_id?: string
          id?: string
          total_importe?: number | null
          total_kg?: number | null
          venta_linea_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factura_linea_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "factura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_linea_venta_linea_id_fkey"
            columns: ["venta_linea_id"]
            isOneToOne: false
            referencedRelation: "venta_linea"
            referencedColumns: ["id"]
          },
        ]
      }
      factura_linea_detalle: {
        Row: {
          created_at: string
          factura_linea_id: string
          id: string
          metadata: Json | null
          peso: number | null
          precio_unitario: number | null
        }
        Insert: {
          created_at?: string
          factura_linea_id: string
          id?: string
          metadata?: Json | null
          peso?: number | null
          precio_unitario?: number | null
        }
        Update: {
          created_at?: string
          factura_linea_id?: string
          id?: string
          metadata?: Json | null
          peso?: number | null
          precio_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factura_linea_detalle_factura_linea_id_fkey"
            columns: ["factura_linea_id"]
            isOneToOne: false
            referencedRelation: "factura_linea"
            referencedColumns: ["id"]
          },
        ]
      }
      lote: {
        Row: {
          alimentacion: string | null
          cantidad_actual: number
          codigo_identificacion: string | null
          created_at: string
          created_by: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          estado: Database["public"]["Enums"]["estado_lote_enum"]
          estado_sanitario: Database["public"]["Enums"]["estado_sanitario_enum"]
          fecha_cierre: string | null
          fecha_creacion: string
          id: string
          lote_origen_id: string | null
          tipo_lote: Database["public"]["Enums"]["tipo_lote_enum"]
          ubicacion_actual_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alimentacion?: string | null
          cantidad_actual?: number
          codigo_identificacion?: string | null
          created_at?: string
          created_by?: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          estado?: Database["public"]["Enums"]["estado_lote_enum"]
          estado_sanitario?: Database["public"]["Enums"]["estado_sanitario_enum"]
          fecha_cierre?: string | null
          fecha_creacion: string
          id?: string
          lote_origen_id?: string | null
          tipo_lote: Database["public"]["Enums"]["tipo_lote_enum"]
          ubicacion_actual_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alimentacion?: string | null
          cantidad_actual?: number
          codigo_identificacion?: string | null
          created_at?: string
          created_by?: string | null
          especie?: Database["public"]["Enums"]["especie_enum"]
          estado?: Database["public"]["Enums"]["estado_lote_enum"]
          estado_sanitario?: Database["public"]["Enums"]["estado_sanitario_enum"]
          fecha_cierre?: string | null
          fecha_creacion?: string
          id?: string
          lote_origen_id?: string | null
          tipo_lote?: Database["public"]["Enums"]["tipo_lote_enum"]
          ubicacion_actual_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lote_lote_origen_id_fkey"
            columns: ["lote_origen_id"]
            isOneToOne: false
            referencedRelation: "lote"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_movimiento: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          descripcion: string | null
          es_monetizable: boolean
          id: string
          nombre: string
          tipo_base: Database["public"]["Enums"]["tipo_base_movimiento_enum"]
          tipo_economico: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          es_monetizable?: boolean
          id?: string
          nombre: string
          tipo_base: Database["public"]["Enums"]["tipo_base_movimiento_enum"]
          tipo_economico: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          es_monetizable?: boolean
          id?: string
          nombre?: string
          tipo_base?: Database["public"]["Enums"]["tipo_base_movimiento_enum"]
          tipo_economico?: string
        }
        Relationships: []
      }
      movimiento: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["movimiento_estado_enum"]
          fecha: string
          id: string
          tipo_movimiento: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["movimiento_estado_enum"]
          fecha: string
          id?: string
          tipo_movimiento: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["movimiento_estado_enum"]
          fecha?: string
          id?: string
          tipo_movimiento?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      raza: {
        Row: {
          activa: boolean
          especie: Database["public"]["Enums"]["especie_enum"]
          id: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          especie: Database["public"]["Enums"]["especie_enum"]
          id?: string
          nombre: string
        }
        Update: {
          activa?: boolean
          especie?: Database["public"]["Enums"]["especie_enum"]
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      tercero: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          tipo: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      tipo_evento: {
        Row: {
          activo: boolean
          afecta_animales: boolean
          afecta_lotes: boolean
          afecta_stock: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descripcion: string
          es_biologico: boolean
          id: string
          requiere_motivo: boolean
          tipo_negocio: string
          tipo_tecnico: Database["public"]["Enums"]["tipo_tecnico_evento_enum"]
        }
        Insert: {
          activo?: boolean
          afecta_animales?: boolean
          afecta_lotes?: boolean
          afecta_stock?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descripcion: string
          es_biologico?: boolean
          id?: string
          requiere_motivo?: boolean
          tipo_negocio: string
          tipo_tecnico: Database["public"]["Enums"]["tipo_tecnico_evento_enum"]
        }
        Update: {
          activo?: boolean
          afecta_animales?: boolean
          afecta_lotes?: boolean
          afecta_stock?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string
          es_biologico?: boolean
          id?: string
          requiere_motivo?: boolean
          tipo_negocio?: string
          tipo_tecnico?: Database["public"]["Enums"]["tipo_tecnico_evento_enum"]
        }
        Relationships: []
      }
      tipo_productivo: {
        Row: {
          activa: boolean
          especie: Database["public"]["Enums"]["especie_enum"]
          id: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          especie: Database["public"]["Enums"]["especie_enum"]
          id?: string
          nombre: string
        }
        Update: {
          activa?: boolean
          especie?: Database["public"]["Enums"]["especie_enum"]
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      transaccion: {
        Row: {
          categoria_id: string
          created_at: string
          descripcion: string
          factura_id: string | null
          fecha: string
          id: string
          importe: number
          origen: string
          tercero_id: string
          tipo: string
          venta_id: string | null
        }
        Insert: {
          categoria_id: string
          created_at?: string
          descripcion: string
          factura_id?: string | null
          fecha: string
          id?: string
          importe: number
          origen: string
          tercero_id: string
          tipo: string
          venta_id?: string | null
        }
        Update: {
          categoria_id?: string
          created_at?: string
          descripcion?: string
          factura_id?: string | null
          fecha?: string
          id?: string
          importe?: number
          origen?: string
          tercero_id?: string
          tipo?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaccion_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categoria_financiera"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaccion_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "factura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaccion_tercero_id_fkey"
            columns: ["tercero_id"]
            isOneToOne: false
            referencedRelation: "tercero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaccion_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "venta"
            referencedColumns: ["id"]
          },
        ]
      }
      venta: {
        Row: {
          categoria_id: string
          cliente_id: string
          created_at: string
          estado: string
          fecha: string
          id: string
        }
        Insert: {
          categoria_id: string
          cliente_id: string
          created_at?: string
          estado?: string
          fecha: string
          id?: string
        }
        Update: {
          categoria_id?: string
          cliente_id?: string
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categoria_financiera"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "tercero"
            referencedColumns: ["id"]
          },
        ]
      }
      venta_linea: {
        Row: {
          animal_id: string | null
          cantidad: number
          created_at: string
          evento_id: string
          id: string
          lote_id: string | null
          tipo: string
          venta_id: string
        }
        Insert: {
          animal_id?: string | null
          cantidad: number
          created_at?: string
          evento_id: string
          id?: string
          lote_id?: string | null
          tipo: string
          venta_id: string
        }
        Update: {
          animal_id?: string | null
          cantidad?: number
          created_at?: string
          evento_id?: string
          id?: string
          lote_id?: string | null
          tipo?: string
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_linea_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_linea_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_linea_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_linea_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "venta"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _resolve_animal_especie: {
        Args: { p_animal_id: string }
        Returns: Database["public"]["Enums"]["especie_enum"]
      }
      _resolve_motivo_id: { Args: { p_nombre: string }; Returns: string }
      _resolve_tipo_evento_id: { Args: { p_codigo: string }; Returns: string }
      registrar_compra_animal: {
        Args: {
          p_crotal?: string
          p_especie: Database["public"]["Enums"]["especie_enum"]
          p_fecha_compra: string
          p_fecha_nacimiento?: string
          p_fecha_nacimiento_estimada?: string
          p_lote_id?: string
          p_num_hierro?: string
          p_raza_id?: string
          p_sexo: Database["public"]["Enums"]["sexo_enum"]
          p_tipo_productivo_id: string
        }
        Returns: string
      }
      registrar_salida_animal: {
        Args: { p_animal_id: string; p_fecha: string; p_motivo: string }
        Returns: string
      }
    }
    Enums: {
      especie_enum: "vacuno" | "porcino"
      estado_lote_enum: "activo" | "cerrado"
      estado_reproductivo_enum:
        | "vacia"
        | "no_reproductiva"
        | "gestante"
        | "lactante"
      estado_sanitario_enum:
        | "sano"
        | "en_observacion"
        | "en_tratamiento"
        | "no_apto"
      estado_vital_enum: "vivo" | "muerto" | "vendido"
      movimiento_estado_enum: "activo" | "cancelado"
      origen_animal_enum: "interno" | "compra"
      resultado_ciclo_enum:
        | "parto"
        | "aborto"
        | "desconocido"
        | "venta"
        | "muerte"
      sexo_enum: "macho" | "hembra"
      tipo_base_movimiento_enum: "ENTRADA" | "SALIDA" | "MIXTO"
      tipo_lote_enum: "camada" | "post_destete" | "engorde"
      tipo_tecnico_evento_enum: "STOCK" | "BIOLOGICO" | "OPERATIVO" | "SISTEMA"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      especie_enum: ["vacuno", "porcino"],
      estado_lote_enum: ["activo", "cerrado"],
      estado_reproductivo_enum: [
        "vacia",
        "no_reproductiva",
        "gestante",
        "lactante",
      ],
      estado_sanitario_enum: [
        "sano",
        "en_observacion",
        "en_tratamiento",
        "no_apto",
      ],
      estado_vital_enum: ["vivo", "muerto", "vendido"],
      movimiento_estado_enum: ["activo", "cancelado"],
      origen_animal_enum: ["interno", "compra"],
      resultado_ciclo_enum: [
        "parto",
        "aborto",
        "desconocido",
        "venta",
        "muerte",
      ],
      sexo_enum: ["macho", "hembra"],
      tipo_base_movimiento_enum: ["ENTRADA", "SALIDA", "MIXTO"],
      tipo_lote_enum: ["camada", "post_destete", "engorde"],
      tipo_tecnico_evento_enum: ["STOCK", "BIOLOGICO", "OPERATIVO", "SISTEMA"],
    },
  },
} as const

