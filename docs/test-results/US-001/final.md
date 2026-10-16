# US-001 - Gate finale

| Check | Esito | Confronto con baseline | Report |
|---|---|---|---|
| prisma-validate | passed | - | docs/test-results/US-001/verification-1709532458/report.json |
| typecheck | failed (preesistente) | 986 errori / 69 file, elenco per file identico alla baseline (nessun nuovo errore) | docs/test-results/US-001/verification-2595610329/report.json |
| lint | passed | - | docs/test-results/US-001/verification-1563499122/report.json |
| test | failed (preesistente) | 142 suite: 3 fallite (le stesse 3 admin/users della baseline), 5 test falliti (identici); 1917 passati (+12 nuovi) | docs/test-results/US-001/verification-1440885601/report.json |

- AC-1: test src/tests/unit/schemas/trip-vehicle.test.ts (dmmf) + prisma validate.
- AC-2: migration.sql contiene `ALTER TABLE "trips" ADD COLUMN "vehicle" "Vehicle" NOT NULL DEFAULT 'MOTO'`, nessuna operazione distruttiva.
- AC-3: test su POST/PUT /api/trips, GET /api/trips, GET /api/user/trips.
- `npm run build` non eseguito: richiede env di produzione/DB (`prisma generate && next build`).
- Assertioni esatte sul payload di create / select aggiornate meccanicamente con `vehicle` in create.test.ts, optional-fields.test.ts, user/trips.test.ts.
