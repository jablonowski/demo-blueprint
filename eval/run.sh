#!/usr/bin/env bash
#
# Evaluation runner.
#
# One run is: S0.md + one arm overlay, handed to a fresh Claude Code session in an empty
# directory, with only the MCP servers that arm is entitled to.
#
#   ./run.sh preflight        check auth, flags and permissions before spending anything
#   ./run.sh D 1              one run of one arm
#   ./run.sh round 1          run 1 of every arm, in one sitting
#   ./run.sh all              every arm, RUNS times each
#
# Nothing here is clever. Everything that could silently differ between runs is either
# pinned or recorded, because a difference nobody recorded reads as variance later.

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

MODEL="${MODEL:-claude-opus-5-5}"

# The model is a second factor, not a setting. Runs of the same arm on two models are two
# different conditions, so they are kept apart by path — otherwise the cheaper grid
# silently overwrites the expensive one and the only trace is a field inside the JSON.
MODEL_SLUG="$(printf '%s' "$MODEL" | sed 's/^claude-//; s/-\?20[0-9]\{6\}$//')"
RUNS="${RUNS:-5}"
# The grid is three arms, not five. A round of five does not fit inside one session window
# — measured three times — and a round split across windows is the confound the round design
# exists to remove. A, B and D are a cumulative ladder with nothing skipped: nothing, then
# the typed installable package, then the agent-facing layer on top of it. A-prime and C
# stay runnable on their own (`./run.sh C 1`) and are a separate, smaller study; see
# PROTOCOL.md for what dropping them costs.
ARMS=(A B D)

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run directories live outside any tree containing a CLAUDE.md. --bare disables CLAUDE.md
# discovery anyway; this is the belt to that pair of braces, and it keeps a run from ever
# seeing the design system's own repository by accident.
RUNS_ROOT="${RUNS_ROOT:-/tmp/dsb-eval}"
RESULTS="$EVAL_DIR/results/$MODEL_SLUG"

# Generated applications live in RUNS_ROOT, deliberately outside this repository: a run has
# Bash and Read, and eval/ is two directories above it. One `cat ../../eval/S0.md` plus the
# overlays would hand
# the agent the component API table and the nine checks it is being scored on, and nothing
# in the results would show it happened.
#
# So the source is copied here afterwards instead, for the scorers and for review. Copies
# only — never the directory the agent works in.
ARCHIVE="$EVAL_DIR/runs/$MODEL_SLUG"

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
# The frames S0 names as the visual truth. Checked live, not assumed, and checked for the
# node rather than the file: a token can read a file whose node has since been renamed away.
FIGMA_FILE="${FIGMA_FILE:-iJ92LuFOsPjO6avZ2anbwO}"
FIGMA_NODE="${FIGMA_NODE:-22-11104}"
SERVED_FIGMA="$EVAL_DIR/reference/figma/served.json"

figma_status() {
  # The channel is a recording on disk, not an endpoint. What can go wrong is that the
  # recording is absent or does not carry the nodes S0 names — so that is what is checked.
  # The live API is checked once, by scripts/capture-figma.js, at the moment of recording.
  node -e '
    const fs = require("fs");
    const served = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const want = ["22:11104", "22:11448", "22:11492"];
    const missing = want.filter((id) => !served.nodes[id] || !served.nodes[id].text);
    if (missing.length) { console.log("missing:" + missing.join(",")); process.exit(0); }
    for (const [id, n] of Object.entries(served.nodes)) {
      for (const forbidden of ["\u{1F9E9} Components", "Design Tokens (reference)"]) {
        if (n.text.includes(forbidden)) { console.log("leak:" + id); process.exit(0); }
      }
    }
    console.log("ok:" + served.capturedAt);
  ' "$SERVED_FIGMA" 2>/dev/null || echo "unreadable"
}

LOAD_ENV_ANNOUNCED="${LOAD_ENV_ANNOUNCED:-0}"

