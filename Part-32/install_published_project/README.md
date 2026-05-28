# Install Published Project

Demo project that consumes the `onepercentutils-shyam` package published to TestPyPI.

## Setup

Activate the virtual environment (already created with `uv venv`):

```bash
source .venv/bin/activate
```

## Install the published package

From TestPyPI (live demo step):

```bash
uv pip install -i https://test.pypi.org/simple/ onepercentutils-shyam
```

> The `-i` flag points pip at TestPyPI's index instead of the real PyPI.

## Run

```bash
uv run python main.py
```
