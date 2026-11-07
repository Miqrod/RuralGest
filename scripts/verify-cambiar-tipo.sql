-- Verificación de cambiar_tipo_productivo y de la validación de tipo en registrar_compra_animal
-- contra la BD local (22 casos + comprobación de que ningún rechazo deja eventos).
--
-- Uso:
--   supabase db query --local -f scripts/verify-cambiar-tipo.sql 2>&1 | sed 's/\\n/\n/g' | grep -E "✅|❌|⚠️|ciclo"
--
-- Resultado esperado: todas las líneas con ✅. Una ❌ indica regresión en el RPC.
-- ⚠️ = caso omitido porque los datos actuales no tienen un animal adecuado (no es un fallo).
-- La salida aparece como "error" a propósito: es el RAISE EXCEPTION final.
--
-- Un único bloque DO (supabase db query exige una sola sentencia) que termina con
-- RAISE EXCEPTION: Postgres deshace TODO (incluidos los casos válidos) y el mensaje
-- de error lleva los resultados. No deja datos modificados.
--
-- Robusto frente a datos modificados (no requiere un db reset previo):
--   · Los animales se eligen por su situación (sexo, tipo, estado), con orden determinista.
--   · En los casos válidos, el tipo destino se elige distinto del tipo actual del animal.
--   · Los casos de rechazo comprueban el MOTIVO (patrón del mensaje), no solo que haya
--     error: un rechazo por otro motivo (p.ej. "ya tiene el tipo") cuenta como ❌.
DO $$
DECLARE
  v_macho UUID; v_hembra UUID; v_hembra_vacia UUID; v_gestante UUID; v_no_repro UUID; v_cria UUID;
  v_eventos_antes INT; v_ciclos_antes INT;
  r TEXT[] := '{}';
  c JSONB; v_animal UUID; v_tipo UUID; v_tipo_nombre TEXT; v_actual TEXT;
  v_espera BOOLEAN; v_patron TEXT;
