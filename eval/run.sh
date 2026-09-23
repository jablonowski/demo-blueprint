#!/usr/bin/env bash
#
# Evaluation runner.
#
# One run is: S0.md + one arm overlay, handed to a fresh Claude Code session in an empty
# directory, with only the MCP servers that arm is entitled to.
#
#   ./run.sh preflight        check auth, flags and permissions before spending anything
#   ./run.sh D 1              one run of one arm
#   ./run.sh all              every arm, RUNS times each
#
# Nothing here is clever. Everything that could silently differ between runs is either
# pinned or recorded, because a difference nobody recorded reads as variance later.

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

MODEL="${MODEL:-claude-opus-5-5}"
RUNS="${RUNS:-5}"
ARMS=(A A-prime B C D)

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run directories live outside any tree containing a CLAUDE.md. --bare disables CLAUDE.md
# discovery anyway; this is the belt to that pair of braces, and it keeps a run from ever
# seeing the design system's own repository by accident.
RUNS_ROOT="${RUNS_ROOT:-/tmp/dsb-eval}"
RESULTS="$EVAL_DIR/results"

TOKENS_PKG="@jablonowski/dsb-tokens"
COMPONENTS_PKG="@jablonowski/dsb-components"
MCP_PKG="@jablonowski/dsb-tokens-mcp"

# ─── Helpers ─────────────────────────────────────────────────────────────────

die()  { printf '\n  %s\n\n' "$*" >&2; exit 1; }
note() { printf '  %s\n' "$*"; }

credential() {
  if [[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]]; then echo "CLAUDE_CODE_OAUTH_TOKEN"; return; fi
  if [[ -n "${ANTHROPIC_API_KEY:-}"       ]]; then echo "ANTHROPIC_API_KEY";       return; fi
  echo ""
}

# Figma is the visual truth for every arm, so every arm gets it.
# Arm D additionally gets the token resolver. Nothing else is ever loaded:
# --strict-mcp-config means the global ~/.claude/mcp.json cannot contribute.
mcp_config_for() {
  local arm="$1" out="$2"
  if [[ "$arm" == "D" ]]; then
    cat > "$out" <<JSON
{
  "mcpServers": {
    "figma": { "type": "stdio", "command": "npx", "args": ["-y", "figma-developer-mcp", "--stdio"] },
    "dsb-tokens": { "type": "stdio", "command": "npx", "args": ["-y", "$MCP_PKG"] }
  }
}
JSON
  else
    cat > "$out" <<JSON
{
  "mcpServers": {
    "figma": { "type": "stdio", "command": "npx", "args": ["-y", "figma-developer-mcp", "--stdio"] }
  }
}
JSON
  fi
}

# B, C and D start with the packages installed. A and A′ must not have them anywhere.
install_packages_for() {
  local arm="$1" dir="$2"
  case "$arm" in
    B|C|D)
      ( cd "$dir" && npm init -y >/dev/null 2>&1 \
        && npm install "$COMPONENTS_PKG" "$TOKENS_PKG" --silent ) \
        || die "npm install failed for arm $arm"
      ;;
  esac
}

# Arm C hands over llms.client.txt as text, so its cost is counted exactly rather than
# estimated. contracts.json is never handed to any arm — it is scorer input.
prompt_for() {
  local arm="$1" dir="$2"
  cat "$EVAL_DIR/S0.md"
  printf '\n\n---\n\n'
  cat "$EVAL_DIR/arms/$arm.md"
  if [[ "$arm" == "C" || "$arm" == "D" ]]; then
    local guide="$dir/node_modules/$COMPONENTS_PKG/llms.client.txt"
    [[ -f "$guide" ]] || die "arm $arm: llms.client.txt missing from the installed package"
    printf '\n\n---\n\n# Component guide (llms.client.txt, shipped in the package)\n\n'
    cat "$guide"
  fi
}

# Arm A is not arm A if the library is anywhere in its tree. Checked before the run, and
# again after, because the agent has a shell.
assert_isolation() {
  local arm="$1" dir="$2" when="$3"
  case "$arm" in
    A|A-prime)
      if find "$dir" -maxdepth 6 -name 'dsb-components' -o -maxdepth 6 -name 'dsb-tokens' 2>/dev/null | grep -q .; then
        die "arm $arm has the design system in its tree ($when). This run is void."
      fi
      ;;
  esac
}

# ─── Preflight ───────────────────────────────────────────────────────────────

