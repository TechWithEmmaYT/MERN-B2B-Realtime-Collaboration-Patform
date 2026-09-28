import { useQuery } from '@tanstack/react-query'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, Settings2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar'
import { WorkspaceAvatar } from '@/components/workspace-avatar'
import { getMyWorkspacesQueryFn } from '@/lib/api'

const roleLabel = { owner: 'Owner', admin: 'Admin', member: 'Member' } as const

export function WorkspaceSwitcher({ workspaceId }: { workspaceId?: string }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: getMyWorkspacesQueryFn,
  })

  const workspaces = data?.workspaces ?? []
  const current = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isLoading || !current ? (
          <SidebarMenuSkeleton showIcon className="h-12" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <WorkspaceAvatar {...current} />
                <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <span className="truncate font-medium">{current.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {roleLabel[current.role]}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 p-1.5"
              align="start"
            >
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  className="gap-2.5 py-2"
                  onSelect={() => navigate(`/dashboard/org/${workspace.id}`)}
                >
                  <WorkspaceAvatar {...workspace} className="size-6 rounded-md text-[10px]" />
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  {workspace.id === current.id && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2.5 py-2"
                onSelect={() => navigate(`/dashboard/org/${current.id}/settings/members`)}
              >
                <Settings2Icon className="size-4 text-muted-foreground" />
                Settings &amp; members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2.5 py-2"
                onSelect={() => navigate('/onboarding/workspace')}
              >
                <span className="flex size-6 items-center justify-center rounded-md border">
                  <PlusIcon className="size-3.5" />
                </span>
                Create workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
