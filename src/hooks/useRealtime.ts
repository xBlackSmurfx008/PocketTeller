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

    // Create a single channel for all subscriptions with enhanced error handling
    const channelName = `realtime-updates-${Date.now()}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: 'user' }
      }
    })

    // Add all subscriptions to the channel
    configs.forEach(({ table, event = '*', filter, onEvent }) => {
      const subscription: any = {
        event: 'postgres_changes' as const,
        schema: 'public',
        table,
        ...(filter && { filter })
      }

      channel.on('postgres_changes', subscription, (payload) => {
        try {
          if (event === '*' || payload.eventType === event) {
            onEvent(payload)
          }
        } catch (error) {
          console.error(`Error handling realtime event for table ${table}:`, error)
        }
      })
    })

    // Enhanced subscription with error handling
    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime channel ${channelName} subscribed successfully`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime channel ${channelName} error`)
        } else if (status === 'TIMED_OUT') {
          console.warn(`Realtime channel ${channelName} timed out`)
        }
      })

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