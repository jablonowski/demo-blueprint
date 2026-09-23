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

# Generated applications live in RUNS_ROOT, deliberately outside this repository: a run has
# Bash and Read, and eval/ is two directories above it. One `cat ../../SPEC.md` would hand
# the agent the component API table and the nine checks it is being scored on, and nothing
# in the results would show it happened.
#
# So the source is copied here afterwards instead, for the scorers and for review. Copies
# only — never the directory the agent works in.
ARCHIVE="$EVAL_DIR/runs"

# BARE=1 (default) isolates through the CLI: no hooks, no LSP, no plugin sync, no
# auto-memory, no keychain read, no CLAUDE.md discovery. It also means the CLI will not
# touch the keychain for credentials, so one of the credential variables must be set.
#
# BARE=0 falls back to the logged-in session. Isolation is then weaker and partly yours:
# run directories still sit outside any CLAUDE.md tree and --strict-mcp-config still bars
# the global MCP configuration, but hooks, skills and settings from ~/.claude are in play.
# Preflight prints what it finds there so the compromise is visible rather than assumed.
BARE="${BARE:-1}"

TOKENS_PKG="@jablonowski/dsb-tokens"
COMPONENTS_PKG="@jablonowski/dsb-components"
MCP_PKG="@jablonowski/dsb-tokens-mcp"

# ─── Helpers ─────────────────────────────────────────────────────────────────

die()  { printf '\n  %s\n\n' "$*" >&2; exit 1; }
note() { printf '  %s\n' "$*"; }

