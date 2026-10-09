# Campux college CSV importer

This imports a large AISHE-style CSV without manually converting thousands of rows or loading the entire file into memory.

## 1. Put files in these locations

```text
backend/
├── data/
│   └── raw-colleges.csv
├── scripts/
│   └── seedColleges.js
├── database/
│   └── db.js
└── models/
    └── College.model.js
```

Rename the downloaded CSV to `raw-colleges.csv` and place it in `backend/data/`.

The CSV must have these exact headers:
- `College Name`
- `State Name`
- `District Name`

It can also contain other columns; they are ignored.

## 2. Install the CSV parser

From `backend/`:

```bash
npm install csv-parser
```

## 3. Update the College schema

The source dataset does not provide a pincode. Do not invent one. Change `pincode` to:

```js
pincode: {
  type: String,
  trim: true,
  default: ""
}
```

If your schema's file path or exported model name differs, update the import at the top of `seedColleges.js`.

## 4. Run the importer

From `backend/`:

```bash
node scripts/seedColleges.js
```

The script:
- strips trailing AISHE IDs such as `(Id: C-39230)` from college names;
- uses District Name as `location.city` because the source has district, not city;
- generates `shortName` initials as a placeholder, not an official abbreviation;
- leaves `pincode`, logo, and website blank;
- sets `isVerified: false`;
- writes in batches of 500;
- uses upserts matching `name + location.city + location.state`, so rerunning it does not insert duplicates for matching records.

## Important notes

- Back up your database before importing.
- Review a small sample first if this is production data.
- Because the unique index is on name/city/state, existing duplicate records or concurrent imports can still cause duplicate-key errors.
- The source may be historical or incomplete; do not treat imported rows as currently verified colleges.
