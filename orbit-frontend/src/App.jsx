
// import './App.css'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginForm from './pages/Login'
import SignupForm from './pages/SignUp'
import CreatorOnBoard from './pages/onboardingpages/CreatorOnBoard'
import BrandOnBoard from './pages/onboardingpages/BrandOnBoard'
import ProtectedRoutes from './components/ProtectedRoutes'
import Dashboard from './pages/Dashboard'

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
        <Route path='/dashboard' element={<ProtectedRoutes>
          <Dashboard />
        </ProtectedRoutes>} />


      </Routes>
    </BrowserRouter>
  )
}
export default App;