BEGIN
  -- ── Selección de animales (vivos, vacuno, orden determinista) ──────────────
  -- Macho no Cría: si fuera Cría, el caso "→ Cría" fallaría por "ya tiene el tipo" (motivo erróneo)
  SELECT a.id INTO v_macho FROM animal a JOIN tipo_productivo t ON t.id = a.tipo_productivo_id
    WHERE a.especie='vacuno' AND a.sexo='macho' AND a.estado_vital='vivo' AND t.nombre <> 'Cría'
    ORDER BY a.crotal NULLS LAST, a.id LIMIT 1;
  SELECT id INTO v_hembra FROM animal
    WHERE especie='vacuno' AND sexo='hembra' AND estado_vital='vivo' ORDER BY crotal NULLS LAST, id LIMIT 1;
  SELECT id INTO v_hembra_vacia FROM animal
    WHERE especie='vacuno' AND es_reproductora AND estado_reproductivo='vacia' AND estado_vital='vivo' ORDER BY crotal NULLS LAST, id LIMIT 1;
  SELECT id INTO v_gestante FROM animal
    WHERE especie='vacuno' AND es_reproductora AND estado_reproductivo='gestante' AND estado_vital='vivo' ORDER BY crotal NULLS LAST, id LIMIT 1;
  -- Hembra no reproductora y no Cría: candidata a "sexo NULL" y a "→ Reproductora"
  SELECT a.id INTO v_no_repro FROM animal a JOIN tipo_productivo t ON t.id = a.tipo_productivo_id
    WHERE a.especie='vacuno' AND a.sexo='hembra' AND NOT a.es_reproductora AND a.estado_vital='vivo'
      AND t.nombre <> 'Cría'
    -- Preferir una que NO sea Engorde: Engorde es el único destino neutro, y así el caso
    -- "sexo NULL → neutro" siempre tiene destino disponible.
    ORDER BY (t.nombre = 'Engorde'), a.crotal NULLS LAST, a.id LIMIT 1;

  -- Cría viva: para comprobar que no admite cambios manuales
  SELECT a.id INTO v_cria FROM animal a JOIN tipo_productivo t ON t.id = a.tipo_productivo_id
    WHERE a.especie='vacuno' AND a.estado_vital='vivo' AND t.nombre = 'Cría'
    ORDER BY a.crotal NULLS LAST, a.id LIMIT 1;

  r := r || format('animales: macho=%s hembra=%s hembra_vacia=%s gestante=%s no_repro=%s cria=%s',
                   v_macho, v_hembra, v_hembra_vacia, v_gestante, v_no_repro, v_cria);
  SELECT count(*) INTO v_ciclos_antes FROM ciclo_reproductivo WHERE animal_id = v_no_repro;

  -- ── Casos ──────────────────────────────────────────────────────────────────
  -- "a":   animal (macho | hembra | hembra_vacia | gestante | no_repro | cria)
  --        o 'compra' → llama a registrar_compra_animal con "sexo" y el tipo "t"
  -- "t":   'Nombre/especie' | 'inexistente' | 'neutro' (Engorde; si el animal ya es Engorde
  --        el caso se omite con ⚠️, porque Recría ya no es destino válido)
  -- "err": true si se espera rechazo; "msg": patrón ILIKE que debe contener el motivo
  -- "pre": SQL de preparación; "%ACTUAL%" se sustituye por el tipo actual del animal
  FOR c IN SELECT * FROM jsonb_array_elements($j$[
    {"caso":"macho → Reproductora",            "a":"macho",  "t":"Reproductora/vacuno", "err":true, "msg":"%solo puede asignarse a hembras%"},
    {"caso":"hembra → Semental",               "a":"hembra", "t":"Semental/vacuno",     "err":true, "msg":"%solo puede asignarse a machos%"},
    {"caso":"hembra vacuno → Verraco porcino", "a":"hembra", "t":"Verraco/porcino",     "err":true, "msg":"%no corresponde a la especie%"},
    {"caso":"vacuno → Recría porcino",         "a":"macho",  "t":"Recría/porcino",      "err":true, "msg":"%no corresponde a la especie%"},
    {"caso":"→ Cría",                          "a":"macho",  "t":"Cría/vacuno",         "err":true, "msg":"%solo se asigna al nacer%"},
    {"caso":"→ tipo inexistente",              "a":"macho",  "t":"inexistente",         "err":true, "msg":"%no encontrado%"},
    {"caso":"→ tipo inactivo",                 "a":"hembra_vacia", "t":"neutro",        "err":true, "msg":"%desactivado%", "desactivar":true},
    {"caso":"→ Recría (no se vuelve a Recría)", "a":"hembra_vacia", "t":"Recría/vacuno", "err":true, "msg":"%fase posterior al destete%"},
    {"caso":"Cría → cambio manual",            "a":"cria",   "t":"neutro",              "err":true, "msg":"%mediante el destete%"},
    {"caso":"sexo NULL → Reproductora",        "a":"no_repro", "t":"Reproductora/vacuno", "err":true, "msg":"%Indica el sexo%", "null_sexo":true},
    {"caso":"sexo NULL → Semental",            "a":"no_repro", "t":"Semental/vacuno",     "err":true, "msg":"%Indica el sexo%"},
    {"caso":"gestante → neutro (bloqueo previo intacto)", "a":"gestante", "t":"neutro", "err":true, "msg":"%gestante%"},
    {"check_eventos":true},
    {"caso":"sexo NULL → neutro (no ligado al sexo)", "a":"no_repro", "t":"neutro", "err":false},
    {"caso":"hembra vacía Reproductora → neutro",  "a":"hembra_vacia", "t":"neutro", "err":false, "detalle":"salida"},
    {"caso":"hembra no repro → Reproductora",  "a":"no_repro", "t":"Reproductora/vacuno", "err":false, "fix_sexo":true, "detalle":"entrada"},
    {"caso":"macho → neutro",                  "a":"macho",  "t":"neutro",              "err":false},
    {"caso":"compra como Cría",                "a":"compra", "sexo":"hembra", "t":"Cría/vacuno",         "err":true, "msg":"%no puede entrar como Cría%"},
    {"caso":"compra macho como Reproductora",  "a":"compra", "sexo":"macho",  "t":"Reproductora/vacuno", "err":true, "msg":"%solo puede asignarse a hembras%"},
    {"caso":"compra hembra como Semental",     "a":"compra", "sexo":"hembra", "t":"Semental/vacuno",     "err":true, "msg":"%solo puede asignarse a machos%"},
    {"caso":"compra vacuno con tipo porcino",  "a":"compra", "sexo":"hembra", "t":"Cebo/porcino",        "err":true, "msg":"%no corresponde a la especie%"},
    {"caso":"compra como Recría (válida)",     "a":"compra", "sexo":"macho",  "t":"Recría/vacuno",       "err":false},
    {"caso":"compra hembra como Reproductora (válida)", "a":"compra", "sexo":"hembra", "t":"Reproductora/vacuno", "err":false}
  ]$j$::jsonb) LOOP

    IF c ? 'check_eventos' THEN
      r := r || format('%s ningún rechazo ha dejado eventos (antes=%s después=%s)',
        CASE WHEN (SELECT count(*) FROM eventos) = v_eventos_antes THEN '✅' ELSE '❌' END,
        v_eventos_antes, (SELECT count(*) FROM eventos));
      CONTINUE;
    END IF;

    IF v_eventos_antes IS NULL THEN SELECT count(*) INTO v_eventos_antes FROM eventos; END IF;

    -- Casos de compra: no hay animal previo; se llama a registrar_compra_animal
    IF c->>'a' = 'compra' THEN
      v_tipo_nombre := split_part(c->>'t','/',1);
      SELECT id INTO v_tipo FROM tipo_productivo
       WHERE nombre = v_tipo_nombre AND especie = split_part(c->>'t','/',2)::especie_enum;
      v_espera := (c->>'err')::boolean;
      v_patron := c->>'msg';
      BEGIN
        -- Parámetros nombrados; fecha de nacimiento obligatoria (chk_fecha_nacimiento)
        PERFORM registrar_compra_animal(
          p_especie            => 'vacuno'::especie_enum,
          p_sexo               => (c->>'sexo')::sexo_enum,
          p_tipo_productivo_id => v_tipo,
          p_fecha_compra       => CURRENT_DATE,
          p_fecha_nacimiento   => CURRENT_DATE - 365);
        r := r || format('%s %s [%s, %s] → OK', CASE WHEN v_espera THEN '❌' ELSE '✅' END, c->>'caso', c->>'sexo', v_tipo_nombre);
      EXCEPTION WHEN OTHERS THEN
        r := r || format('%s %s [%s, %s] → ERROR: %s',
          CASE WHEN v_espera AND (v_patron IS NULL OR SQLERRM ILIKE v_patron) THEN '✅' ELSE '❌' END,
          c->>'caso', c->>'sexo', v_tipo_nombre, SQLERRM);
      END;
      CONTINUE;
    END IF;

    v_animal := CASE c->>'a' WHEN 'macho' THEN v_macho WHEN 'hembra' THEN v_hembra WHEN 'cria' THEN v_cria
                             WHEN 'hembra_vacia' THEN v_hembra_vacia WHEN 'gestante' THEN v_gestante
                             ELSE v_no_repro END;
    IF v_animal IS NULL THEN
      r := r || format('⚠️ %s → omitido: no hay animal "%s" en los datos actuales', c->>'caso', c->>'a');
      CONTINUE;
    END IF;

    IF (c->>'null_sexo')::boolean THEN UPDATE animal SET sexo = NULL     WHERE id = v_animal; END IF;
    IF (c->>'fix_sexo')::boolean  THEN UPDATE animal SET sexo = 'hembra' WHERE id = v_animal; END IF;

    SELECT t.nombre INTO v_actual FROM animal a JOIN tipo_productivo t ON t.id = a.tipo_productivo_id WHERE a.id = v_animal;

    -- Resolver tipo destino
    IF c->>'t' = 'inexistente' THEN
      v_tipo := gen_random_uuid(); v_tipo_nombre := 'inexistente';
    ELSIF c->>'t' = 'neutro' THEN
      -- Engorde es el único destino sin restricciones de sexo ni de fase (Recría ya no lo es)
      IF v_actual = 'Engorde' THEN
        r := r || format('⚠️ %s → omitido: el animal ya es Engorde y no hay otro destino neutro', c->>'caso');
        CONTINUE;
      END IF;
      v_tipo_nombre := 'Engorde';
      SELECT id INTO v_tipo FROM tipo_productivo WHERE nombre = v_tipo_nombre AND especie = 'vacuno';
    ELSE
      v_tipo_nombre := split_part(c->>'t','/',1);
      SELECT id INTO v_tipo FROM tipo_productivo
       WHERE nombre = v_tipo_nombre AND especie = split_part(c->>'t','/',2)::especie_enum;
    END IF;

    IF (c->>'desactivar')::boolean THEN UPDATE tipo_productivo SET activa = false WHERE id = v_tipo; END IF;

    v_espera := (c->>'err')::boolean;
    v_patron := c->>'msg';

    BEGIN
      PERFORM cambiar_tipo_productivo(v_animal, v_tipo);
      r := r || format('%s %s [%s → %s] → OK', CASE WHEN v_espera THEN '❌' ELSE '✅' END, c->>'caso', v_actual, v_tipo_nombre);
    EXCEPTION WHEN OTHERS THEN
      r := r || format('%s %s [%s → %s] → ERROR: %s',
        CASE WHEN v_espera AND (v_patron IS NULL OR SQLERRM ILIKE v_patron) THEN '✅' ELSE '❌' END,
        c->>'caso', v_actual, v_tipo_nombre, SQLERRM);
    END;

    IF (c->>'desactivar')::boolean THEN UPDATE tipo_productivo SET activa = true WHERE id = v_tipo; END IF;

    IF c->>'detalle' = 'salida' THEN
      r := r || format('     ciclo: resultado=%s fecha_fin=%s · animal: es_reproductora=%s estado=%s',
        (SELECT resultado FROM ciclo_reproductivo WHERE animal_id = v_animal ORDER BY numero_ciclo DESC LIMIT 1),
        (SELECT fecha_fin FROM ciclo_reproductivo WHERE animal_id = v_animal ORDER BY numero_ciclo DESC LIMIT 1),
        (SELECT es_reproductora FROM animal WHERE id = v_animal),
        coalesce((SELECT estado_reproductivo::text FROM animal WHERE id = v_animal), 'NULL'));
    ELSIF c->>'detalle' = 'entrada' THEN
      r := r || format('     ciclos: antes=%s después=%s · estado=%s · es_reproductora=%s', v_ciclos_antes,
        (SELECT count(*) FROM ciclo_reproductivo WHERE animal_id = v_animal),
        (SELECT estado_reproductivo FROM animal WHERE id = v_animal),
        (SELECT es_reproductora FROM animal WHERE id = v_animal));
    END IF;
  END LOOP;

  RAISE EXCEPTION E'RESULTADOS (rollback intencionado)\n%', array_to_string(r, E'\n');
END $$;
