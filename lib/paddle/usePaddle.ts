'use client'

import { useEffect, useState } from 'react'
import { initializePaddle, Paddle } from '@paddle/paddle-js'
import { getPaddleClientToken, getPaddleEnvironment } from './config'

/**
 * React hook to initialize and manage Paddle.js instance
 * Handles client-side Paddle SDK initialization with proper error handling
 */
export function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const initPaddle = async () => {
      try {
        const clientToken = getPaddleClientToken()
        const environment = getPaddleEnvironment()

        // Initialize Paddle with security settings
        const paddleInstance = await initializePaddle({
          token: clientToken,
          environment,
          // Enable checkout events for tracking
          eventCallback: (event: any) => {
            console.log('Paddle event:', event)
          }
        })

        if (mounted && paddleInstance) {
          setPaddle(paddleInstance)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to initialize Paddle:', err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize Paddle'))
          setIsLoading(false)
        }
      }
    }

    initPaddle()

    return () => {
      mounted = false
    }
  }, [])

  return { paddle, isLoading, error }
}
