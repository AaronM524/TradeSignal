"use client"

import { useState, useEffect, useCallback } from "react"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === "granted"
    } catch (error) {
      console.error("Failed to request notification permission:", error)
      return false
    }
  }, [isSupported])

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== "granted") return null
    
    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      })
      
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      
      return notification
    } catch (error) {
      console.error("Failed to send notification:", error)
      return null
    }
  }, [isSupported, permission])

  const sendSignalNotification = useCallback((
    ticker: string,
    signalType: "bullish_entry" | "bearish_entry" | "exit_warning",
    score: number,
    triggers: string[]
  ) => {
    const typeText = signalType === "bullish_entry" ? "Bullish" : signalType === "bearish_entry" ? "Bearish" : "Exit"
    const title = `${typeText} Signal: ${ticker}`
    const body = `Score: ${score}/100\n${triggers.slice(0, 3).join(", ")}`
    
    return sendNotification(title, {
      body,
      tag: `signal-${ticker}-${Date.now()}`,
      requireInteraction: score >= 75,
    })
  }, [sendNotification])

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendSignalNotification,
  }
}
