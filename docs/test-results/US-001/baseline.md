# US-001 - Baseline pre-modifica

Setup: `.archetipo/environment.json` (prepare: `npm install --ignore-scripts` + ripristino `package-lock.json` + `prisma generate`).
Nota: `npm ci` fallisce per lockfile non allineato a package.json (preesistente, "Missing: fsevents@2.3.3 from lock file"); si usa `npm install` e si ripristina il lock.
Prepare: passed=true stable=true, report: .archetipo/environment/runs/verification-1706713505/report.json

| Check | Esito | Report |
|---|---|---|
| prisma-validate | passed | docs/test-results/US-001/verification-3903442909/report.json |
| typecheck | FAILED (preesistente): 986 errori in 69 file, tutti sotto src/tests (TS2345, TS2339, TS2353 ...). Nessun errore in src/app, src/lib, src/types. Elenco per file: tsc-baseline.txt | docs/test-results/US-001/verification-2038285624/report.json |
| lint | passed | docs/test-results/US-001/verification-1393339106/report.json |
| test | FAILED (preesistente): 3 suite / 5 test falliti, 138 suite passate (1905 test passati, 2 skipped). Suite: src/tests/unit/api/admin/users/manage.test.ts, role-change-email.test.ts, role-change-notifications.test.ts | docs/test-results/US-001/verification-3566707529/report.json |

Confine: nuovi fallimenti = qualsiasi differenza rispetto a questi insiemi.
