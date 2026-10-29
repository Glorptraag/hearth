# Photo Read fixtures

Ten recorded cases covering the photo types the Read must handle. Used by
`src/lib/ai/__tests__/read-fixtures.test.ts`, which makes no live API calls.

Each case in `cases.json` has:

- `imagePath`: placeholder path under `fixtures/photos/images/`. The images do not exist yet; drop real photos there when available.
- `recordedRead`: the mock model output (the `photo_read` object). Re-record from a real Read when a real photo is added.
- `expectedArtefact`: the artefact the parsed Read must report.
- `expectedShelfMatch`: the `matchShelf` result against the fixture shelf (`SHELF_FIXTURE`), or `null`.
- `expectedRouteNote`: free-text note on the expected proposal route (strong / weak / none). Documentation only, not asserted.

Run: `npm test src/lib/ai/__tests__/read-fixtures.test.ts`
