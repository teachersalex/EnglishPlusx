// src/components/TypingSoundEngine.js
// Som de teclado real com variação natural
// ============================================

class TypingSoundEngine {
  constructor() {
    this.audioContext = null
    this.audioBuffer = null
    this.enabled = true
    this.isLoading = false
  }

  async init() {
    if (this.audioContext) return
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Carrega o arquivo de som uma vez
    if (!this.audioBuffer && !this.isLoading) {
      this.isLoading = true
      try {
        const response = await fetch('/audio/keySound.mp3')
        const arrayBuffer = await response.arrayBuffer()
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      } catch (err) {
        console.warn('Não foi possível carregar som de teclado:', err)
      }
      this.isLoading = false
    }
  }

  play() {
    if (!this.enabled || !this.audioContext || !this.audioBuffer) return
    
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    // Cria source node
    const source = this.audioContext.createBufferSource()
    source.buffer = this.audioBuffer
    
    // Variação de pitch (0.9 a 1.1) — cada tecla soa diferente
    source.playbackRate.value = 0.9 + Math.random() * 0.2
    
    // Gain node para volume
    const gainNode = this.audioContext.createGain()
    // Variação de volume (0.3 a 0.5) — sutil mas presente
    gainNode.gain.value = 0.3 + Math.random() * 0.2
    
    // Conecta
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    // Toca apenas os primeiros 100ms do arquivo
    source.start(0, 0, 0.1)
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  setEnabled(value) {
    this.enabled = value
  }
}

// Singleton - uma instância para todo o app
export const typingSound = new TypingSoundEngine()
export default TypingSoundEngine