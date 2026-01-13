import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppProviders } from './contexts'
import SplashScreen from './components/SplashScreen'
import Home from './components/home/Home'
import SeriesPage from './components/SeriesPage'
import EpisodePage from './components/episode/EpisodePage'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen 
            key="splash"
            onFinish={() => setShowSplash(false)} 
          />
        )}
      </AnimatePresence>

      {!showSplash && (
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
      )}
    </>
  )
}

export default App