/**
 * CMYK PDF post-processor — Feature 4.6
 *
 * Converts an RGB PDF to CMYK using Ghostscript CLI.
 * Ghostscript must be installed on the server and available in PATH
 * (gs on Linux/macOS, gswin64c on Windows).
 *
 * If Ghostscript is not installed or fails, this function returns the original
 * PDF bytes unchanged and logs a warning (graceful fallback).
 *
 * Typical Ghostscript command:
 *   gs -dBATCH -dNOPAUSE -sDEVICE=pdfwrite \
 *      -sColorConversionStrategy=CMYK \
 *      -dProcessColorModel=/DeviceCMYK \
 *      -sOutputFile=output.pdf input.pdf
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const execFileAsync = promisify(execFile)

// ── Ghostscript binary detection ──────────────────────────────────────────────

/** Returns the Ghostscript executable name for the current OS. */
function ghostscriptBin(): string {
  if (process.platform === 'win32') return 'gswin64c'
  return 'gs'
}

/**
 * Returns true if Ghostscript is available in PATH.
 * Result is cached after the first call.
 */
let _gsAvailable: boolean | null = null

export async function isGhostscriptAvailable(): Promise<boolean> {
  if (_gsAvailable !== null) return _gsAvailable
  try {
    const bin = ghostscriptBin()
    await execFileAsync(bin, ['--version'])
    _gsAvailable = true
  } catch {
    _gsAvailable = false
  }
  return _gsAvailable
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface CMYKOptions {
  /** ICC color profile path for CMYK output (optional, uses Ghostscript default if omitted). */
  iccProfile?: string
}

/**
 * Converts an RGB PDF to a CMYK PDF using Ghostscript.
 *
 * @param pdfBytes   Source PDF bytes (RGB)
 * @param options    Optional ICC profile path
 * @returns          CMYK PDF bytes, or original bytes if Ghostscript is unavailable
 */
export async function convertToCmyk(
  pdfBytes: Uint8Array,
  options: CMYKOptions = {}
): Promise<{ bytes: Uint8Array; converted: boolean }> {
  const gsAvailable = await isGhostscriptAvailable()

  if (!gsAvailable) {
    console.warn(
      '[CMYK] Ghostscript not found — returning RGB PDF unchanged. ' +
      'Install Ghostscript and ensure "gs" (Linux/macOS) or "gswin64c" (Windows) is in PATH.'
    )
    return { bytes: pdfBytes, converted: false }
  }

  const tmpId = randomUUID()
  const inputPath = join(tmpdir(), `sp_cmyk_in_${tmpId}.pdf`)
  const outputPath = join(tmpdir(), `sp_cmyk_out_${tmpId}.pdf`)

  try {
    await writeFile(inputPath, pdfBytes)

    const bin = ghostscriptBin()
    const args: string[] = [
      '-dBATCH',
      '-dNOPAUSE',
      '-dQUIET',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-sColorConversionStrategy=CMYK',
      '-dProcessColorModel=/DeviceCMYK',
      '-dOverrideICC=true',
    ]

    if (options.iccProfile) {
      args.push(`-sOutputICCProfile=${options.iccProfile}`)
    }

    args.push(`-sOutputFile=${outputPath}`, inputPath)

    await execFileAsync(bin, args, { timeout: 60_000 })

    const cmykBytes = await readFile(outputPath)
    return { bytes: new Uint8Array(cmykBytes), converted: true }
  } catch (err) {
    console.error('[CMYK] Ghostscript conversion failed, returning original PDF:', err)
    return { bytes: pdfBytes, converted: false }
  } finally {
    // Clean up temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}
