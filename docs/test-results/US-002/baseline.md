# US-002 - Baseline pre-modifica

Prepare: passed=true stable=true reused (report: .archetipo/environment/runs/verification-3811476745/report.json)

| Check | Esito | Report |
|---|---|---|
| test | FAILED (preesistente): 3 suite / 5 test falliti (src/tests/unit/api/admin/users/manage.test.ts, role-change-email.test.ts, role-change-notifications.test.ts); 139 suite passate, 1917 test passati, 2 skipped | docs/test-results/US-002/verification-1748229200/report.json |
| typecheck | FAILED (preesistente): 995 righe `error TS`, tutte sotto src/tests; 0 errori fuori da src/tests. Nei file di test che il piano NON modifica per evitare di degradarli: EditTripForm.test.tsx (7), TripFormFields.test.tsx (4), trip-submission.test.ts (9) | docs/test-results/US-002/verification-134440996/report.json |
| lint, prisma-validate | passati in baseline US-001 (nessuna modifica a src non-test o schema da allora) | docs/test-results/US-001/ |
