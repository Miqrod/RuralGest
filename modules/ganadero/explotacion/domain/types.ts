export interface Explotacion {
  id:                 string
  nombre:             string
  nombre_comercial:   string | null
  email:              string | null
  telefono:           string | null
  direccion:          string | null
  codigo_postal:      string | null
  municipio:          string | null
  provincia:          string | null
  pais:               string | null
  latitud:            number | null
  longitud:           number | null
  // Ruta dentro del bucket 'images' (ej. 'explotacion/logo')
  logo_storage_path:  string | null
  created_at:         string
  updated_at:         string
}

export interface ActualizarExplotacionInput {
  id:                string
  nombre:            string
  nombre_comercial:  string | null
  email:             string | null
  telefono:          string | null
  direccion:         string | null
  codigo_postal:     string | null
  municipio:         string | null
  provincia:         string | null
  pais:              string | null
  latitud:           number | null
  longitud:          number | null
  logo_storage_path: string | null
}