load_env() {
  local env_file="$EVAL_DIR/../.env" value
  [[ -f "$env_file" ]] || return 0
  value="$(grep -E '^FIGMA_(API_KEY|ACCESS_TOKEN)=' "$env_file" | head -1 | cut -d= -f2- | tr -d '\042\047 \t\r')"

  # No precedence, because precedence is how a stale export beats the recorded source in
  # silence. The old version returned early whenever FIGMA_API_KEY was already set, so a
  # token left over in the shell from another session would have run the whole grid and the
  # only symptom would have been a 403 that reads as expiry.
  local shell_key="${FIGMA_API_KEY:-${FIGMA_ACCESS_TOKEN:-}}"
  if [[ -n "$shell_key" && -n "$value" && "$shell_key" != "$value" ]]; then
    # Said, not enforced. A run reads the cached channel, not this credential, so refusing
    # to start over it would be a gate guarding a property the run does not depend on —
    # the same mistake as the old `key present` check, pointing the other way.
    # scripts/capture-figma.js keeps the hard stop, because recording is the one thing that
    # does depend on which token is used.
    if [[ "$LOAD_ENV_ANNOUNCED" == "0" ]]; then
      note "Figma: two tokens visible and they disagree — shell ${shell_key:0:9}…${shell_key: -4}"
      note "       vs .env ${value:0:9}…${value: -4}. Runs use the cache, so this is harmless"
      note "       here, but clear the shell before re-recording the channel."
    fi
  fi
  [[ -n "$value" ]] || return 0
  [[ -n "$value" ]] || return 0
  # Two names, because two consumers. figma-developer-mcp reads FIGMA_API_KEY; S0 tells the
  # agent the token is in FIGMA_ACCESS_TOKEN, and every arm's final message shows it trying
  # exactly that. Exporting only one of them means the spec promises a variable that is not
  # there, and the agent's fallback path fails for a reason that has nothing to do with the
  # token.
  export FIGMA_API_KEY="$value"
  export FIGMA_ACCESS_TOKEN="$value"
  # Not used by a run any more — only by scripts/capture-figma.js when the channel is
  # re-recorded. Said plainly, because a green line about a credential nothing reads is
  # exactly the kind of reassurance this harness has already been caught giving.
  if [[ "$LOAD_ENV_ANNOUNCED" == "0" ]]; then
    note "Figma: key ${value:0:9}…${value: -4} from .env (for re-recording only; runs use the cache)"
    LOAD_ENV_ANNOUNCED=1
  fi
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
    "figma": { "type": "stdio", "command": "node", "args": ["$EVAL_DIR/scripts/figma-cache-mcp.js"],
               "env": { "FIGMA_CACHE_LOG": "${FIGMA_CALL_LOG:-}" } },
    "dsb-tokens": { "type": "stdio", "command": "npx", "args": ["-y", "$MCP_PKG"] }
  }
}
JSON
  else
    cat > "$out" <<JSON
{
  "mcpServers": {
    "figma": { "type": "stdio", "command": "node", "args": ["$EVAL_DIR/scripts/figma-cache-mcp.js"],
               "env": { "FIGMA_CACHE_LOG": "${FIGMA_CALL_LOG:-}" } }
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

  # Arm B is "the packages, and nothing about them" — and that state does not exist,
  # because the published package ships llms.client.txt and its README points at it. The
  # B-1 pilot stayed clean only because the agent read the constraint in its overlay,
  # declined to open the file, and said so in its final message. A condition that depends
  # on the subject volunteering not to look is not a condition.
  #
  # So the file is removed from the installed tree, and its absence is asserted before and
  # after the run. Arm B is the package MINUS its agent-facing contract, which is what the
  # arm was always meant to model and what arms/B.md now says.
  if [[ "$arm" == "B" ]]; then
    rm -f "$dir/node_modules/@jablonowski/dsb-components/llms.client.txt"
  fi
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
    B)
      # The old version of this function only checked what the harness had ADDED to A and
      # A-prime. It never checked what an arm already HAD, which is how arm B ran for a
      # whole round with arm C's defining artifact sitting in node_modules.
      if find "$dir" -path '*dsb-components*' -name 'llms.client.txt' 2>/dev/null | grep -q .; then
        die "arm B has llms.client.txt in its tree ($when) — that is arm C. This run is void."
      fi
      ;;
  esac
}

# Which tools an arm may use.
#
# The pilot exposed this: --allowedTools "Read,Write,Edit,Bash" does not cover MCP tools, so
# every mcp__dsb-tokens__resolve_token call was denied and arm D ran as arm C with a server
# attached that it could not reach. The denials are in the result, but nothing about the
# generated application looks wrong, which is how a run can measure the wrong condition and
# still produce a clean score.
#
# Tools are named individually rather than by wildcard, so an arm cannot silently acquire a
# capability when a server adds one.
allowed_tools_for() {
  local arm="$1"
  local base="Read,Write,Edit,Bash"
  local figma="mcp__figma__get_figma_data,mcp__figma__download_figma_images"
  local resolver="mcp__dsb-tokens__resolve_token,mcp__dsb-tokens__explain_component_tokens"

  if [[ "$arm" == "D" ]]; then echo "$base,$figma,$resolver"; else echo "$base,$figma"; fi
}

