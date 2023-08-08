# Teams SDK

A set of packages that make it easy to build bots for Microsoft Teams.

## Packages

- [AI](./packages/ai/)
- [Application Insights](./packages/applicationinsights/)
- [Azure](./packages/azure/)
- [Connector](./packages/connector/)
- [Core](./packages/core/)
- [Dialogs](./packages/dialogs/)
- [Schema](./packages/schema/)
- [Streaming](./packages/streaming/)
- [Testing](./packages/testing/)

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

## Run Scripts On All Packages

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
