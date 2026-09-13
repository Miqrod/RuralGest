import { PageContainer } from '@/components/layout/PageContainer'
import { listarInstalaciones } from '@/modules/ganadero/instalaciones/application/queries/listarInstalaciones'
import { InstalacionesTable } from './InstalacionesTable'

export default async function InstalacionesConfigPage() {
  const instalaciones = await listarInstalaciones()

  return (
    <PageContainer>
      <InstalacionesTable data={instalaciones} />
    </PageContainer>
  )
}