preflight() {
  note "CLI:   $(claude --version 2>&1 | head -1)"

  local cred; cred="$(credential)"
  [[ -n "$cred" ]] || die "No credential in the environment.
  --bare does not read the keychain, so one of these must be set:

    export CLAUDE_CODE_OAUTH_TOKEN=\$(claude setup-token)   # subscription
    export ANTHROPIC_API_KEY=sk-ant-...                     # API billing

  If 'claude setup-token' is not in your version, use the API key."
  note "Auth:  $cred"

  for flag in --bare --strict-mcp-config --output-format --permission-mode --allowedTools; do
    claude --help 2>&1 | grep -q -- "$flag" || die "This CLI has no $flag. The runner assumes it."
  done
  note "Flags: all present"

  [[ -n "${FIGMA_API_KEY:-}" ]] || note "Warning: FIGMA_API_KEY is unset — the Figma server will fail to authenticate."

  local dir="$RUNS_ROOT/preflight"
  rm -rf "$dir"; mkdir -p "$dir"
  local cfg="$dir/mcp.json"; mcp_config_for A "$cfg"

  note "Smoke: one trivial run, checking that files get written and usage is reported"
  local out
  out="$(cd "$dir" && claude --bare \
    -p 'Run: npm init -y. Then write hello.txt containing the word ok. Do nothing else.' \
    --model "$MODEL" \
    --mcp-config "$cfg" --strict-mcp-config \
    --allowedTools "Read,Write,Edit,Bash" \
    --permission-mode dontAsk \
    --output-format json 2>&1)" || true

  printf '%s' "$out" > "$dir/result.json"

  local err; err="$(printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log(j.is_error?(j.result||"error"):"")}catch{console.log("unparseable output")}})')"
  [[ -z "$err" ]] || die "Smoke run failed: $err"

  [[ -f "$dir/hello.txt" ]]   || die "Smoke run wrote no hello.txt — --permission-mode dontAsk is too tight. Try:
    --permission-mode acceptEdits --allowedTools \"Read,Write,Edit,Bash(npm *)\""
  [[ -f "$dir/package.json" ]] || die "Smoke run could not run npm — same fix as above."

  printf '%s' "$out" | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      const j=JSON.parse(s), u=j.usage||{};
      console.log("  Usage: in="+(u.input_tokens??"?")+" out="+(u.output_tokens??"?")+
                  " cost="+(j.total_cost_usd??"?")+" turns="+(j.num_turns??"?"));
      if(!u.output_tokens) console.log("  Note: usage reports zero — the cost axis will not be measurable on this credential.");
    })'

  note "Preflight OK. Run directories: $RUNS_ROOT"
}

# ─── One run ─────────────────────────────────────────────────────────────────

one() {
  local arm="$1" n="$2"
  [[ -f "$EVAL_DIR/arms/$arm.md" ]] || die "No overlay for arm $arm"

  local dir="$RUNS_ROOT/$arm-$n"
  rm -rf "$dir"; mkdir -p "$dir" "$RESULTS"

  assert_isolation "$arm" "$dir" "before install"
  install_packages_for "$arm" "$dir"
  assert_isolation "$arm" "$dir" "after install"

  local cfg="$dir/.mcp-eval.json"; mcp_config_for "$arm" "$cfg"
  local prompt="$dir/.prompt.md"; prompt_for "$arm" "$dir" > "$prompt"

  note "$arm/$n — prompt $(wc -c < "$prompt") bytes, model $MODEL"

  local started; started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local out
  out="$(cd "$dir" && claude --bare \
    -p "$(cat "$prompt")" \
    --model "$MODEL" \
    --mcp-config "$cfg" --strict-mcp-config \
    --allowedTools "Read,Write,Edit,Bash" \
    --permission-mode dontAsk \
    --output-format json 2>&1)" || true

  assert_isolation "$arm" "$dir" "after the run"

  # Everything that could differ between runs, recorded beside the result.
  printf '%s' "$out" | OUT="$RESULTS/$arm-$n.json" \
    ARM="$arm" RUN="$n" RUN_MODEL="$MODEL" STARTED="$started" RUN_DIR="$dir" \
    OVERLAY="$EVAL_DIR/arms/$arm.md" S0="$EVAL_DIR/S0.md" PROMPT="$prompt" \
    CLI="$(claude --version 2>&1 | head -1)" \
    node -e '
      const fs = require("fs"), crypto = require("crypto");
      const sha = f => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 12);
      let raw = "";
      process.stdin.on("data", d => raw += d).on("end", () => {
        let result;
        try { result = JSON.parse(raw); } catch { result = { unparseable: raw.slice(0, 2000) }; }
        fs.writeFileSync(process.env.OUT, JSON.stringify({
          arm: process.env.ARM,
          run: Number(process.env.RUN),
          model: process.env.RUN_MODEL,
          cli: process.env.CLI,
          started: process.env.STARTED,
          overlaySha: sha(process.env.OVERLAY),
          s0Sha: sha(process.env.S0),
          promptBytes: fs.statSync(process.env.PROMPT).size,
          runDir: process.env.RUN_DIR,
          result
        }, null, 2) + "\n");
      });
    '

  note "$arm/$n — done, $RESULTS/$arm-$n.json"
}

# ─── Entry ───────────────────────────────────────────────────────────────────

case "${1:-}" in
  preflight) preflight ;;
  all)
    preflight
    for arm in "${ARMS[@]}"; do
      for n in $(seq 1 "$RUNS"); do one "$arm" "$n"; done
    done
    ;;
  "") die "Usage: ./run.sh preflight | ./run.sh <arm> <n> | ./run.sh all" ;;
  *) one "$1" "${2:-1}" ;;
esac
