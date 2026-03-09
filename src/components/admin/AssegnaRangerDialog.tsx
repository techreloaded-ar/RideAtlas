'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { UserPlus, Search } from 'lucide-react'
import Image from 'next/image'

interface RangerItem {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
}

interface AssegnaRangerDialogProps {
  viaggio: { id: string; title: string; user: { id: string; name: string | null; email: string } } | null
  isOpen: boolean
  onClose: () => void
  onAssegnato: () => void
}

export default function AssegnaRangerDialog({ viaggio, isOpen, onClose, onAssegnato }: AssegnaRangerDialogProps) {
  const [listaRangers, setListaRangers] = useState<RangerItem[]>([])
  const [caricamentoRangers, setCaricamentoRangers] = useState(false)
  const [erroreCaricamento, setErroreCaricamento] = useState('')
  const [testoRicerca, setTestoRicerca] = useState('')
  const [rangerSelezionatoId, setRangerSelezionatoId] = useState<string | null>(null)
  const [assegnamentoInCorso, setAssegnamentoInCorso] = useState(false)
  const [erroreAssegnamento, setErroreAssegnamento] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setListaRangers([])
      setTestoRicerca('')
      setRangerSelezionatoId(null)
      setErroreCaricamento('')
      setErroreAssegnamento('')
      return
    }

    const controller = new AbortController()

    const caricaRangers = async () => {
      try {
        setCaricamentoRangers(true)
        setErroreCaricamento('')

        const response = await fetch('/api/admin/rangers', { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei rangers')
        }

        const data = await response.json()
        setListaRangers(data.rangers)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setErroreCaricamento(err instanceof Error ? err.message : 'Errore sconosciuto')
      } finally {
        if (!controller.signal.aborted) {
          setCaricamentoRangers(false)
        }
      }
    }

    caricaRangers()

    return () => controller.abort()
  }, [isOpen])

  const rangersFiltrati = useMemo(() => {
    if (!testoRicerca.trim()) return listaRangers

    const ricercaMinuscola = testoRicerca.toLowerCase()
    return listaRangers.filter(
      (ranger) =>
        (ranger.name?.toLowerCase().includes(ricercaMinuscola)) ||
        ranger.email.toLowerCase().includes(ricercaMinuscola)
    )
  }, [listaRangers, testoRicerca])

  const rangerAttualeId = viaggio?.user.id ?? null
  const isConfermaDisabilitata =
    !rangerSelezionatoId ||
    rangerSelezionatoId === rangerAttualeId ||
    assegnamentoInCorso

  const handleConfermaAssegnazione = async () => {
    if (!viaggio || !rangerSelezionatoId) return

    try {
      setAssegnamentoInCorso(true)
      setErroreAssegnamento('')

      const response = await fetch(`/api/admin/trips/${viaggio.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rangerId: rangerSelezionatoId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'assegnazione del ranger')
      }

      onAssegnato()
    } catch (err) {
      setErroreAssegnamento(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setAssegnamentoInCorso(false)
    }
  }

  const getInizialiRanger = (name: string | null, email: string): string => {
    if (name) {
      const parti = name.split(' ')
      return parti.length >= 2
        ? (parti[0][0] + parti[1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  if (!isOpen || !viaggio) return null

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assegna-ranger-titolo"
        className="relative top-20 mx-auto p-5 border w-[480px] shadow-lg rounded-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-indigo-100 rounded-full">
            <UserPlus className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="mt-5 text-center">
            <h3 id="assegna-ranger-titolo" className="text-lg leading-6 font-medium text-gray-900">
              Assegna Ranger
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Seleziona un ranger per il viaggio <strong>&ldquo;{viaggio.title}&rdquo;</strong>
            </p>
          </div>

          {/* Corpo del modale */}
          <div className="mt-4 px-2">
            {/* Campo di ricerca */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={testoRicerca}
                onChange={(e) => setTestoRicerca(e.target.value)}
                placeholder="Cerca per nome o email..."
                aria-label="Cerca ranger per nome o email"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Stato di caricamento */}
            {caricamentoRangers && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-500">Caricamento rangers...</span>
              </div>
            )}

            {/* Errore caricamento */}
            {erroreCaricamento && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                <p className="text-sm text-red-700">{erroreCaricamento}</p>
              </div>
            )}

            {/* Lista rangers */}
            {!caricamentoRangers && !erroreCaricamento && (
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                {rangersFiltrati.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    Nessun ranger trovato
                  </div>
                ) : (
                  rangersFiltrati.map((ranger) => {
                    const isAttuale = ranger.id === rangerAttualeId
                    const isSelezionato = ranger.id === rangerSelezionatoId

                    return (
                      <button
                        key={ranger.id}
                        type="button"
                        onClick={() => setRangerSelezionatoId(ranger.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          isSelezionato
                            ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Avatar / Iniziali */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {ranger.image ? (
                            <Image
                              src={ranger.image}
                              alt=""
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-600">
                              {getInizialiRanger(ranger.name, ranger.email)}
                            </span>
                          )}
                        </div>

                        {/* Info ranger */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {ranger.name || 'Nome non specificato'}
                            </span>
                            {isAttuale && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                (Attuale)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{ranger.email}</div>
                        </div>

                        {/* Radio indicator */}
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
                          isSelezionato
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        } flex items-center justify-center`}>
                          {isSelezionato && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {/* Errore assegnamento */}
            {erroreAssegnamento && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                <p className="text-sm text-red-700">{erroreAssegnamento}</p>
              </div>
            )}
          </div>

          {/* Pulsanti azione */}
          <div className="items-center px-4 py-3 mt-2">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={handleConfermaAssegnazione}
                disabled={isConfermaDisabilitata}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assegnamentoInCorso ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Assegnando...
                  </div>
                ) : (
                  'Conferma Assegnazione'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
