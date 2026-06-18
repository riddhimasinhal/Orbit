
// import './App.css'

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginForm from './pages/Login'
import SignupForm from './pages/SignUp'
import CreatorOnBoard from './pages/onboardingpages/CreatorOnBoard'
import BrandOnBoard from './pages/onboardingpages/BrandOnBoard'
import ProtectedRoutes from './components/ProtectedRoutes'

import CreatorDashboard from './pages/dashboard/CreatorDashboard'
import BrandDashboard from './pages/dashboard/BrandDashboard'

import CreatorLayout from "./layouts/CreatorLayout"
import BrandLayout from "./layouts/BrandLayout"
import CreatorProfile from "./pages/profilePages/CreatorProfile"
import CreatorSettings from "./pages/settings/CreatorSettings"
import BrandProfile from "./pages/profilePages/BrandProfile"
import BrandSettings from "./pages/settings/BrandSettings"
import BrowseCreators from "./pages/BrowseCreators"
import BrowseBrands from "./pages/BrowseBrands"
import CreatorDetail from "./pages/CreatorDetail"
import BrandDetail from "./pages/BrandDetail"
import Requests from "./pages/Requests"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<LoginForm />} />
        <Route path='/signup' element={<SignupForm />} />
        <Route path='/creator-onboarding'
          element={
            <ProtectedRoutes>
              <CreatorOnBoard />
            </ProtectedRoutes>} />
        <Route path='/brand-onboarding'
          element=
          {<ProtectedRoutes>
            <BrandOnBoard />
          </ProtectedRoutes>}
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
          <Route path="settings" element={<CreatorSettings />} />
          <Route path="browse" element={<BrowseBrands />} />
          <Route path="brand/:id" element={<BrandDetail />} />
          <Route path="requests" element={<Requests />} />
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
          <Route path="creator/:id" element={<CreatorDetail />} />
          <Route path="requests" element={<Requests />} />
        </Route>

        <Route path="/creator-dashboard" element={<Navigate to="/creator/dashboard" replace />} />
        <Route path="/brand-dashboard" element={<Navigate to="/brand/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
export default App;
