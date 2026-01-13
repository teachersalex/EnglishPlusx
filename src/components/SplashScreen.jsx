// src/components/SplashScreen.jsx
import { motion } from 'framer-motion'
import { useEffect } from 'react'

function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish()
    }, 2500)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#F0F0F0] flex items-center justify-center"
    >
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
    </motion.div>
  )
}

export default SplashScreen