# Teams Application Insights

Within the Bot Framework, BotBuilder-ApplicationInsights enables the Azure Application Insights service.

Application Insights is an extensible Application Performance Management (APM) service for developers on multiple platforms. Use it to monitor your live bot application. It includes powerful analytics tools to help you diagnose issues and to understand what users actually do with your bot.

## Install

```bash
$: pip install teams-applicationinsights
```

## Development

### Prerequisites

[Install Poetry](https://python-poetry.org/docs/)

```bash
$: pip install poetry
```

### Install Dependencies

```bash
$: poetry install
```

### Build

```bash
$: poetry build
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

### Install Local

```bash
$: pip install .
```

### Publish

```bash
$: poetry publish
```