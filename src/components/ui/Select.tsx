import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import '@/components/ui/select.css'

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function Select({ value, onChange, options, placeholder, disabled = false, className, ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const selectedOption = useMemo(() => options.find((opt) => opt.value === value) ?? null, [options, value])

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const selectedIndex = options.findIndex((opt) => opt.value === value)
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, options, value])

  useEffect(() => {
    if (!open || highlightedIndex < 0) {
      return
    }
    const listNode = listRef.current
    if (!listNode) {
      return
    }
    const active = listNode.children.item(highlightedIndex) as HTMLElement | null
    active?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, open])

  function commit(valueToSelect: string) {
    onChange(valueToSelect)
    setOpen(false)
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((prev) => !prev)
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (!open) {
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) => Math.max(prev - 1, 0))
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        commit(options[highlightedIndex].value)
      }
    }
  }

  return (
    <div className={`nx-select ${open ? 'nx-select--open' : ''} ${className ?? ''}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="nx-select__trigger"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={`nx-select__value ${selectedOption ? '' : 'nx-select__value--placeholder'}`}>
          {selectedOption ? selectedOption.label : (placeholder ?? '')}
        </span>
        <ChevronDown size={16} strokeWidth={2} className="nx-select__chevron" />
      </button>
      {open ? (
        <ul className="nx-select__menu" role="listbox" tabIndex={-1} ref={listRef} onKeyDown={onListKeyDown}>
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isHighlighted = index === highlightedIndex
            return (
              <li key={option.value}>
                <button
                  type="button"
                  className={`nx-select__option${isSelected ? ' nx-select__option--selected' : ''}${isHighlighted ? ' nx-select__option--highlighted' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => commit(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected ? <Check size={14} strokeWidth={2} /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
