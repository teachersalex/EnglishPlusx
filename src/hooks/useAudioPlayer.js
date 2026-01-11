// src/hooks/useAudioPlayer.js
// Toda lógica de estado e controle do player de áudio
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react'

export function useAudioPlayer({ 
  audioUrl, 
  initialTime = 0, 
  onTimeUpdate,
  onAudioComplete 
}) {
  const audioRef = useRef(null)
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)

  // ========== EFFECTS ==========

  // Carrega metadados e posição inicial
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoaded = () => {
      setDuration(audio.duration)
      setIsLoaded(true)
      if (initialTime && initialTime > 0) {
        audio.currentTime = initialTime
      }
    }

    // Se já carregou (cache), dispara manualmente
    if (audio.readyState >= 2) {
      handleLoaded()
    }

    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => audio.removeEventListener('loadedmetadata', handleLoaded)
  }, [initialTime, audioUrl])

  // Atualiza tempo atual e detecta fim
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    
    const handleEnded = () => {
      setIsPlaying(false)
      if (onAudioComplete) onAudioComplete()
      if (onTimeUpdate) onTimeUpdate(audio.currentTime)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)

    // 🔧 FIX: Para o áudio ao desmontar (bug do áudio continuando)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
    }
  }, [onTimeUpdate, onAudioComplete])

  // Auto-save periódico do tempo
  useEffect(() => {
    if (!onTimeUpdate) return

    const interval = setInterval(() => {
      const audio = audioRef.current
      if (audio && !audio.paused) {
        onTimeUpdate(audio.currentTime)
      }
    }, 10000) // 10 segundos

    return () => clearInterval(interval)
  }, [onTimeUpdate])

  // ========== HANDLERS ==========

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      if (onTimeUpdate) onTimeUpdate(audio.currentTime)
    } else {
      try {
        await audio.play()
      } catch (err) {
        console.error('Erro ao tocar áudio:', err)
      }
    }
  }, [isPlaying, onTimeUpdate])

  const changeSpeed = useCallback((speed) => {
    setPlaybackRate(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }, [])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (audio) {
      const clampedTime = Math.max(0, Math.min(time, duration))
      audio.currentTime = clampedTime
      setCurrentTime(clampedTime)
    }
  }, [duration])

  const skip = useCallback((seconds) => {
    const audio = audioRef.current
    if (audio) {
      seek(audio.currentTime + seconds)
    }
  }, [seek])

  const seekToPercent = useCallback((percent) => {
    seek(percent * duration)
  }, [seek, duration])

  // Reset para mudança de episódio
  const reset = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTime(0)
    setPlaybackRate(1)
  }, [])

  // ========== UTILS ==========

  const formatTime = useCallback((time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  const progress = duration ? (currentTime / duration) * 100 : 0

  return {
    // Ref para o elemento <audio>
    audioRef,
    
    // Estado
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    progress,
    isLoaded,
    
    // Handlers
    togglePlay,
    changeSpeed,
    seek,
    skip,
    seekToPercent,
    reset,
    
    // Utils
    formatTime
  }
}
