'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import * as z from 'zod'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email:    values.email,
      password: values.password,
    })

    if (error) {
      form.setError('root', { message: 'Email o contraseña incorrectos' })
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm bg-canvas rounded-2xl shadow-md border border-divider/30 px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Hermanos Rodríguez</h1>
        <p className="text-sm text-ink-muted mt-1">Gestión ganadera</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  placeholder="tu@email.com"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
