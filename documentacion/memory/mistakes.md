## 📄 `mistakes.md`

Tus “antipatrones detectados”.

# 💣 Mistakes

## TIPOS DE INPUT DE DOMINIO EN APPLICATION/

Error: colocar tipos como `RegistrarCompraAnimalInput` en `application/actions/` siguiendo
la analogía de las proyecciones de salida (`AnimalListItem` en `application/queries/`).

Solución: los tipos de **input para operaciones de dominio** van siempre en `domain/types.ts`.
`infrastructure/mapper.ts` los necesita para los mappers de escritura, e `infrastructure/`
solo puede importar de `domain/` — no de `application/`.

Las proyecciones de salida (`AnimalListItem`, `AnimalDetail`) sí pueden vivir en `application/`
porque solo las consume `ui/`, nunca `infrastructure/`.

Regla: si `infrastructure/mapper.ts` necesita el tipo → `domain/`. Si solo lo necesita la UI → `application/`.

---

## LÓGICA EN FRONTEND

Error: validar estado en React
Solución: mover a backend

## DUPLICACIÓN BACKEND/DB

Error: misma lógica en ambos
Solución: backend único punto de decisión