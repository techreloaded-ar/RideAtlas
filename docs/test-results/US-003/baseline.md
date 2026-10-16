# US-003 - Baseline pre-modifica

Prepare: passed=true stable=true reused (report: .archetipo/environment/runs/verification-3253838212/report.json)

| Check | Esito | Report |
|---|---|---|
| test | FAILED (preesistente): 3 suite / 5 test falliti (src/tests/unit/api/admin/users/manage.test.ts, role-change-email.test.ts, role-change-notifications.test.ts); 144 suite passate, 1942 test passati, 2 skipped | docs/test-results/US-003/verification-3173018306/report.json |
| typecheck | FAILED (preesistente): 995 righe `error TS`, tutte sotto src/tests; 0 errori fuori da src/tests. File di test con diagnostica preesistente che il piano NON modifica: src/tests/integration/TripsPageClient.test.tsx (13), src/tests/unit/components/trips/TripGrid.test.tsx (10), src/tests/unit/api/trips/[id]/gpx.test.ts (16) | docs/test-results/US-003/verification-2445146770/report.json |
| lint | passed (riuso) | docs/test-results/US-003/verification-982696478/report.json (originale: docs/test-results/US-001/verification-1563499122/report.json) |

Confine: nuovi fallimenti = qualsiasi differenza rispetto a questi insiemi.
