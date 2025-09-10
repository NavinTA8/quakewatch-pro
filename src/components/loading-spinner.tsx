'use client'

import { Activity } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export const LoadingSpinner = ({ 
  size = 'md', 
  text,
  className = '' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className="relative">
        <Activity 
          className={`${sizeClasses[size]} text-blue-600 animate-spin`}
          style={{
            animationDuration: '2s'
          }}
        />
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-2 border-blue-200 border-t-transparent rounded-full animate-spin`}
          style={{
            animationDuration: '1s'
          }}
        />
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 text-center`}>
          {text}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner