# Teams SDK

A set of packages that make it easy to build bots for Microsoft Teams.

## Packages

- [AI](./packages/ai/)

## Samples

- [Echo](./samples/echo/)

## Development

### Prerequisites

[Install Poetry](https://python-poetry.org/docs/)

```bash
$: pip install poetry
```

### Install Monorepo Dependencies

```bash
$: poetry install
```

## Run Scripts On All Packages/Samples

> The following scripts will run against all sub packages, if you need to run scripts against
a specific package instead you should run the script from that packages directory.

### Install Dependencies

```bash
$: poetry run install
```

### Build

```bash
$: poetry run build
```

### Test

```bash
$: poetry run test
```

### Lint

```bash
$: poetry run lint
```

## Format

```bash
$: poetry run fmt
```

## Clean

```bash
$: poetry run clean
```
