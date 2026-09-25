import { useParams } from 'react-router'

export function TeamPage() {
  const { workspaceId } = useParams()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
      <p className="text-muted-foreground">Members of workspace {workspaceId}</p>
    </div>
  )
}