# The flags every invocation shares. --bare is conditional; everything else is not.
claude_flags() {
  local cfg="$1" arm="${2:-A}"
  [[ "$BARE" == "1" ]] && printf '%s ' --bare
  printf '%s ' --model "$MODEL" --mcp-config "$cfg" --strict-mcp-config \
    --allowedTools "$(allowed_tools_for "$arm")" --permission-mode dontAsk --output-format json
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
  note "Model: $MODEL   →   results/$MODEL_SLUG/"
  note "Mode:  $([[ "$BARE" == 1 ]] && echo '--bare (isolation from the CLI)' || echo 'BARE=0 — logged-in session, weaker isolation')"

  if [[ "$BARE" != "1" ]]; then
    local stray
    stray="$(ls ~/.claude 2>/dev/null | grep -E '^(settings\.json|mcp\.json|skills|plugins|hooks|CLAUDE\.md)$' | tr '\n' ' ')"
    [[ -z "$stray" ]] || note "       ~/.claude contains: $stray — these are in play for every run"
  fi

  # No live token is needed to run. The Figma channel is a recording taken once by
  # scripts/capture-figma.js; the API is checked there, at the moment of recording, and
  # never again. This is the whole point: a round can no longer lose its visual truth
  # halfway because a quota emptied between arm A and arm B.
  local figma_state; figma_state="$(figma_status)"
  case "$figma_state" in
    ok:*)        note "Figma: cached channel, recorded ${figma_state#ok:}" ;;
    missing:*)   die "The cached Figma channel is missing nodes: ${figma_state#missing:}
  Record it with a machine that can reach api.figma.com:

    node scripts/capture-figma.js && node scripts/prune-figma-capture.js" ;;
    leak:*)      die "The cached Figma channel leaks a canvas arm A must not see (${figma_state#leak:}).
  Re-run: node scripts/prune-figma-capture.js" ;;
    *)           die "reference/figma/served.json is missing or unreadable. Record it with:

    node scripts/capture-figma.js && node scripts/prune-figma-capture.js" ;;
  esac

  local dir="$RUNS_ROOT/$MODEL_SLUG/preflight"
  rm -rf "$dir"; mkdir -p "$dir"
  local cfg="$dir/mcp.json"; mcp_config_for A "$cfg"

  note "Smoke: one trivial run, checking that files get written and usage is reported"
  echo '{}' > "$EVAL_DIR/.empty-settings.json"
  local out
  # shellcheck disable=SC2046
  out="$(cd "$dir" && claude -p 'Run: npm init -y. Then write hello.txt containing the word ok. Do nothing else.' $(claude_flags "$cfg" A) 2>&1)" || true

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

  local dir="$RUNS_ROOT/$MODEL_SLUG/$arm-$n"
  rm -rf "$dir"; mkdir -p "$dir" "$RESULTS"

  # Everything the run depends on is established before anything is installed or spent.
  # The first version of this declared FIGMA_CALL_LOG *after* the call that reads it, which
  # under `set -u` killed the round on its first arm. Cheap, but the same shape as the rest:
  # an order assumed rather than checked.
  #
  # The channel cannot go down mid-round any more, so the question stops being "was it
  # reachable" and becomes "did this arm use it, and for what" — the thing worth measuring
  # and the thing the probe never answered. The shim appends one JSON line per call here.
  local figma_state; figma_state="$(figma_status)"
  [[ "$figma_state" == ok:* ]] || die "$arm/$n — the cached Figma channel is not serviceable ($figma_state)"
  local FIGMA_CALL_LOG="$dir/figma-calls.jsonl"; : > "$FIGMA_CALL_LOG"

  assert_isolation "$arm" "$dir" "before install"
  install_packages_for "$arm" "$dir"
  assert_isolation "$arm" "$dir" "after install"

  local cfg="$dir/.mcp-eval.json"; FIGMA_CALL_LOG="$FIGMA_CALL_LOG" mcp_config_for "$arm" "$cfg"
  local prompt="$dir/.prompt.md"; prompt_for "$arm" "$dir" > "$prompt"

  note "$arm/$n — prompt $(wc -c < "$prompt") bytes, model $MODEL"

  local started; started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo '{}' > "$EVAL_DIR/.empty-settings.json"
  local out
  # shellcheck disable=SC2046
  out="$(cd "$dir" && claude -p "$(cat "$prompt")" $(claude_flags "$cfg" "$arm") 2>&1)" || true

  assert_isolation "$arm" "$dir" "after the run"

  local figma_calls figma_errors figma_nodes
  # Piped into wc rather than `grep -c ... || echo 0`: grep prints its zero AND exits 1 on
  # no match, so the fallback appended a second zero and the note read "figma: 0\n0 calls".
  figma_calls="$(awk 'NF' "$FIGMA_CALL_LOG" 2>/dev/null | wc -l | tr -d ' ')"
  figma_errors="$(grep -c '"ok":false' "$FIGMA_CALL_LOG" 2>/dev/null | tr -d ' ')"
  figma_nodes="$(node -e '
    const fs=require("fs"); const f=process.argv[1];
    if(!fs.existsSync(f)) { console.log(""); process.exit(0); }
    const ids=new Set();
    for (const line of fs.readFileSync(f,"utf8").split("\n").filter(Boolean)) {
      try { const j=JSON.parse(line); if(j.args&&j.args.nodeId) ids.add(j.args.nodeId); } catch {}
    }
    console.log([...ids].join(","));
  ' "$FIGMA_CALL_LOG" 2>/dev/null || echo "")"
  note "$arm/$n — figma: $figma_calls calls, $figma_errors errors${figma_nodes:+, nodes $figma_nodes}"

  # Everything that could differ between runs, recorded beside the result.
  printf '%s' "$out" | OUT="$RESULTS/$arm-$n.json" \
    ARM="$arm" RUN="$n" RUN_MODEL="$MODEL" STARTED="$started" RUN_DIR="$dir" \
    OVERLAY="$EVAL_DIR/arms/$arm.md" S0="$EVAL_DIR/S0.md" PROMPT="$prompt" \
    CLI="$(claude --version 2>&1 | head -1)" BARE="$BARE" \
    FIGMA_STATE="$figma_state" FIGMA_CALLS="$figma_calls" FIGMA_ERRORS="$figma_errors" \
    FIGMA_NODES="$figma_nodes" FIGMA_TARGET="$FIGMA_FILE" \
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
          // Every arm treats the Figma frames as the visual truth, so whether that channel
          // was open is part of what the run was, not a footnote. Scoring refuses a run
          // where it was not.
          figma: {
            channel: "cached",
            fileKey: process.env.FIGMA_TARGET,
            recordedAt: (process.env.FIGMA_STATE || "").replace(/^ok:/, "") || null,
            calls: Number(process.env.FIGMA_CALLS || 0),
            errors: Number(process.env.FIGMA_ERRORS || 0),
            nodes: (process.env.FIGMA_NODES || "").split(",").filter(Boolean),
            ok: (process.env.FIGMA_STATE || "").startsWith("ok:"),
          },
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

  local denied
  denied="$(printf '%s' "$out" | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      try {
        const j = JSON.parse(s);
        const names = (j.permission_denials || []).map(d => d.tool_name);
        console.log([...new Set(names)].join(", "));
      } catch { console.log(""); }
    })' 2>/dev/null)"
  if [[ -n "$denied" ]]; then
    note "$arm/$n — WARNING: tools were denied: $denied"
    note "         this run did not have what its arm is defined by. Treat it as void."
  fi

  # Build and accessibility run here, where node_modules and the build output are. Both
  # write into the archive, so scoring later needs nothing but the archived directory.
  measure "$arm" "$n" "$dir"
  archive "$arm" "$n" "$dir"
  note "$arm/$n — done, $RESULTS/$arm-$n.json"
}

