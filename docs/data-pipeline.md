# Atlas data pipeline

The Atlas map consumes a generated `public/villages.json` dataset. The source of truth
lives in [`data/villages.yaml`](../data/villages.yaml), which is committed for review and
translation purposes.

During `npm run build` (including CI builds), the [`scripts/build-villages.mjs`](../scripts/build-villages.mjs)
script parses the YAML file, normalizes the minimal fields required by the Leaflet map, and
writes a stable, sorted JSON array to `public/villages.json`. The file is regenerated on
every build, so do not hand-edit the JSON output—edit the YAML source instead.

Developers can manually refresh the dataset at any time by running:

```bash
node scripts/build-villages.mjs
```

This ensures local `npm run dev` and Netlify previews both rely on the same generated
artifact.
