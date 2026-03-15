/**
 * Plugin barrel export.
 */

// Phase 2 — Core plugins (extracted from original DesignerCanvas)
export { HistoryPlugin } from './HistoryPlugin'
export { CopyPastePlugin } from './CopyPastePlugin'
export { ZoomPlugin } from './ZoomPlugin'
export { ZonePlugin } from './ZonePlugin'
export { SnapPlugin } from './SnapPlugin'
export { KeyboardPlugin } from './KeyboardPlugin'

// Phase 3 — Context menu
export { ContextMenuPlugin } from './ContextMenuPlugin'

// Phase 4 — Group, align, flip, grid
export { GroupPlugin } from './GroupPlugin'
export { AlignPlugin } from './AlignPlugin'
export { FlipPlugin } from './FlipPlugin'
export { GridPlugin } from './GridPlugin'

// Phase 5 — Enhanced text
export { TextPlugin } from './TextPlugin'

// Phase 6 — Rulers + guidelines
export { RulerPlugin } from './RulerPlugin'
export { GuidelinePlugin } from './GuidelinePlugin'

// Phase 7 — QR code, barcode, shapes
export { QRCodePlugin } from './QRCodePlugin'
export { BarcodePlugin } from './BarcodePlugin'
export { ShapePlugin } from './ShapePlugin'

// Phase 8 — Image editing
export { ImagePlugin } from './ImagePlugin'

// Phase 9 — Export/import
export { ExportPlugin } from './ExportPlugin'
export { ImportPlugin } from './ImportPlugin'

// Phase 10 — Watermark
export { WatermarkPlugin } from './WatermarkPlugin'
