/**
 * Editor — Central orchestrator for the design canvas plugin system.
 *
 * Adapted from vue-fabric-editor's Editor.ts:
 * - Plugin registration via use()
 * - API proxying (plugin methods become editor methods)
 * - Event delegation to EventBus
 * - Plugin lifecycle management (setup → destroy)
 */

import type { Canvas as FabricCanvas } from 'fabric'
import { EventBus } from './event-bus'
import type {
  IEditor,
  IPluginTempl,
  IPluginClass,
  IContextMenuItem,
  IShortcut,
} from './types'

export class Editor implements IEditor {
  canvas: FabricCanvas
  private eventBus: EventBus
  private plugins: Map<string, IPluginTempl> = new Map()
  private pluginApis: Map<string, Set<string>> = new Map()

  constructor(canvas: FabricCanvas) {
    this.canvas = canvas
    this.eventBus = new EventBus()
  }

  /**
   * Register a plugin with the editor.
   * Instantiates the plugin, calls setup(), and proxies its public methods
   * onto the editor instance for convenient access.
   */
  async use(PluginClass: IPluginClass): Promise<void> {
    const plugin = new PluginClass(this.canvas, this)
    const name = plugin.pluginName

    if (this.plugins.has(name)) {
      console.warn(`[Editor] Plugin "${name}" already registered, skipping.`)
      return
    }

    this.plugins.set(name, plugin)

    // Proxy plugin methods onto the editor (skip lifecycle/internal methods)
    const skipMethods = new Set([
      'constructor',
      'setup',
      'destroy',
      'pluginName',
      'canvas',
      'editor',
      'getContextMenuItems',
      'getShortcuts',
    ])

    const apiMethods = new Set<string>()
    const proto = Object.getPrototypeOf(plugin)
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (key) => typeof proto[key] === 'function' && !skipMethods.has(key) && !key.startsWith('_')
    )

    for (const methodName of methodNames) {
      // Prefix with plugin name to avoid collisions
      // Also register the unprefixed name if no collision
      const prefixedName = `${name}:${methodName}`
      const method = proto[methodName].bind(plugin)

      // Always register the prefixed version
      ;(this as unknown as Record<string, unknown>)[prefixedName] = method
      apiMethods.add(prefixedName)

      // Register unprefixed if no collision
      if (!(methodName in this) && !(this as unknown as Record<string, unknown>)[methodName]) {
        ;(this as unknown as Record<string, unknown>)[methodName] = method
        apiMethods.add(methodName)
      }
    }

    this.pluginApis.set(name, apiMethods)

    // Call plugin setup
    if (plugin.setup) {
      await plugin.setup(this)
    }
  }

  /**
   * Get a registered plugin by name.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPlugin<T = any>(name: string): T {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`[Editor] Plugin "${name}" not found.`)
    }
    return plugin as T
  }

  /**
   * Check if a plugin is registered.
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * Emit an event to all listeners.
   */
  emit(event: string, ...args: unknown[]): void {
    this.eventBus.emit(event, ...args)
  }

  /**
   * Subscribe to an event.
   */
  on(event: string, handler: (...args: unknown[]) => void): void {
    this.eventBus.on(event, handler)
  }

  /**
   * Unsubscribe from an event.
   */
  off(event: string, handler: (...args: unknown[]) => void): void {
    this.eventBus.off(event, handler)
  }

  /**
   * Collect context menu items from all registered plugins.
   */
  getContextMenuItems(): IContextMenuItem[] {
    const items: IContextMenuItem[] = []
    for (const plugin of this.plugins.values()) {
      if (plugin.getContextMenuItems) {
        items.push(...plugin.getContextMenuItems())
      }
    }
    return items
  }

  /**
   * Collect keyboard shortcuts from all registered plugins.
   */
  getShortcuts(): IShortcut[] {
    const shortcuts: IShortcut[] = []
    for (const plugin of this.plugins.values()) {
      if (plugin.getShortcuts) {
        shortcuts.push(...plugin.getShortcuts())
      }
    }
    return shortcuts
  }

  /**
   * Get all registered plugin names.
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys())
  }

  /**
   * Destroy the editor and all plugins.
   * Calls destroy() on each plugin in reverse registration order,
   * clears the EventBus, and removes proxied methods.
   */
  destroy(): void {
    // Destroy plugins in reverse order
    const pluginEntries = Array.from(this.plugins.entries()).reverse()
    for (const [name, plugin] of pluginEntries) {
      try {
        plugin.destroy?.()
      } catch (err) {
        console.error(`[Editor] Error destroying plugin "${name}":`, err)
      }

      // Remove proxied methods
      const apis = this.pluginApis.get(name)
      if (apis) {
        for (const apiName of apis) {
          delete (this as unknown as Record<string, unknown>)[apiName]
        }
      }
    }

    this.plugins.clear()
    this.pluginApis.clear()
    this.eventBus.removeAll()
  }
}
