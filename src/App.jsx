import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProviders } from './contexts'
import SplashScreen from './components/SplashScreen'
import Home from './components/home/Home'
import SeriesPage from './components/SeriesPage'
import EpisodePage from './components/episode/EpisodePage'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/series/:id" element={<SeriesPage />} />
          <Route path="/series/:id/episode/:episodeId" element={<EpisodePage />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}

export default App