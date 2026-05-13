# 🔄 Flujo: Destete

## 📋 Descripción

Proceso mediante el cual una cerda deja de estar en estado lactante.

## 🪜 Pasos

1. Validar estado actual (LACTANTE)
2. Crear evento DESTETE
3. Actualizar estado reproductivo → VACIA
4. Generar movimientos de lote (si aplica)

## ⚠️ Validaciones

* no permitir destete si no está en lactancia
* validar stock

## 🎯 Resultado

* estado actualizado
* eventos registrados
