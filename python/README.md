# <img src="../assets/icon.png" height="10%" width="10%" /> Teams SDK

A set of packages that make it easy to build bots for Microsoft Teams.

## Packages

- [AI](./packages/ai/)

## Samples

- [Echo](./samples/echo/)
- [List](./samples/list/)
- [Teams Chef Bot](./samples/04.ai.a.teamsChefBot/)

## Development

### Prerequisites

[Install Poetry](https://python-poetry.org/docs/)

```bash
$: pip install poetry
```

## Run Scripts On All Packages/Samples

> The following scripts will run against all sub packages, if you need to run scripts against
a specific package instead you should run the script from that packages directory.

### Install Dependencies

```bash
$: python scripts/install.py
```

### Build

```bash
$: python scripts/build.py
```

### Test

```bash
$: python scripts/test.py
```

### Lint

```bash
$: python scripts/lint.py
```

## Format

```bash
$: python scripts/fmt.py
```

## Clean

```bash
$: python scripts/clean.py
```
