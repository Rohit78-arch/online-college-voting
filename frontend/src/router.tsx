import { createBrowserRouter } from "react-router-dom"

import AppShell from "@/components/layout/AppShell"
import { RequireAuth, RequireRole } from "@/routes/guards"

import LandingPage from "@/pages/LandingPage"
import RoleLoginPage from "@/pages/RoleLoginPage"
import VoterRegisterPage from "@/pages/VoterRegisterPage"
import CandidateRegisterPage from "@/pages/CandidateRegisterPage"
import OtpVerificationPage from "@/pages/OtpVerificationPage"

import VoterDashboard from "@/pages/dashboards/VoterDashboard"
import VotePage from "@/pages/voter/VotePage"
import CandidateDashboard from "@/pages/dashboards/CandidateDashboard"
import CandidateElectionResultsPage from "@/pages/candidate/CandidateElectionResultsPage"
import AdminDashboard from "@/pages/dashboards/AdminDashboard"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },

  // Explicit role portals
  {
    path: "/voter/login",
    element: <RoleLoginPage role="VOTER" />
  },
  {
    path: "/voter/register",
    element: <VoterRegisterPage />
  },
  {
    path: "/voter/verify-otp",
    element: <OtpVerificationPage role="VOTER" />
  },

  {
    path: "/candidate/login",
    element: <RoleLoginPage role="CANDIDATE" />
  },
  {
    path: "/candidate/register",
    element: <CandidateRegisterPage />
  },
  {
    path: "/candidate/verify-otp",
    element: <OtpVerificationPage role="CANDIDATE" />
  },

  {
    path: "/admin/login",
    element: <RoleLoginPage role="ADMIN" />
  },

  // Protected dashboards
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <RequireRole allowed={["VOTER"]} />,
            children: [
              { path: "/voter/dashboard", element: <VoterDashboard /> },
              { path: "/voter/elections/:electionId/vote", element: <VotePage /> }
            ]
          },
          {
            element: <RequireRole allowed={["CANDIDATE"]} />,
            children: [
              { path: "/candidate/dashboard", element: <CandidateDashboard /> },
              { path: "/candidate/elections/:electionId/results", element: <CandidateElectionResultsPage /> }
            ]
          },
          {
            element: <RequireRole allowed={["ADMIN"]} />,
            children: [{ path: "/admin/dashboard", element: <AdminDashboard /> }]
          }
        ]
      }
    ]
  }
])
