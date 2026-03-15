/**
 * EventBus — Simple typed event emitter for the editor plugin system.
 * Replaces vue-fabric-editor's Node.js EventEmitter with a browser-native implementation.
 */

type EventHandler = (...args: unknown[]) => void

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>()

  /**
   * Subscribe to an event.
   */
  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  /**
   * Unsubscribe from an event.
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Subscribe to an event once — handler auto-removes after first call.
   */
  once(event: string, handler: EventHandler): void {
    const wrapper: EventHandler = (...args) => {
      this.off(event, wrapper)
      handler(...args)
    }
    this.on(event, wrapper)
  }

  /**
   * Emit an event, calling all subscribed handlers.
   */
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    // Iterate over a copy to allow handlers to unsubscribe during emit
    for (const handler of [...handlers]) {
      try {
        handler(...args)
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err)
      }
    }
  }

  /**
   * Remove all listeners for all events.
   */
  removeAll(): void {
    this.listeners.clear()
  }

  /**
   * Get the number of listeners for an event (useful for debugging).
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0
  }
}
