#!/usr/bin/env bash
# Start Ollama so the browser extension can call it.
#
# OLLAMA_ORIGINS="*" is REQUIRED: without it Ollama rejects requests coming from
# the chrome-extension:// origin with HTTP 403 Forbidden and "Summarize" fails.
# OLLAMA_HOST="0.0.0.0" binds to all interfaces (fine for local use).
set -euo pipefail

OLLAMA_HOST="0.0.0.0" OLLAMA_ORIGINS="*" ollama serve
