'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Loader2 } from 'lucide-react'

interface SearchableSelectProps<T> {
  placeholder: string
  onSelect: (item: T | null) => void
  searchFn: (query: string) => Promise<T[]>
  renderOption: (item: T) => React.ReactNode
  renderSelected?: (item: T) => React.ReactNode
  value?: T | null
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
}

export default function SearchableSelect<T>({
  placeholder,
  onSelect,
  searchFn,
  renderOption,
  renderSelected,
  value,
  disabled = false,
  className = '',
  label,
  required = false
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchFn(query.trim())
        setResults(searchResults)
        setError(null)
      } catch {
        setError('Errore durante la ricerca')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, searchFn])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleSelectItem = (item: T) => {
    onSelect(item)
    setIsOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setResults([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Selected value display or search input */}
        {value && !isOpen ? (
          <div 
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500"
            onClick={() => {
              setIsOpen(true)
              inputRef.current?.focus()
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {renderSelected ? renderSelected(value) : renderOption(value)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  ×
                </button>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
            )}
          </div>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading && query.trim().length >= 2 && (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Ricerca in corso...
              </div>
            )}

            {error && (
              <div className="px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && query.trim().length < 2 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Digita almeno 2 caratteri per cercare...
              </div>
            )}

            {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nessun risultato trovato
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div>
                {results.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    {renderOption(item)}
                  </button>
                ))}
              </div>
            )}

            {value && (
              <div className="border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 text-sm"
                >
                  Cancella selezione
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}