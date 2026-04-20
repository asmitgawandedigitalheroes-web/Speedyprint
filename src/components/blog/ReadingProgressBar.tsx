'use client'

import { useEffect, useState } from 'react'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      const scrolled = window.scrollY
      
      if (scrollHeight - clientHeight > 0) {
        const percentage = (scrolled / (scrollHeight - clientHeight)) * 100
        setProgress(percentage)
      }
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress() // Initial check

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div 
      className="reading-progress-bar" 
      style={{ width: `${progress}%` }} 
    />
  )
}
