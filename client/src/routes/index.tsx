import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout } from '@/layouts/app-layout'
import SignInPage from '@/pages/auth/sign-in'
import SignUpPage from '@/pages/auth/sign-up'
import { BoardPage } from '@/pages/board/board-page'
import { DashboardHomePage } from '@/pages/dashboard/dashboard-home'
import { TeamPage } from '@/pages/dashboard/team'
import CreateWorkspacePage from '@/pages/onboarding/create-workspace'
import InviteTeamPage from '@/pages/onboarding/invite-team'
import WorkspaceReadyPage from '@/pages/onboarding/workspace-ready'
import { DashboardHomeRedirect } from '@/routes/home-redirect'
import { ProtectedRoute } from '@/routes/protected-route'
import { PublicRoute } from '@/routes/public-route'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    element: <PublicRoute />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding/workspace', element: <CreateWorkspacePage /> },
      { path: '/onboarding/invite', element: <InviteTeamPage /> },
      { path: '/onboarding/ready', element: <WorkspaceReadyPage /> },
      { path: '/dashboard', element: <DashboardHomeRedirect /> },
      {
        path: '/dashboard/org/:workspaceId',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardHomePage /> },
          { path: 'team', element: <TeamPage /> },
        ],
      },
      { path: '/boards/:boardId', element: <BoardPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
