import {
  ClockIcon,
  HomeIcon,
  PlusIcon,
  StarIcon,
  XIcon,
} from 'lucide-react'
import { useState, type ComponentType, type SVGProps } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router'

import { AppHeader } from '@/components/dashboard/app-header'
import { WorkspaceSwitcher } from '@/components/dashboard/workspace-switcher'
import { LogoMark } from '@/components/logo'
import { CreateTeamDialog } from '@/components/teams/create-team-dialog'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar'
import { TeamsProvider, teamInitials, useTeams } from '@/context/teams-context'
import { cn } from '@/lib/utils'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

const personalNav: { to: string; label: string; icon: IconType; end?: boolean }[] = [
  { to: '.', label: 'Home', icon: HomeIcon, end: true },
  { to: 'recent', label: 'Recent', icon: ClockIcon },
  { to: 'starred', label: 'Starred', icon: StarIcon },
]

export function AppLayout() {
  const { workspaceId } = useParams()

  return (
    <TeamsProvider workspaceId={workspaceId}>
      <AppShell workspaceId={workspaceId} />
    </TeamsProvider>
  )
}

function AppShell({ workspaceId }: { workspaceId: string | undefined }) {
  const base = `/dashboard/org/${workspaceId}`
  const { pathname } = useLocation()
  const { teams, selectedTeam, canManageTeams, isLoadingTeams } = useTeams()
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const onHome = pathname === base || pathname === `${base}/`

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="gap-3 px-3 pt-4 pb-1">
          <Link to={base} className="flex items-center gap-2 px-1">
            <LogoMark className="size-7" />
            <span className="text-xl font-bold tracking-tight">kano</span>
          </Link>

          <WorkspaceSwitcher workspaceId={workspaceId} />
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <SidebarGroup className="border-b pt-0 pb-3">
            <SidebarGroupContent>
              <SidebarMenu>
                {personalNav.map(({ to, label, icon: Icon, end }) => (
                  <SidebarMenuItem key={label}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm [&_svg]:size-4',
                          isActive
                            ? 'bg-primary/25 text-foreground'
                            : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                        )
                      }
                    >
                      <Icon data-icon="inline-start" />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="pt-3">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Teams
            </SidebarGroupLabel>
            {canManageTeams ? (
              <SidebarGroupAction
                title="Create team"
                aria-label="Create team"
                onClick={() => setCreateTeamOpen(true)}
              >
                <PlusIcon />
              </SidebarGroupAction>
            ) : null}
            <SidebarGroupContent>
              {isLoadingTeams ? (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  Loading teams…
                </div>
              ) : teams.length === 0 ? (
                <div className="flex flex-col gap-1 px-2 py-1">
                  <p className="text-xs text-muted-foreground">No teams yet.</p>
                  {canManageTeams ? (
                    <button
                      type="button"
                      onClick={() => setCreateTeamOpen(true)}
                      className="text-left text-xs font-medium text-foreground hover:underline"
                    >
                      Create your first team
                    </button>
                  ) : null}
                </div>
              ) : (
                <SidebarMenu>
                  {teams.map((team) => {
                    const active = onHome && selectedTeam?.id === team.id
                    return (
                      <SidebarMenuItem key={team.id}>
                        <Link
                          to={`${base}?team=${team.id}`}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2.5 rounded-md px-2 py-1 text-sm',
                            active
                              ? 'bg-muted font-medium text-foreground'
                              : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-md',
                              active ? 'bg-primary text-primary-foreground' : 'bg-muted',
                            )}
                          >
                            <span className="text-[10px] font-bold">
                              {teamInitials(team.name)}
                            </span>
                          </span>
                          <span className="truncate">{team.name}</span>
                        </Link>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-3">
          <UpgradeCard />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-7xl xl:max-w-[1190px] flex-1 flex-col px-6 py-6 pt-4 lg:px-10">
          <Outlet />
        </main>
      </div>

      <CreateTeamDialog open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
    </SidebarProvider>
  )
}

function UpgradeCard() {
  return (
    <div className="relative rounded-lg border bg-card p-4 text-card-foreground">
      <button
        type="button"
        aria-label="Dismiss upgrade prompt"
        className="absolute right-2 top-2 flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted"
      >
        <XIcon className="size-3" />
      </button>
      <div className="mb-3 flex size-8 items-center justify-center rounded-md bg-primary/15">
        <span aria-hidden className="text-base">
          ✏️
        </span>
      </div>
      <p className="text-sm font-semibold leading-snug">
        Ideas move
        <br />
        faster together.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Draw, plan, and build with your team and AI.
      </p>
      <Button variant="secondary" className="mt-3 w-full">
        Upgrade plan
      </Button>
    </div>
  )
}