'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { ImagePlus, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AspectRatio = 'square' | 'round' | '16:9' | '4:3'
type State = 'idle' | 'cropping' | 'uploading' | 'error'

const ASPECT_MAP: Record<AspectRatio, number> = {
  square:  1,
  round:   1,
  '16:9':  16 / 9,
  '4:3':   4 / 3,
}

// Tamaño de la miniatura en píxeles (lado del cuadrado)
const THUMB_SIZE = 120

interface Props {
  aspectRatio:      AspectRatio
  storageBucket:    string
  // Ruta dentro del bucket, ej. 'explotacion/logo'. Se sobreescribe en cada subida (upsert).
  storagePath:      string
  currentUrl?:      string
  onUploadComplete: (path: string) => void
  maxSizeMb?:    number
  // Lado máximo del output en px (lado largo). El canvas se escala antes de guardar.
  // Ejemplos: logo → 512, foto instalación → 1200, fondo fullscreen → 1920.
  // Default 1024 — cubre la mayoría de usos sin comprimir en exceso.
  outputSizePx?: number
}

// Recorta y redimensiona la imagen al área seleccionada, devuelve un Blob JPEG optimizado.
async function getCroppedImg(imageSrc: string, pixelCrop: Area, outputSizePx: number): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = reject
    image.src = imageSrc
  })
  // Escala el output al lado máximo manteniendo la proporción del recorte
  const aspectRatio = pixelCrop.width / pixelCrop.height
  const outW = aspectRatio >= 1 ? outputSizePx : Math.round(outputSizePx * aspectRatio)
  const outH = aspectRatio >= 1 ? Math.round(outputSizePx / aspectRatio) : outputSizePx

  const canvas = document.createElement('canvas')
  canvas.width  = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas vacío'))),
      'image/jpeg',
      0.85, // 85%: visualmente idéntico a 90% para logos, ~20% menos de peso
    )
  })
}

export function ImageUploadCropper({
  aspectRatio,
  storageBucket,
  storagePath,
  currentUrl,
  onUploadComplete,
  maxSizeMb = 8,
  outputSizePx = 1024,
}: Props) {
  const [state, setState]                         = useState<State>('idle')
  const [imgSrc, setImgSrc]                       = useState<string | null>(null)
  const [crop, setCrop]                           = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom]                           = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [errorMsg, setErrorMsg]                   = useState<string | null>(null)
  const [previewUrl, setPreviewUrl]               = useState<string | undefined>(currentUrl)
  const [isDragging, setIsDragging]               = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cuando el padre pasa un nuevo currentUrl (ej. tras guardar + revalidatePath), sincroniza el
  // preview interno para que el navegador cargue la URL con cache-buster actualizado
  useEffect(() => {
    if (state === 'idle') setPreviewUrl(currentUrl)
  }, [currentUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo debe ser una imagen')
      setState('error')
      return
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMsg(`El archivo no debe superar ${maxSizeMb} MB`)
      setState('error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImgSrc(reader.result as string)
      setState('cropping')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = '' // permite volver a seleccionar el mismo archivo
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  async function handleCrop() {
    if (!imgSrc || !croppedAreaPixels) return
    setState('uploading')
    setErrorMsg(null)
    try {
      const blob     = await getCroppedImg(imgSrc, croppedAreaPixels, outputSizePx)
      const supabase = createClient()
      // remove+upload en lugar de upsert: el upsert (UPDATE) puede fallar silenciosamente
      // si la fila ya existe en storage.objects, sin devolver error al cliente.
      await supabase.storage.from(storageBucket).remove([storagePath])
      const { error } = await supabase.storage
        .from(storageBucket)
        .upload(storagePath, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data } = supabase.storage.from(storageBucket).getPublicUrl(storagePath)
      // Cache-busting solo para el preview interno; onUploadComplete recibe la ruta limpia
      setPreviewUrl(`${data.publicUrl}?t=${Date.now()}`)
      onUploadComplete(storagePath)
      setState('idle')
      setImgSrc(null)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir la imagen')
      setState('error')
    }
  }

  function handleCancel() {
    setImgSrc(null)
    setState('idle')
    setErrorMsg(null)
  }

  const isRound = aspectRatio === 'round'

  return (
    <div className="flex flex-col gap-3">
      {/* ── Idle: miniatura + zona de drop ───────────────────── */}
      {state === 'idle' && (
        <div className="flex gap-4 items-stretch">
          {/* Miniatura a tamaño real */}
          <div
            className="shrink-0 overflow-hidden border border-divider bg-surface-alt flex items-center justify-center"
            style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: isRound ? '50%' : 8 }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Imagen actual" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus className="h-8 w-8 text-ink-muted/30" />
            )}
          </div>

          {/* Zona de drag & drop */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors select-none',
              isDragging
                ? 'border-world bg-world/5 dark:bg-world/10'
                : 'border-divider hover:border-stone-400 dark:hover:border-stone-500 hover:bg-surface-alt',
            )}
          >
            <Upload className={cn('h-5 w-5', isDragging ? 'text-world' : 'text-ink-muted')} />
            <div className="text-center px-3">
              <p className={cn('text-sm font-medium', isDragging ? 'text-world' : 'text-ink-muted')}>
                {isDragging ? 'Suelta para cargar' : 'Arrastra una imagen aquí'}
              </p>
              <p className="text-xs text-ink-muted/60 mt-0.5">
                o haz clic para seleccionar
              </p>
            </div>
            <p className="text-xs text-ink-muted/40">JPG, PNG, WEBP · Máx. {maxSizeMb} MB</p>
          </div>
        </div>
      )}

      {/* ── Cropping: editor con zoom y pan ───────────────────── */}
      {state === 'cropping' && imgSrc && (
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden rounded-lg border border-divider bg-stone-900"
            style={{ height: 300 }}
          >
            <Cropper
              image={imgSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT_MAP[aspectRatio]}
              cropShape={isRound ? 'round' : 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted shrink-0">Zoom</span>
            <input
              type="range"
              min={1} max={3} step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-world"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleCrop}>
              Recortar y guardar
            </Button>
          </div>
        </div>
      )}

      {/* ── Uploading ─────────────────────────────────────────── */}
      {state === 'uploading' && (
        <div className="flex items-center gap-2 text-sm text-ink-muted" style={{ minHeight: THUMB_SIZE }}>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-divider border-t-world" />
          Subiendo imagen…
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {state === 'error' && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-alert">{errorMsg}</p>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Reintentar
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
