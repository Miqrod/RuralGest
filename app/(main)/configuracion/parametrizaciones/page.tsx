import { PageContainer } from '@/components/layout/PageContainer'
import { getParametrizaciones } from '@/modules/ganadero/parametrizacion/application/queries/getParametrizaciones'
import { FormParametrizaciones } from './FormParametrizaciones'

export default async function ParametrizacionesPage() {
  const parametrizaciones = await getParametrizaciones()

  return (
    <PageContainer>
      <FormParametrizaciones parametrizaciones={parametrizaciones} />
    </PageContainer>
  )
}
