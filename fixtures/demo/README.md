# Demo family fixtures (W7.2)

Source data for `npm run seed:demo` (`scripts/seed-demo-family.ts`). The seed creates or resets one demo family (fixed id `00000000-0000-4000-8000-0000de100001`, Clerk id `demo_family_expo`) with two learners and six photo moments. Run command and safety flags are in the script header.

- `moments.json`: the family, learners and six moments. Each moment has a pre-baked `readOutput` (the `photo_read` shape from `src/lib/ai/read-schema.ts`), optional `workingFrom` (Shelf match), and confirmed `dloLinks`. `src/lib/demo/seed-plan.test.ts` fails if any Read is invalid or a `workingFrom` disagrees with `matchShelf`.
- `images/`: small synthetic placeholders (640x480 JPEG). They are NOT real photos.

## Swapping in the real photos (pivot plan section 3 gate)

1. Anonymised photos, no faces, six of them. Save over the files in `images/` with the same names (`moment-1-worksheet.jpg` ... `moment-6-baking.jpg`), or add new files and change each moment's `image`.
2. Re-record each `readOutput` from a real Read of the new photo and paste it into `moments.json`. Keep `printedText` honest: a visible header such as "Math-U-See Beta Lesson 12" is what drives `workingFrom`. If you change `printedText`, update `workingFrom` to match; the test enforces agreement.
3. Set `BLOB_READ_WRITE_TOKEN` in the environment and re-run the seed. Images upload to private Blob at `evidence/<familyId>/<moment>.jpg` (overwritten in place). Without the token the evidence rows only hold those paths and photos will not render.
4. `npx vitest run src/lib/demo` then re-run `npm run seed:demo -- --database-url <url> --confirm`.