# A build that fails is a failed run, not a run with zeroes, so this happens before
# anything is scored and its verdict travels with the archive.
# Where the agent actually put the application.
#
# The harness assumed the run directory. Arm A of round 1 ran `ng new app`, produced a
# complete, self-tested application in `app/`, and the harness reported `build: false` and
# archived four files — because it looked for angular.json in the wrong place. A run that
# succeeded was recorded as a run that failed.
#
# Worse than a one-off: the harness runs `npm init` and installs packages at the root for
# B, C and D, so their root already looks like a project and they build in place. Arm A
# gets an empty directory and is the only arm free to scaffold a subdirectory. The bug
# therefore fired on the control, intermittently, which is the shape that quietly biases a
# baseline instead of breaking it visibly.
project_root() {
  local dir="$1" found
  [[ -f "$dir/angular.json" ]] && { echo "$dir"; return; }
  found="$(find "$dir" -maxdepth 3 -name angular.json -not -path '*/node_modules/*' 2>/dev/null | head -1)"
  if [[ -n "$found" ]]; then dirname "$found"; else echo "$dir"; fi
}

measure() {
  local arm="$1" n="$2" dir="$3"
  local scorers="$EVAL_DIR/scorers"
  local root; root="$(project_root "$dir")"
  [[ "$root" == "$dir" ]] || note "$arm/$n — project is in ${root#$dir/}/, not the run root"

  node "$scorers/build.js" "$root" > "$dir/build.json" 2>/dev/null || true
  local built; built="$(node -p "require('$dir/build.json').ok" 2>/dev/null || echo false)"
  note "$arm/$n — build: $built"

  if [[ "$built" == "true" ]]; then
    A11Y_SHOTS_DIR="$dir/shots" node "$scorers/a11y.js" "$root" > "$dir/a11y.json" 2>/dev/null || true
    local total; total="$(node -p "const a=require('$dir/a11y.json'); a.available? a.total : a.reason" 2>/dev/null || echo '?')"
    note "$arm/$n — axe: $total"
  else
    echo '{"available":false,"reason":"the application does not build"}' > "$dir/a11y.json"
  fi
}

