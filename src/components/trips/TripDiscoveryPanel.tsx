'use client';

import React from 'react';
import { Compass, Mountain, Waves, Sun, CalendarDays, Sparkles } from 'lucide-react';
import { TripDurationFilter, TripZoneFilter } from '@/lib/utils/tripDiscoveryUtils';

interface TripDiscoveryPanelProps {
  zoneFilter: TripZoneFilter;
  onZoneChange: (zone: TripZoneFilter) => void;
  durationFilter: TripDurationFilter;
  onDurationChange: (duration: TripDurationFilter) => void;
  hasQuickFilters: boolean;
  onResetFilters: () => void;
  resultsCount: number;
}

const ZONE_OPTIONS: Array<{
  key: Exclude<TripZoneFilter, 'all'>;
  label: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'nord', label: 'Nord Italia', caption: 'Alpi, laghi e passi', icon: Mountain },
  { key: 'centro', label: 'Centro Italia', caption: 'Borghi, colline e costa tirrenica', icon: Sun },
  { key: 'sud', label: 'Sud e Isole', caption: 'Mare, vulcani e strade panoramiche', icon: Waves },
];

const DURATION_OPTIONS: Array<{
  key: Exclude<TripDurationFilter, 'all'>;
  label: string;
  description: string;
}> = [
  { key: '1', label: 'Viaggi da 1 giorno', description: 'Perfetti per una fuga veloce' },
  { key: '2', label: 'Viaggi da 2 giorni', description: 'Weekend on the road' },
  { key: '3plus', label: 'Viaggi da 3+ giorni', description: 'Esperienze più complete' },
];

const TripDiscoveryPanel: React.FC<TripDiscoveryPanelProps> = ({
  zoneFilter,
  onZoneChange,
  durationFilter,
  onDurationChange,
  hasQuickFilters,
  onResetFilters,
  resultsCount,
}) => {
  const toggleZone = (zone: Exclude<TripZoneFilter, 'all'>) => {
    onZoneChange(zoneFilter === zone ? 'all' : zone);
  };

  const toggleDuration = (duration: Exclude<TripDurationFilter, 'all'>) => {
    onDurationChange(durationFilter === duration ? 'all' : duration);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-green-200/60 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-6 text-white shadow-2xl shadow-emerald-900/30 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 15%, rgba(16,185,129,0.35), transparent 35%), radial-gradient(circle at 85% 85%, rgba(132,204,22,0.28), transparent 30%)',
        }}
      />

      <div className="relative mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            Discover
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
            Seleziona la tua prossima rotta
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-emerald-50/85 md:text-base">
            Parti da due scelte semplici: <strong>zona d&apos;Italia</strong> e <strong>durata</strong>. RideAtlas ti mostra subito i viaggi coerenti.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/30 bg-black/20 px-4 py-2 text-sm text-emerald-50">
          <Compass className="h-4 w-4" />
          <span>{resultsCount} risultati in evidenza</span>
        </div>
      </div>

      <div className="relative grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
          <h3 className="mb-4 font-display text-xl font-semibold">Mappa zone Italia</h3>
          <div className="space-y-3">
            {ZONE_OPTIONS.map((zone) => {
              const Icon = zone.icon;
              const active = zoneFilter === zone.key;

              return (
                <button
                  key={zone.key}
                  type="button"
                  onClick={() => toggleZone(zone.key)}
                  className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                    active
                      ? 'border-lime-300 bg-lime-300/20 shadow-lg shadow-lime-900/40'
                      : 'border-emerald-100/20 bg-black/20 hover:border-lime-200/60 hover:bg-emerald-200/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 ${active ? 'text-lime-100' : 'text-emerald-100/80'}`} />
                    <div>
                      <p className={`font-semibold ${active ? 'text-lime-50' : 'text-white'}`}>{zone.label}</p>
                      <p className="mt-1 text-sm text-emerald-50/80">{zone.caption}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
          <h3 className="mb-4 font-display text-xl font-semibold">Macro tipologie viaggio</h3>
          <div className="space-y-3">
            {DURATION_OPTIONS.map((option) => {
              const active = durationFilter === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => toggleDuration(option.key)}
                  className={`w-full rounded-xl border p-4 text-left transition-all duration-300 ${
                    active
                      ? 'border-amber-200 bg-amber-300/20 shadow-lg shadow-amber-950/30'
                      : 'border-emerald-100/20 bg-black/20 hover:border-amber-100/70 hover:bg-amber-200/10'
                  }`}
                >
                  <p className={`font-semibold ${active ? 'text-amber-50' : 'text-white'}`}>{option.label}</p>
                  <p className="mt-1 text-sm text-emerald-50/80">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="relative mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-100/25 bg-black/20 p-4 text-sm text-emerald-50/90 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Clicca di nuovo su un filtro attivo per deselezionarlo.
        </p>
        {hasQuickFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-lg border border-emerald-100/40 bg-emerald-50/10 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-50/20"
          >
            Resetta filtri
          </button>
        )}
      </div>
    </div>
  );
};

export default TripDiscoveryPanel;
