import { useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeSubscriptionConfig {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onEvent: (payload: any) => void
}

export function useRealtime(configs: RealtimeSubscriptionConfig[], enabled: boolean = true) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || configs.length === 0) return

    // Create a single channel for all subscriptions
    const channel = supabase.channel('realtime-updates')

    // Add all subscriptions to the channel
    configs.forEach(({ table, event = '*', filter, onEvent }) => {
      const subscription: any = {
        event: 'postgres_changes' as const,
        schema: 'public',
        table,
        ...(filter && { filter })
      }

      channel.on('postgres_changes', subscription, (payload) => {
        if (event === '*' || payload.eventType === event) {
          onEvent(payload)
        }
      })
    })

    // Subscribe to the channel
    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [configs, enabled])

  return channelRef.current
}