# A credential that is set but nonsense is worse than one that is missing: the missing one
# stops the run here, the nonsense one reaches the API and comes back as "Not logged in"
# after the smoke test has already started.
credential() {
  local name value
  if [[ "$BARE" != "1" ]]; then echo "keychain (BARE=0)"; return; fi
  for name in CLAUDE_CODE_OAUTH_TOKEN ANTHROPIC_API_KEY; do
    value="${!name:-}"
    [[ -n "$value" ]] || continue
    if [[ "$value" == "..." || "$value" == "sk-ant-..." || "$value" == changeme* || "$value" == XXX* ]]; then
      die "$name is set to the placeholder [$value]. Replace it with a real one:

    claude setup-token     # run it plainly; it is interactive, so do not wrap it in \$( )
    export $name='<paste the token>'"
    fi

    # A token is one opaque word. Anything with whitespace, an escape sequence or a
    # thousand characters in it is the output of an interactive command that was captured
    # with \$( ) — banner, instructions and all — rather than a credential.
    if [[ "$value" == *[$'\n\r\t ']* || "$value" == *$'\033'* ]]; then
      die "$name contains whitespace or terminal escape codes, so it is console output,
  not a token. 'claude setup-token' is interactive in this version:

    claude setup-token     # run it plainly, read the output, copy the token
    export $name='<paste it here, in single quotes>'

  Or skip the token entirely:  BARE=0 ./run.sh preflight"
    fi

    if (( ${#value} < 20 || ${#value} > 500 )); then
      die "$name is ${#value} characters long, which is not a credential.
  See 'claude setup-token', or run with BARE=0 to use the logged-in session."
    fi

    echo "$name"; return
  done
  echo ""
}

# FIGMA_API_KEY usually sits in .env, unexported. Every arm reads the Figma frames, because
# S0 names them as the visual truth for all of them.
load_env() {
  local env_file="$EVAL_DIR/../.env" value
  [[ -f "$env_file" ]] || return 0
  [[ -z "${FIGMA_API_KEY:-}" ]] || return 0
  value="$(grep -E '^FIGMA_(API_KEY|ACCESS_TOKEN)=' "$env_file" | head -1 | cut -d= -f2- | tr -d '\042\047 \t\r')"
  [[ -n "$value" ]] || return 0
  export FIGMA_API_KEY="$value"
  note "Figma: key read from .env"
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

# The flags every invocation shares. --bare is conditional; everything else is not.
claude_flags() {
  local cfg="$1"
  [[ "$BARE" == "1" ]] && printf '%s ' --bare
  printf '%s ' --model "$MODEL" --mcp-config "$cfg" --strict-mcp-config \
    --allowedTools "Read,Write,Edit,Bash" --permission-mode dontAsk --output-format json
  if [[ "$BARE" != "1" ]]; then
    # An empty settings file so a hook or a permission rule from ~/.claude cannot quietly
    # differ between the run you did on Monday and the one you did on Friday.
    printf '%s ' --settings "$EVAL_DIR/.empty-settings.json"
  fi
}

# ─── Preflight ───────────────────────────────────────────────────────────────

preflight() {
  note "CLI:   $(claude --version 2>&1 | head -1)"
  load_env

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
  note "Mode:  $([[ "$BARE" == 1 ]] && echo '--bare (isolation from the CLI)' || echo 'BARE=0 — logged-in session, weaker isolation')"

  if [[ "$BARE" != "1" ]]; then
    local stray
    stray="$(ls ~/.claude 2>/dev/null | grep -E '^(settings\.json|mcp\.json|skills|plugins|hooks|CLAUDE\.md)$' | tr '\n' ' ')"
    [[ -z "$stray" ]] || note "       ~/.claude contains: $stray — these are in play for every run"
  fi

  [[ -n "${FIGMA_API_KEY:-}" ]] || die "FIGMA_API_KEY is unset and not in .env. Every arm reads the
  Figma frames, so a run without it measures an agent working blind:

    export FIGMA_API_KEY=..."
  note "Figma: key present"

  local dir="$RUNS_ROOT/preflight"
  rm -rf "$dir"; mkdir -p "$dir"
  local cfg="$dir/mcp.json"; mcp_config_for A "$cfg"

  note "Smoke: one trivial run, checking that files get written and usage is reported"
  echo '{}' > "$EVAL_DIR/.empty-settings.json"
  local out
  # shellcheck disable=SC2046
  out="$(cd "$dir" && claude -p 'Run: npm init -y. Then write hello.txt containing the word ok. Do nothing else.' $(claude_flags "$cfg") 2>&1)" || true

  printf '%s' "$out" > "$dir/result.json"

  local err; err="$(printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log(j.is_error?(j.result||"error"):"")}catch{console.log("unparseable output")}})')"
  [[ -z "$err" ]] || die "Smoke run failed: $err"

  [[ -f "$dir/hello.txt" ]]   || die "Smoke run wrote no hello.txt — --permission-mode dontAsk is too tight. Try:
    --permission-mode acceptEdits --allowedTools \"Read,Write,Edit,Bash(npm *)\""
  [[ -f "$dir/package.json" ]] || die "Smoke run could not run npm — same fix as above."

  printf '%s' "$out" | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      const j=JSON.parse(s), u=j.usage||{};
      // input_tokens alone counts only what was neither cached nor being cached, which on a
      // long prompt is almost nothing. The number that means "context this run consumed" is
      // the sum.
      const inTotal = (u.input_tokens||0) + (u.cache_creation_input_tokens||0) + (u.cache_read_input_tokens||0);
      console.log("  Usage: in="+inTotal+" (fresh "+(u.input_tokens||0)+
                  ", cache-write "+(u.cache_creation_input_tokens||0)+
                  ", cache-read "+(u.cache_read_input_tokens||0)+")"+
                  " out="+(u.output_tokens??"?")+
                  " cost="+(j.total_cost_usd??"?")+" turns="+(j.num_turns??"?"));
      if(!u.output_tokens) console.log("  Note: usage reports zero — the cost axis will not be measurable on this credential.");
    })'

  note "Preflight OK. Run directories: $RUNS_ROOT"
}

# ─── One run ─────────────────────────────────────────────────────────────────

one() {
  local arm="$1" n="$2"
  load_env
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
  echo '{}' > "$EVAL_DIR/.empty-settings.json"
  local out
  # shellcheck disable=SC2046
  out="$(cd "$dir" && claude -p "$(cat "$prompt")" $(claude_flags "$cfg") 2>&1)" || true

  assert_isolation "$arm" "$dir" "after the run"

  # Everything that could differ between runs, recorded beside the result.
  printf '%s' "$out" | OUT="$RESULTS/$arm-$n.json" \
    ARM="$arm" RUN="$n" RUN_MODEL="$MODEL" STARTED="$started" RUN_DIR="$dir" \
    OVERLAY="$EVAL_DIR/arms/$arm.md" S0="$EVAL_DIR/S0.md" PROMPT="$prompt" \
    CLI="$(claude --version 2>&1 | head -1)" BARE="$BARE" \
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
          isolation: process.env.BARE === "1" ? "bare" : "session",
          started: process.env.STARTED,
          overlaySha: sha(process.env.OVERLAY),
          s0Sha: sha(process.env.S0),
          promptBytes: fs.statSync(process.env.PROMPT).size,
          runDir: process.env.RUN_DIR,
          // Derived here so every consumer of these files agrees on what "input" means.
          inputTokensTotal: (() => {
            const u = (result && result.usage) || {};
            return (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
          })(),
          outputTokens: ((result && result.usage) || {}).output_tokens || 0,
          result
        }, null, 2) + "\n");
      });
    '

  archive "$arm" "$n" "$dir"
  note "$arm/$n — done, $RESULTS/$arm-$n.json"
}

# Keep what the scorers read and what a human would review; leave the 300 MB of
# dependencies where they were installed.
archive() {
  local arm="$1" n="$2" dir="$3"
  local dest="$ARCHIVE/$arm-$n"
  rm -rf "$dest"; mkdir -p "$dest"

  local item
  for item in src angular.json package.json tsconfig.json tsconfig.app.json README.md; do
    [[ -e "$dir/$item" ]] && cp -R "$dir/$item" "$dest/"
  done
  # The assembled prompt, so a result can always be traced back to exactly what was asked.
  [[ -f "$dir/.prompt.md" ]] && cp "$dir/.prompt.md" "$dest/prompt.md"

  local files; files="$(find "$dest" -type f | wc -l | tr -d ' ')"
  note "$arm/$n — archived $files files to $ARCHIVE/$arm-$n"
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
