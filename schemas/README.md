# Local Schemas

When the app runs through the Vite dev server, edits to the active diagram are
autosaved here as a local diagram package:

```text
schemas/<diagram-name>/
  schema.dbml
  diagram.chartdb.json
```

- `schema.dbml`: the generated standard DBML schema for local review.
- `diagram.chartdb.json`: a full ChartDB snapshot that restores layout, colors,
  notes, custom types, and other metadata through File -> Import diagram.

Both files are generated from the same in-memory diagram after the debounce. If
you hand-edit `schema.dbml` while the app is open, the next diagram edit can
overwrite it. Import `diagram.chartdb.json` into ChartDB first, then edit the
diagram.

Generated schema packages are ignored by git because they may contain private
database structure. If a schema is needed for a test or example, create a small
synthetic fixture with fake table and column names instead of committing a local
autosave package.

In local development, these packages are a cross-browser source of truth. The
Open diagram dialog lists `Local schemas` first from this directory, then any
diagrams saved only in the current browser. Opening a local package imports
`diagram.chartdb.json` into the current browser profile; subsequent edits
autosave back to the package path derived from the diagram name. The editor also
shows a small copyable package path such as `schemas/sample_schema/` near
the diagram name.

Older local runs may have written flat files such as `<diagram-name>.dbml` and
`<diagram-name>.chartdb.json` directly in this directory. The autosave endpoint
does not delete or migrate those files automatically.
