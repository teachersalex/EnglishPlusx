import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AudioPlayer({ audioUrl, coverImage, episodeTitle, initialTime, onTimeUpdate, transcript }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showTranscript, setShowTranscript] = useState(false)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5]

  // Seta tempo inicial quando carrega
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoaded = () => {
      setDuration(audio.duration)
      if (initialTime && initialTime > 0) {
        audio.currentTime = initialTime
      }
    }

    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => audio.removeEventListener('loadedmetadata', handleLoaded)
  }, [initialTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
    }
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Salva tempo a cada 10 segundos
  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        onTimeUpdate(audioRef.current.currentTime)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  // Salva tempo ao pausar
  const handlePause = () => {
    if (onTimeUpdate && audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
      handlePause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds) => {
    audioRef.current.currentTime += seconds
  }

  const changeSpeed = (speed) => {
    setPlaybackRate(speed)
    audioRef.current.playbackRate = speed
  }

  const handleProgressClick = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Capa */}
      <div className="mb-6">
        <img 
          src={coverImage} 
          alt={episodeTitle}
          className="w-full h-48 object-cover rounded-xl"
        />
        <p className="text-white font-bold text-center mt-3">{episodeTitle}</p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-2 bg-[#E50914] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/50 text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles principais */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Voltar 5s */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(-5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <span className="text-xs font-bold">-5s</span>
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white text-2xl hover:bg-[#B20710] transition-colors shadow-lg"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>

        {/* Avançar 5s */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <span className="text-xs font-bold">+5s</span>
        </motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex items-center justify-center gap-2">
        {speeds.map((speed) => (
          <motion.button
            key={speed}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              playbackRate === speed
                ? 'bg-[#E50914] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>

      <p className="text-white/50 text-center text-sm mt-4">
        🎧 Ouça com atenção
      </p>

      {/* Botão Transcrição */}
      {transcript && (
        <div className="mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {showTranscript ? 'Esconder Transcrição' : 'Ver Transcrição'}
          </motion.button>

          {showTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-white/10 rounded-xl p-4 max-h-60 overflow-y-auto"
            >
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                {transcript}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}