import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import SplashScreen from './components/SplashScreen'
import Home from './components/Home'
import SeriesPage from './components/SeriesPage'
import EpisodePage from './components/EpisodePage'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/series/:id" element={<SeriesPage />} />
          <Route path="/series/:id/episode/:episodeId" element={<EpisodePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App