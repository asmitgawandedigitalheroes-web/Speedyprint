/**
 * GroupPlugin — Group/ungroup selected objects.
 */

import { Group, ActiveSelection, type Canvas as FabricCanvas, type FabricObject } from 'fabric'
import type { IPluginTempl, IEditor, IShortcut, IContextMenuItem } from '../types'

export class GroupPlugin implements IPluginTempl {
  pluginName = 'GroupPlugin'
  canvas: FabricCanvas
  editor: IEditor

  constructor(canvas: FabricCanvas, editor: IEditor) {
    this.canvas = canvas
    this.editor = editor
  }

  /**
   * Group the currently selected objects.
   */
  group(): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof ActiveSelection)) return
    if (active.getObjects().length < 2) return

    // Save history
    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }

    const objects = active.getObjects()
    this.canvas.discardActiveObject()

    // Remove objects from canvas
    objects.forEach((obj) => this.canvas.remove(obj))

    // Create group
    const group = new Group(objects, {
      canvas: this.canvas,
    })

    this.canvas.add(group)
    this.canvas.setActiveObject(group)
    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  /**
   * Ungroup the currently selected group.
   */
  ungroup(): void {
    const active = this.canvas.getActiveObject()
    if (!active || !(active instanceof Group)) return

    // Save history
    if (this.editor.hasPlugin('HistoryPlugin')) {
      this.editor.getPlugin<{ saveState: () => void }>('HistoryPlugin').saveState()
    }

    const objects = active.getObjects()
    // Remove group, add objects individually
    this.canvas.remove(active)

    const addedObjects: FabricObject[] = []
    objects.forEach((obj) => {
      this.canvas.add(obj)
      addedObjects.push(obj)
    })

    // Select all ungrouped objects
    if (addedObjects.length > 0) {
      const selection = new ActiveSelection(addedObjects, { canvas: this.canvas })
      this.canvas.setActiveObject(selection)
    }

    this.canvas.requestRenderAll()
    this.editor.emit('canvas:dirty')
  }

  getShortcuts(): IShortcut[] {
    return [
      { keys: 'ctrl+g', label: 'Group', action: () => this.group(), group: 'Object' },
      { keys: 'ctrl+shift+g', label: 'Ungroup', action: () => this.ungroup(), group: 'Object' },
    ]
  }

  getContextMenuItems(): IContextMenuItem[] {
    const active = this.canvas.getActiveObject()
    const items: IContextMenuItem[] = []

    if (active instanceof ActiveSelection && active.getObjects().length >= 2) {
      items.push({
        label: 'Group',
        shortcut: 'Ctrl+G',
        action: () => this.group(),
        group: 'group',
      })
    }

    if (active instanceof Group) {
      items.push({
        label: 'Ungroup',
        shortcut: 'Ctrl+Shift+G',
        action: () => this.ungroup(),
        group: 'group',
      })
    }

    return items
  }
}
