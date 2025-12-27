// src/utils/onboardingStorage.js

/**
 * Utilitário para gerenciar estado do onboarding via localStorage
 */
export const OnboardingStorage = {
  getStep: function() {
    return localStorage.getItem('onboardingStep') || null
  },
  setStep: function(step) {
    localStorage.setItem('onboardingStep', step)
  },
  isComplete: function() {
    return localStorage.getItem('onboardingStep') === 'done'
  },
  complete: function() {
    localStorage.setItem('onboardingStep', 'done')
  },
  reset: function() {
    localStorage.removeItem('onboardingStep')
  }
}

// Expõe função de reset no window para facilitar testes
if (typeof window !== 'undefined') {
  window.resetTutorial = () => {
    localStorage.removeItem('onboardingStep')
    location.reload()
  }
}