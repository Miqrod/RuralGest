import { PageContainer } from '@/components/layout/PageContainer'
import { getExplotacion } from '@/modules/ganadero/explotacion/application/queries/getExplotacion'
import { FormExplotacion } from './FormExplotacion'

export default async function ExplotacionPage() {
  const explotacion = await getExplotacion()

  return (
    <PageContainer>
      <FormExplotacion explotacion={explotacion} />
    </PageContainer>
  )
}
