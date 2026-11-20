# Rantau

Rantau helps people find job and training opportunities with structured location filters, durable search history, and direct application links.

## Development

Rantau requires Node.js 24 and Bun 1.4.

```sh
bun install
bun run dev
```

Run the complete validation suite before submitting changes:

```sh
bun run verify
```

## Data attribution

Location hierarchy data is provided by the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) through the [Country State City package](https://github.com/dr5hn/countrystatecity-npm). The database is available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
