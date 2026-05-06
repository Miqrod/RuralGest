🐄 Tabla: vacuno
Campos:
id (UUID)
num_crotal (string, único)
nombre (string, opcional)
num_hierro (string, opcional)
id_raza (relación → raza)
sexo (enum: hembra, macho)
fecha_nacimiento (date)
origen (enum: explotación, compra)
fecha_alta (date, opcional, por defecto fecha_nacimiento)
fecha_baja (date, opcional, por defecto 1 enero 3000)
id_imagen (relación → archivos, opcional)
id_ubicacion (relación → infraestructura)
id_padre (relación → vacuno, obligatorio si origen = explotación)
id_madre (relación → vacuno, obligatorio si origen = explotación)
--estado (enum: vivo, muerto, vendido)
notas (texto, opcional)
created_at (timestamp)
updated_at (timestamp)
deleted_at (timestamp, opcional)


💰 Tabla: transacciones_animales (movimientos de animales)
Campos:
id (UUID)
id_animal (relación → vacuno)
especie (enum: vacuno, porcino)
tipo (enum: compra, venta, traslado, otro)
fecha (date)
precio (number, opcional)
peso (number, opcional)
origen (string, opcional)
destino (string, opcional)
notas (texto, opcional)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


🧾 Tabla: Facturas 👉 Representa el documento (factura)
Campos:
id (UUID)
codigo (string, único, código interno del sistema, ej: FAC-2026-001)
codigo_factura (string, código real de la factura emitida por el proveedor, ej: 2026-001)
fecha (date)
total (number)
proveedor (string)
tipo (enum: cobro, pago)
descripcion (texto. Ej: compra pienso, venta vacuno, etc.)
id_fichero (relación → archivos, opcional)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


📦 Tabla: lineas_factura (MUY IMPORTANTE, asocia lineas de factura a facturas de distintas transacciones: animales, piensos, veterinarios, etc.)
Campos:
id (UUID)
id_factura (relación → facturas)
concepto (enum: vacuno, porcino, pienso, paja, veterinario, maquinaria, servicios, otro)
vacuno_id (relación → vacuno, opcional)
porcino_id (relación → porcino, opcional)
animal_transaction_id (relación → transacciones_animales, opcional)
producto_id (relación → producto, opcional)
descripcion (string)
cantidad (number)
precio_neto (number)
iva (number)
precio_con_iva (number)

🧱 Tabla: producto
Campos:
id
nombre
tipo (enum: pienso, paja, medicamento, material, otro)
referencia (string, opcional)
descripcion
created_at


Tabla: razas
Campos:
id (UUID)
raza (enum: morucha, charolesa, limousina, mixta, ibérico, duroc)
especie (enum: vacuno, porcino)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


🏗️ Tabla: infraestructuras
Campos:
id (UUID)
nombre (string)
tipo (enum: cercado, corral, nave, prado, otros)
descripcion (texto, opcional)
imagen_id (relación → archivos, opcional)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


📅 Tabla: eventos
Campos:
id (UUID)
titulo (string)
descripcion (texto, opcional)
fecha (datetime)
categoria (enum: vacuno, porcino, veterinario, pienso, paja, maquinaria, otro)
creado_por (relación → usuarios)
id_imagen (relación → archivos, opcional)
id_fichero (relación → archivos, opcional)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


📎 Tabla: archivos
Campos:
id (UUID)
entity_type (enum: vacuno, porcino, evento, infraestructura, factura, albaran)
entity_id (UUID, referencia genérica)
file_url (string)
file_name (string)
file_type (string)
mime_type (string)
uploaded_by (relación → user)
file_size (number)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


👤 Tabla: user
Campos:
id (UUID)
nombre (string)
contraseña (string)
email (string, único, opcional)
avatar_url (string, opcional)
role_id (relación → role)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


🛡️ Tabla: roles
Campos:
id (UUID)
nombre (string, único)
(ej: admin, gestor, usuario)
description (texto, opcional)


🔑 Tabla: permisos
Campos:
id (UUID)
nombre (string, único - ej: ver_vacuno, crear_vacuno, editar_vacuno, eliminar_vacuno, etc.)
descripcion (texto, opcional)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)


🔗 Tabla: roles_permisos
Campos:
id (UUID)
id_rol (relación → roles)
id_permiso (relación → permisos)
created_at (timestamp)
created_by (relación → usuarios)
updated_at (timestamp)
updated_by (relación → usuarios)
deleted_at (timestamp, opcional)



