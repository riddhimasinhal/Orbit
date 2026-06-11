
// import './App.css'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginForm from './pages/Login'
import SignupForm from './pages/SignUp'
import CreatorOnBoard from './pages/onboardingpages/CreatorOnBoard'
import BrandOnBoard from './pages/onboardingpages/BrandOnBoard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<LoginForm />} />
        <Route path='/signup' element={<SignupForm />} />
        <Route path='/creator-onboarding' element={<CreatorOnBoard />} />
        <Route path='/brand-onboarding' element={<BrandOnBoard />} />


      </Routes>
    </BrowserRouter>
  )
}
export default App;
