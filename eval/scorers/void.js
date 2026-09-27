'use strict';

/**
 * Whether a run may be scored at all.
 *
 * This exists because `score.js` once reduced `C-1` — a run the API aborted with a 429 at
 * turn 22, half an application on disk — to `slots 10/13, checks 5/8, BROKEN`. That row is
 * indistinguishable from arm C doing badly. It is not arm C doing badly. It is no
 * observation, and no observation must never be allowed to look like a poor one.
 *
 * The same rule catches the other way a run can be silently not-the-run-you-think: a tool
 * the arm is defined by was denied. The first D pilot had its resolver denied by
 * `--allowedTools` and produced a perfectly plausible D row that was actually arm C.
 *
 * One explicit exception, carried in the run's own record rather than inferred here — see
 * `scoring.ignoreDenials`.
 */

function voidReason(harness) {
  if (!harness) return 'no harness record — the run was never completed by run.sh';

  const r = harness.result || {};

  // The same shape of exception as `ignoreDenials`, carried in the run's own record and
  // never inferred here. A 429 that arrives after the work is finished takes the agent's
  // closing message, not its output, and the scorers read code rather than messages.
  //
  // The rule is written down before the next one of these happens, not chosen case by
  // case: a run whose session ended in an API error may be scored only when, independently
  // of any scored metric, it builds, every route S0 names renders under the measurement
  // pass, and that pass completed. Anything short of all three is void.
  if (r.is_error === true && !(harness.scoring && harness.scoring.ignoreError)) {
    const status = r.api_error_status ? ` (HTTP ${r.api_error_status})` : '';
    const message = typeof r.result === 'string' ? r.result : r.terminal_reason || 'unknown';
    return `the run ended in an error${status}: ${message}`;
  }

  // S0 names the Figma frames as the visual truth for every arm. For eight runs nothing in
  // the harness noticed that they were unreachable, because preflight asserted that the
  // token was *present*. The channel is now a recording on disk, so it cannot go down
  // mid-round; what remains to check is that the run had a serviceable one.
  //
  // Note what is deliberately NOT voided: an arm that made zero calls. That is the agent's
  // choice and one of the more interesting things this experiment can observe. A scorer
  // that discarded it would be discarding a result for looking like a fault.
  if (harness.figma && harness.figma.ok === false) {
    return 'the cached Figma channel was not serviceable for this run — ' +
           'every arm treats the frames as the visual truth';
  }

  // Which denials matter, and the distinction is not "was a tool refused".
  //
  // An arm is defined by its overlay, and an overlay adds MCP servers — the Figma channel,
  // the token resolver. Read, Write, Edit and Bash are common ground that S0 gives every
  // arm. So a denied MCP tool is fatal: that arm did not have the thing it is the arm for.
  // A denied general tool is not automatically fatal, because the agent may simply have
  // asked for something the CLI refuses on principle.
  //
  // This rule exists because D-1 on Sonnet was voided over two `rm -rf` calls the agent
  // made to tidy up its own scratch directory at the end of a finished run. It had the
  // resolver throughout, wrote seventy files, built, and rendered clean. Voiding that is
  // the same mistake as scoring a half-run: a gate reporting on a property next to the one
  // it was meant to guard, this time by being too strict rather than too lax.
  const BASE_TOOLS = ['Read', 'Write', 'Edit', 'Bash'];
  const allDenied = [...new Set((r.permission_denials || []).map((d) => d.tool_name))];
  const denials = allDenied.filter((name) => !BASE_TOOLS.includes(name));

  // A denied base tool still has to clear the completeness bar, on evidence independent of
  // any scored metric — the same bar an API-aborted run has to clear.
  const deniedBase = allDenied.filter((name) => BASE_TOOLS.includes(name));
  if (deniedBase.length > 0 && denials.length === 0) {
    const ev = (harness.reconstructed && harness.reconstructed.evidence) || null;
    const complete = harness.completeness;
    if (complete && complete.ok === false) {
      return `${deniedBase.join(', ')} was denied and the application is incomplete: ${complete.why}`;
    }
  }

  if (denials.length > 0 && !(harness.scoring && harness.scoring.ignoreDenials)) {
    return `tools the arm is defined by were denied: ${denials.join(', ')}`;
  }

  return null;
}

module.exports = { voidReason };
