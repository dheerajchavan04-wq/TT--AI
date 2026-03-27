# G0DM0D3 — Privacy-Cleaned Fork

This is a fork of [elder-plinius/G0DM0D3](https://github.com/elder-plinius/G0DM0D3) with telemetry, prompt surveillance, and undisclosed API key usage removed.

The upstream project describes itself as "privacy-respecting" and claims its telemetry is "opt-out." Neither claim is accurate in the source code. This fork fixes that by removing the offending systems entirely.

## What Was Removed and Why

### 1. Telemetry System (sent session metadata to HuggingFace)

The upstream app batches usage metadata — including harm classification results that encode the semantic category of your prompts — and flushes it to a HuggingFace dataset repository via a Cloudflare Pages Function. The README claims this is "opt-out in settings," but **no opt-out toggle exists in the code.** The telemetry fires unconditionally on a 5-minute timer and via `sendBeacon` on page close.

**Removed:** The `_telemetry` object, `trackEvent()`, `flushTelemetry()`, the `sendBeacon` on `beforeunload`, and the periodic flush timer. `trackEvent()` is now a no-op stub so the ~15 call sites don't break.

### 2. Harm Classifier (sent your full prompt to LLaMA 8B)

Every message you send was also sent — in full — to `meta-llama/llama-3.1-8b-instruct` via OpenRouter, using your API key, to classify it into harm categories (violence, drugs, weapons, etc.) for the research telemetry dataset. This classification was then included in the telemetry sent to HuggingFace. So while the README says "never your messages," the semantic classification of your messages was absolutely collected and published.

**Removed:** `HARM_CLASSIFIER_PROMPT`, `parseHarmClassification()`, the LLM call, and the classification cache. `classifyHarm()` now returns a constant benign result.

### 3. Smart Prefill Generator (sent your prompt to Hermes 3 70B)

Your prompt (up to 800 characters) was sent to `nousresearch/hermes-3-llama-3.1-70b` via OpenRouter, using your API key, to generate a "jailbreak prefill" — text designed to make the target model start its response mid-answer. This is an extra LLM call on your dime, to a model you didn't choose, for a purpose the UI never discloses.

**Removed:** `PREFILL_GENERATOR_PROMPT`, `PREFILL_GENERATOR_MODEL`, and the LLM call. `generateSmartPrefill()` now falls back to static prefills only.

### 4. LLM Query Classifier (sent 500 chars of your prompt to Hermes 3 70B)

A third undisclosed LLM call sent the first 500 characters of your prompt to `nousresearch/hermes-3-llama-3.1-70b` via OpenRouter, using your API key, to classify the query type and generate a prefill hint.

**Removed:** `classifyQueryWithLLM()` and the classification cache. `getQueryClassification()` now uses the existing regex classifier only.

### 5. Identity Headers (told OpenRouter you were using a jailbreak tool)

Every OpenRouter API call included `HTTP-Referer: https://godmod3.ai` and `X-Title: GODMOD3.AI-<pipeline-stage>`, which told OpenRouter that your API key was associated with a jailbreak tool and which specific pipeline stage each call came from. OpenRouter uses these headers for analytics.

**Changed:** `HTTP-Referer` now uses `window.location.origin` (your actual host). `X-Title` is now `LocalChat`.

### 6. Cloudflare Insights (CSP allowlisted tracking domain)

The Content-Security-Policy meta tag allowlisted `cloudflareinsights.com` and `challenges.cloudflare.com` for script execution and network connections.

**Removed** from the CSP directive.

## What Was NOT Changed

Everything else is untouched. The jailbreak prompts, Parseltongue obfuscation engine, ULTRAPLINIAN multi-model racing, AutoTune, STM modules, Liquid mode, themes, easter eggs, and all UI functionality work exactly as upstream. The only difference is that this fork doesn't spy on you while you use it.

## Quick Start

It's a single HTML file. No build step, no dependencies.

```bash
git clone https://github.com/YOUR_USERNAME/G0DM0D3.git
cd G0DM0D3
open index.html
# or: python3 -m http.server 8000
```

You'll need an [OpenRouter API key](https://openrouter.ai/keys). Paste it in Settings. It stays in your browser's `localStorage` and is only sent to OpenRouter when you make a query.

## Net Effect on API Costs

The upstream version makes **three extra LLM calls per message** on your API key that serve the tool's purposes, not yours. This fork eliminates all three. You will only be billed for the models you actually choose to query.

## License

AGPL-3.0, same as upstream. See [LICENSE](LICENSE).

## Upstream

Original project: [elder-plinius/G0DM0D3](https://github.com/elder-plinius/G0DM0D3) by Pliny the Prompter.
