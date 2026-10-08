# js-dbmanager

Database manager for JavaScript projects. It currently provides a PostgreSQL implementation: a thin wrapper around a [`pg`](https://www.npmjs.com/package/pg) pool with query helpers, transactions and a unique-constraint error check.

**Note:** This repository is archived and read-only.

Package `@ralvarezdev/js-dbmanager` (0.1.25, ES modules), depends on `pg ^8.13.1`.

## Installation

npm publication was not verified; installing from GitHub works regardless:

```bash
npm install github:ralvarezdev/js-dbmanager
```

## Usage

```js
import {
  PostgresDatabaseManager,
  PostgresIsUniqueConstraintError,
} from "@ralvarezdev/js-dbmanager";

const db = new PostgresDatabaseManager({
  host: "localhost",
  user: "user",
  password: "password",
  database: "mydb",
  port: 5432,       // default
  max: 10,          // default pool size
  logger: console,  // optional, must expose .info()
});

const res = await db.query({ text: "SELECT * FROM users WHERE id = $1", values: [1] });
const res2 = await db.rawQuery("SELECT * FROM users WHERE id = $1", 1);

// The callback receives a PostgresDatabaseManagerClient
await db.runTransaction(async (client) => {
  await client.rawQuery("INSERT INTO users(name) VALUES ($1)", "ana");
});

try {
  await db.rawQuery("INSERT INTO users(name) VALUES ($1)", "ana");
} catch (err) {
  const constraint = PostgresIsUniqueConstraintError(err); // constraint name, or false
}

await db.close(); // ends the pool
```

## API

- **`PostgresDatabaseManager`** — pool-backed manager. Options: `logger`, `user`, `password`, `host`, `database`, `port` (5432), `ssl`, `connectionTimeoutMillis` (0), `idleTimeoutMillis` (10000), `max` (10), `allowExitOnIdle` (false) and pool callbacks `onConnect`, `onAcquire`, `onError`, `onRelease`, `onRemove`. Methods: `query({text, values, name, rowMode, types})`, `rawQuery(text, ...values)`, `runTransaction(fn)` / `runTx(fn)`, `close()`. Each query acquires and releases a client automatically.
- **`PostgresDatabaseManagerClient`** — single-connection client built from a pool. Methods: `connect()`, `query`, `rawQuery`, `runTransaction` / `runTx` (BEGIN / COMMIT, ROLLBACK on error), `release()`.
- **`PostgresIsUniqueConstraintError(error)`** — `false` unless the Postgres error code is `23505`, otherwise the violated constraint name (or `'unknown'`).

## Project structure

```
index.js          public exports
postgres/         manager.js, client.js, errors.js, index.js
lib/helpers.js    RemoveNullsFromObject
```

There are no tests.

## License

The repository has a GNU General Public License v3.0 `LICENSE` file, but `package.json` declares `ISC`; the two disagree.