# Keep what the scorers read and what a human would review; leave the 300 MB of
# dependencies where they were installed.
archive() {
  local arm="$1" n="$2" dir="$3"
  local dest="$ARCHIVE/$arm-$n"
  rm -rf "$dest"; mkdir -p "$dest"

  local root; root="$(project_root "$dir")"
  local item
  # The application comes from wherever the agent built it; the harness's own records come
  # from the run directory.
  for item in src angular.json package.json tsconfig.json tsconfig.app.json README.md; do
    [[ -e "$root/$item" ]] && cp -R "$root/$item" "$dest/"
  done
  for item in build.json a11y.json figma-calls.jsonl shots; do
    [[ -e "$dir/$item" ]] && cp -R "$dir/$item" "$dest/"
  done
  # Where it was built is a fact about the run, not a detail to normalise away.
  printf '{"projectRoot":"%s"}\n' "$([[ "$root" == "$dir" ]] && echo "." || echo "${root#$dir/}")" \
    > "$dest/layout.json"
  # The assembled prompt, so a result can always be traced back to exactly what was asked.
  [[ -f "$dir/.prompt.md" ]] && cp "$dir/.prompt.md" "$dest/prompt.md"

  local files; files="$(find "$dest" -type f | wc -l | tr -d ' ')"
  note "$arm/$n — archived $files files to $ARCHIVE/$arm-$n"
}

# What has been run, and what each run is worth. Piecemeal running is fine — the runs are
# independent — but only if it stays obvious which cells are filled and which are void.
status() {
  printf '\n  model: %s\n' "$MODEL_SLUG"
  printf '  %-6s' ''
  for n in $(seq 1 "$RUNS"); do printf ' %-10s' "run $n"; done
  printf '\n'

  for arm in "${ARMS[@]}"; do
    printf '  %-6s' "$arm"
    for n in $(seq 1 "$RUNS"); do
      local f="$RESULTS/$arm-$n.json" cell="—"
      if [[ -f "$f" ]]; then
        cell="$(node -e '
          const j = require(process.argv[1]);
          const r = j.result || {};
          const denied = (r.permission_denials || []).length;
          if (r.is_error) process.stdout.write("error");
          else if (denied) process.stdout.write("VOID:" + denied);
          else {
            const build = require("fs").existsSync(j.runDir + "/build.json")
              ? require(j.runDir + "/build.json").ok : null;
            process.stdout.write(build === false ? "no-build" : "ok");
          }
        ' "$f" 2>/dev/null || echo '?')"
      fi
      printf ' %-10s' "$cell"
    done
    printf '\n'
  done

  local done_count; done_count="$(ls "$RESULTS"/*.json 2>/dev/null | grep -cv '\.score\.json$' || true)"
  local others
  others="$(ls -d "$EVAL_DIR"/results/*/ 2>/dev/null | xargs -n1 basename 2>/dev/null | grep -v "^$MODEL_SLUG$" | tr '\n' ' ')"
  [[ -z "$others" ]] || printf '\n  other models with recorded runs: %s\n' "$others"

  printf '\n  %s of %s runs recorded.  VOID means a tool the arm is defined by was denied.\n\n' \
    "${done_count:-0}" "$(( ${#ARMS[@]} * RUNS ))"
}

# ─── Entry ───────────────────────────────────────────────────────────────────

case "${1:-}" in
  preflight) preflight ;;
  status) status ;;
  import)
    # Bring a run produced outside this harness — GitHub Copilot in VS Code, Cursor, a human
    # — through the same measurement and the same archive layout, so it is scored by the
    # identical code rather than by eye.
    #
    #   MODEL=copilot-gpt-5 ./run.sh import B 1 ~/copilot-eval/B-1
    #
    # It measures and archives only. It cannot record cost or turns, because those tools do
    # not report them; the row will carry the metrics and an empty cost, which is honest.
    # A second harness is a second study, never a fifth arm — see PROTOCOL.md.
    [[ $# -eq 4 ]] || die "Usage: MODEL=<label> ./run.sh import <arm> <n> <dir>"
    import_dir="${4/#\~/$HOME}"
    [[ -d "$import_dir" ]] || die "No directory at $import_dir"
    [[ "$MODEL_SLUG" != "opus-5-5" ]] || die "Set MODEL to something naming the other harness,
  e.g. MODEL=copilot-gpt-5 — otherwise this would land in the Claude Code grid."
    mkdir -p "$RESULTS"
    note "$2/$3 — importing $import_dir as $MODEL_SLUG"
    measure "$2" "$3" "$import_dir"
    archive "$2" "$3" "$import_dir"
    node -e '"'"'
      const fs=require("fs"), p=process.argv[1];
      fs.writeFileSync(p, JSON.stringify({
        arm: process.argv[2], run: Number(process.argv[3]), model: process.argv[4],
        harness: "external — imported, not generated by run.sh",
        importedAt: new Date().toISOString().slice(0,19)+"Z",
        sourceDir: process.argv[5],
        s0Sha: process.argv[6],
        figma: { channel: "cached", ok: true, calls: null,
                 note: "served by scripts/figma-cache-mcp.js if the external client was configured with it" },
        result: { is_error: false, permission_denials: [],
                  num_turns: null, total_cost_usd: null,
                  note: "this harness does not report usage" },
      }, null, 2)+"\n");
    '"'"' "$RESULTS/$2-$3.json" "$2" "$3" "$MODEL" "$import_dir" \
       "$(shasum -a 256 "$EVAL_DIR/S0.md" | cut -c1-12)"
    note "$2/$3 — done, $RESULTS/$2-$3.json"
    ;;
  serve)
    # Run an archived application. The archive carries source and configs but no
    # node_modules and no build output, so the first serve of a run installs and the rest
    # are instant.
    [[ $# -eq 3 ]] || die "Usage: ./run.sh serve <arm> <n>"
    serve_dir="$ARCHIVE/$2-$3"
    [[ -d "$serve_dir" ]] || die "No archived run at $serve_dir"
    [[ -f "$serve_dir/angular.json" ]] || die "$serve_dir has no angular.json — that run built nothing."
    [[ -d "$serve_dir/node_modules" ]] || ( cd "$serve_dir" && note "installing…" && npm install --silent )
    note "$2/$3 — serving $serve_dir"
    ( cd "$serve_dir" && npx --yes @angular/cli@19 serve --open )
    ;;
  shots)
    # Where the screenshots for a run are, and whether it has any.
    [[ $# -eq 3 ]] || die "Usage: ./run.sh shots <arm> <n>"
    shots_dir="$ARCHIVE/$2-$3/shots"
    [[ -d "$shots_dir" ]] || die "No screenshots for $2-$3. Capture them without regenerating:

    ./run.sh remeasure $2 $3"
    ls -1 "$shots_dir"
    note "open them with: open $shots_dir"
    ;;
  remeasure)
    # Re-run measurement and archiving over a run directory that is still on disk, without
    # regenerating anything. Exists because a harness bug can throw away a good run, and
    # paying an agent twice for the same output is not a fix.
    [[ $# -eq 3 ]] || die "Usage: ./run.sh remeasure <arm> <n>"
    remeasure_dir="$RUNS_ROOT/$MODEL_SLUG/$2-$3"
    [[ -d "$remeasure_dir" ]] || die "Nothing at $remeasure_dir — the run directory is gone."
    note "$2/$3 — remeasuring $remeasure_dir"
    measure "$2" "$3" "$remeasure_dir"
    archive "$2" "$3" "$remeasure_dir"
    ;;
  round)
    # One round is run <n> of every arm, back to back.
    #
    # This is the ordering the between-arm comparison actually wants. Running a whole arm
    # at a time makes the arm and the day the same variable: if A goes on Tuesday and D on
    # Friday, and the served model changes on Wednesday, nothing in the results can tell
    # the two apart. A round puts all five arms inside one sitting, so whatever drifts
    # drifts across all of them equally, and five rounds give five independent estimates
    # of the differences rather than five estimates of arm A.
    #
    # The cost is that runs within an arm are then spread over days. That is the cheaper
    # confound to carry: within-arm spread shows up as variance, which the table reports,
    # while between-arm spread shows up as effect, which it does not.
    [[ $# -eq 2 ]] || die "Usage: ./run.sh round <n>   (which run, 1..$RUNS)"
    preflight
    printf '\n  round %s — %s arms\n\n' "$2" "${#ARMS[@]}"
    # One arm falling over must not discard the sitting. A run that dies in setup is a
    # recorded failure of that arm; the other four are still four arms measured under the
    # same conditions, which is the whole reason for running a round. `if !` suspends
    # errexit for the call, so `one` returns rather than taking the shell with it.
    # A string rather than an array: macOS still ships bash 3.2, where an empty array read
    # under `set -u` is an unbound variable. Nothing here needs an array.
    round_failed=""
    round_failed_count=0
    for arm in "${ARMS[@]}"; do
      # A subshell, because `one` reports fatal conditions with `die`, and `die` exits.
      # Under `if !` errexit is suspended but an exit is still an exit: the first arm that
      # died would have taken the round with it, which is exactly what this loop exists to
      # prevent. Proven by running the loop against an arm rigged to fail.
      if ! ( one "$arm" "$2" ); then
        round_failed="${round_failed:+$round_failed }$arm"
        round_failed_count=$(( round_failed_count + 1 ))
        note "$arm/$2 — FAILED before completing. Round continues."
      fi
    done
    if [[ $round_failed_count -gt 0 ]]; then
      printf '\n  round %s finished with %s arm(s) failed: %s\n' \
        "$2" "$round_failed_count" "$round_failed"
      printf '  rerun those on their own before scoring: ./run.sh <arm> %s\n\n' "$2"
      exit 1
    fi
    printf '\n  round %s complete — all %s arms.\n\n' "$2" "${#ARMS[@]}"
    ;;
  all)
    preflight
    for arm in "${ARMS[@]}"; do
      for n in $(seq 1 "$RUNS"); do one "$arm" "$n"; done
    done
    ;;
  "") die "Usage:
    ./run.sh preflight      check credentials, flags and permissions
    ./run.sh status         what has been run so far
    ./run.sh remeasure <arm> <n>   re-score a run still on disk, without regenerating it
    ./run.sh import <arm> <n> <dir>  score a run made by another agent (set MODEL)
    ./run.sh serve <arm> <n>       install and serve an archived application
    ./run.sh shots <arm> <n>       list the screenshots captured for a run
    ./run.sh round <n>      run <n> of every arm, in one sitting
    ./run.sh <arm> <n>      run number <n> of one arm, on its own
    ./run.sh <arm>          all $RUNS runs of one arm
    ./run.sh all            every arm, $RUNS runs each

  Arms: ${ARMS[*]}

  The second argument is which run, not how many.

  Prefer rounds. Comparing arms across days compares the days as well, and a round keeps
  all five arms inside one sitting so that whatever drifts drifts across all of them." ;;
  *)
    if [[ $# -eq 1 ]]; then
      # A whole arm in one sitting: the runs of an arm should share their conditions.
      printf '\n  %s — %s runs\n\n' "$1" "$RUNS"
      for n in $(seq 1 "$RUNS"); do one "$1" "$n"; done
    else
      one "$1" "$2"
    fi
    ;;
esac

# Explicit, because a stray line after the dispatcher once ran as a command and printed
# `argument: command not found` after a completed round. Anything below this is dead by
# construction rather than by inspection.
exit 0
