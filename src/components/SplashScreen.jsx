// src/components/SplashScreen.jsx
// 🔧 FIX v16: Deps vazias no useEffect (onFinish não muda logicamente)

import { motion } from 'framer-motion'
import { useEffect } from 'react'

function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish()
    }, 2500)
    
    return () => clearTimeout(timer)
  }, [])  // 🔧 FIX: Deps vazias - onFinish não vai mudar durante o splash

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[#1A1A1A] text-5xl font-bold"
        >
          Teacher Alex
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[#E50914] text-3xl font-bold mt-2"
        >
          ENGLISH+
        </motion.p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="h-1 bg-[#E50914] mx-auto mt-6 rounded-full"
        />
      </div>
    </div>
  )
}

export default SplashScreen