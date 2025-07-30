# Gatling JS - TypeScript Demo Project

Showcases a TypeScript NPM project using Gatling JS. More info at, for example, [writing-realistic-tests/#injection-profiles](https://docs.gatling.io/guides/optimize-scripts/writing-realistic-tests/#injection-profiles).

## Prerequisites

[Node.js](https://nodejs.org/en/download) v18 or later (LTS versions only) and npm v8 or later (included with Node.js).

Configure the password values of test users in `ci/load-tests/gatling/resources/credentials.csv`. If you'll be running the `bookshop` simulation then you should use the same local basic authentication user credentials as when accessing the locally 'hybrid'-mode started project. The file should contain `username,password` as header followed by entries for each of the test users:

```csv
username,password
...,...
```

## How to Use

To run the typeScript sample simulation use `npm i && npm run bookshop` or:

```shell
npm i # installs dependencies
npx gatling run --typescript --simulation bookshop # automatically downloads Gatling runtime, builds the project, and runs the bookshop simulation
```

The `bookshop` simulation requests, for each virtual user, `$metadata` of the admin and orders services. This is a test to check that caching metadata works fast.

The results of each ran Gatling simulation can be found under `ci/load-tests/gatling/target/gatling/**/index.html`.

## Helper Scripts

The `gatling` command-line tool has a built-in help function:

```shell
npx gatling --help # List all available commands
npx gatling run --help # List options for the "run" command (--help also works for all other available commands)
```

The following aliases exist in the `scripts` section of `package.json`:

```shell
npm run clean # Delete Gatling bundled code and generated reports
npm run format # Format code with prettier
npm run check # TypeScript type check but don't build or run
npm run build # Build project but don't run
npm run bookshop # Run the included bookshop simulation
```