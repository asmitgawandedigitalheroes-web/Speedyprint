'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TemplateParameter } from '@/types'

interface ParameterSelectorProps {
  parameters: TemplateParameter[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}

export function ParameterSelector({
  parameters,
  values,
  onChange,
}: ParameterSelectorProps) {
  const sorted = [...parameters].sort(
    (a, b) => a.display_order - b.display_order
  )

  return (
    <div className="space-y-4">
      {sorted.map((param) => (
        <div key={param.id} className="space-y-2">
          <Label htmlFor={param.param_key}>
            {param.param_label}
            {param.is_required && (
              <span className="ml-1 text-brand-primary">*</span>
            )}
          </Label>

          {param.param_type === 'select' && (() => {
            // Support conditional options: {_depends_on: "key", "val1": [...], ...}
            const rawOptions = param.options
            let selectOptions: string[]
            if (
              rawOptions &&
              !Array.isArray(rawOptions) &&
              typeof rawOptions === 'object' &&
              '_depends_on' in (rawOptions as object)
            ) {
              const condOpts = rawOptions as Record<string, unknown>
              const depKey = condOpts['_depends_on'] as string
              const depVal = values[depKey] ?? ''
              selectOptions = (condOpts[depVal] as string[]) ?? (condOpts['_default'] as string[]) ?? []
            } else {
              selectOptions = rawOptions as string[]
            }
            return (
              <Select
                value={values[param.param_key] ?? ''}
                onValueChange={(val) => onChange(param.param_key, val)}
              >
                <SelectTrigger id={param.param_key} className="w-full">
                  <SelectValue placeholder={`Select ${param.param_label}`} />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          })()}

          {param.param_type === 'range' && (() => {
            const opts = param.options as unknown as {
              min?: number
              max?: number
              step?: number
            }[]
            const rangeOpts = opts[0] ?? { min: 0, max: 100, step: 1 }
            const currentValue = values[param.param_key] ?? String(rangeOpts.min ?? 0)
            return (
              <div className="flex items-center gap-4">
                <input
                  id={param.param_key}
                  type="range"
                  min={rangeOpts.min ?? 0}
                  max={rangeOpts.max ?? 100}
                  step={rangeOpts.step ?? 1}
                  value={currentValue}
                  onChange={(e) => onChange(param.param_key, e.target.value)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-brand-primary"
                />
                <span className="min-w-[3rem] text-right text-sm font-medium text-brand-text">
                  {currentValue}
                </span>
              </div>
            )
          })()}

          {param.param_type === 'number' && (() => {
            const opts = param.options as unknown as {
              min?: number
              max?: number
            }[]
            const numOpts = opts[0] ?? {}
            return (
              <Input
                id={param.param_key}
                type="number"
                min={numOpts.min}
                max={numOpts.max}
                value={values[param.param_key] ?? param.default_value ?? ''}
                onChange={(e) => onChange(param.param_key, e.target.value)}
                placeholder={`Enter ${param.param_label}`}
              />
            )
          })()}

          {param.param_type === 'text' && (
            <Input
              id={param.param_key}
              type="text"
              value={values[param.param_key] ?? param.default_value ?? ''}
              onChange={(e) => onChange(param.param_key, e.target.value)}
              placeholder={`Enter ${param.param_label}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
