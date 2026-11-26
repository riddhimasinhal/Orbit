import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// Core entry & public auth pages (eager loaded for instant first paint)
import LandingPage from './pages/LandingPage';
import LoginForm from './pages/Login';
import SignupForm from './pages/SignUp';
import ProtectedRoutes from './components/ProtectedRoutes';

// Layouts
import CreatorLayout from "./layouts/CreatorLayout";
import BrandLayout from "./layouts/BrandLayout";
import AdminLayout from "./layouts/AdminLayout";

// Onboarding pages (lazy-loaded)
const CreatorOnBoard = lazy(() => import("./pages/onboardingpages/CreatorOnBoard"));
const BrandOnBoard = lazy(() => import("./pages/onboardingpages/BrandOnBoard"));

// Primary Dashboards (lazy-loaded)
const CreatorDashboard = lazy(() => import("./pages/dashboard/CreatorDashboard"));
const BrandDashboard = lazy(() => import("./pages/dashboard/BrandDashboard"));

// Lazy-loaded routes for code splitting
const CreatorProfile = lazy(() => import("./pages/profilePages/CreatorProfile"));
const CreatorSettings = lazy(() => import("./pages/settings/CreatorSettings"));
const BrandProfile = lazy(() => import("./pages/profilePages/BrandProfile"));
const BrandSettings = lazy(() => import("./pages/settings/BrandSettings"));
const BrowseCreators = lazy(() => import("./pages/BrowseCreators"));
const BrowseBrands = lazy(() => import("./pages/BrowseBrands"));
const CreatorDetail = lazy(() => import("./pages/CreatorDetail"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Requests = lazy(() => import("./pages/Requests"));
const Messages = lazy(() => import("./pages/Messages"));
const BrowseCampaigns = lazy(() => import("./pages/campaigns/BrowseCampaigns"));
const CampaignDetail = lazy(() => import("./pages/campaigns/CampaignDetail"));
const BrandCampaigns = lazy(() => import("./pages/campaigns/BrandCampaigns"));
const CreateCampaign = lazy(() => import("./pages/campaigns/CreateCampaign"));
const BrandCampaignDetail = lazy(() => import("./pages/campaigns/BrandCampaignDetail"));
const CreatorApplications = lazy(() => import("./pages/campaigns/CreatorApplications"));
const Collaborations = lazy(() => import("./pages/collaborations/Collaborations"));
const CollaborationWorkspace = lazy(() => import("./pages/collaborations/CollaborationWorkspace"));
const CreatorPortfolio = lazy(() => import("./pages/portfolio/CreatorPortfolio"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const BlockedUsers = lazy(() => import("./pages/moderation/BlockedUsers"));
const CreatorAnalytics = lazy(() => import("./pages/analytics/CreatorAnalytics"));
const BrandAnalytics = lazy(() => import("./pages/analytics/BrandAnalytics"));

// Admin pages (lazy-loaded)
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));

const PageLoader = () => (
  <div className="flex min-h-[400px] h-full w-full items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent dark:border-neutral-100"></div>
      <span className="text-xs font-medium text-neutral-500">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginForm />} />
          <Route path='/signup' element={<SignupForm />} />
          <Route
            path='/creator-onboarding'
            element={
              <ProtectedRoutes>
                <CreatorOnBoard />
              </ProtectedRoutes>
            }
          />
          <Route
            path='/brand-onboarding'
            element={
              <ProtectedRoutes>
                <BrandOnBoard />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/creator"
            element={
              <ProtectedRoutes>
                <CreatorLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CreatorDashboard />} />
            <Route path="profile" element={<CreatorProfile />} />
            <Route path="portfolio" element={<CreatorPortfolio />} />
            <Route path="settings" element={<CreatorSettings />} />
            <Route path="browse" element={<BrowseBrands />} />
            <Route path="campaigns" element={<BrowseCampaigns />} />
            <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
            <Route path="applications" element={<CreatorApplications />} />
            <Route path="collaborations" element={<Collaborations />} />
            <Route path="collaborations/:collaborationId" element={<CollaborationWorkspace />} />
            <Route path="brand/:id" element={<BrandDetail />} />
            <Route path="requests" element={<Requests />} />
            <Route path="analytics" element={<CreatorAnalytics />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="blocked-users" element={<BlockedUsers />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Messages />} />
          </Route>

          <Route
            path="/brand"
            element={
              <ProtectedRoutes>
                <BrandLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BrandDashboard />} />
            <Route path="profile" element={<BrandProfile />} />
            <Route path="settings" element={<BrandSettings />} />
            <Route path="browse" element={<BrowseCreators />} />
            <Route path="campaigns" element={<BrandCampaigns />} />
            <Route path="campaigns/new" element={<CreateCampaign />} />
            <Route path="campaigns/:campaignId" element={<BrandCampaignDetail />} />
            <Route path="collaborations" element={<Collaborations />} />
            <Route path="collaborations/:collaborationId" element={<CollaborationWorkspace />} />
            <Route path="creator/:id" element={<CreatorDetail />} />
            <Route path="requests" element={<Requests />} />
            <Route path="analytics" element={<BrandAnalytics />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="blocked-users" element={<BlockedUsers />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Messages />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoutes>
                <AdminLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<Navigate to="verifications" replace />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="creator/:id" element={<CreatorDetail />} />
          </Route>

          <Route path="/creator-dashboard" element={<Navigate to="/creator/dashboard" replace />} />
          <Route path="/brand-dashboard" element={<Navigate to="/brand/dashboard" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
