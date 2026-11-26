#!/usr/bin/env node
// Ralph driver: works through the milestones in .claude/ralph.config.json, one issue per
// `claude -p` session, then pushes, opens a PR and has a reviewer session comment on it.
//
//   node .claude/ralph-start.js              resume from the saved phase
//   node .claude/ralph-start.js --reset      start again from the first phase
//   node .claude/ralph-start.js --dry-run    print what would run; no git, claude or PR calls
//
// The loop lives here (not in a Stop hook) so each session ends normally and nothing nests.
// It never merges a PR.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
process.chdir(root);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const configFile = '.claude/ralph.config.json';
const stateFile = '.claude/ralph.iterations.json';
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const {
  phases,
  maxIterations = 10,
  maxTurns = 50,
  maxAttemptsPerIssue = 3,
  reviewModel = 'claude-opus-5-5',
  baseBranch = 'main',
} = config;

if (!Array.isArray(phases) || phases.length === 0) fail('No phases in ' + configFile);

let state = { count: 0, phaseIndex: 0 };
if (!args.has('--reset') && fs.existsSync(stateFile)) {
  state = { ...state, ...JSON.parse(fs.readFileSync(stateFile, 'utf8')) };
}
const save = () => {
  if (!dryRun) fs.writeFileSync(stateFile, JSON.stringify(state));
};

function fail(message) {
  console.error(`⛔ ${message}`);
  process.exit(1);
}

/** Runs a command without a shell (no quoting problems); returns { status, stdout }. */
function run(cmd, cmdArgs, { inherit = false } = {}) {
  const res = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (res.error) fail(`${cmd}: ${res.error.message}`);
  return {
    status: res.status,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
  };
}

function openIssues(milestone) {
  const res = run('gh', [
    'issue',
    'list',
    '--milestone',
    milestone,
    '--state',
    'open',
    '--limit',
    '100',
    '--json',
    'number,title',
  ]);
  if (res.status !== 0) fail(`gh issue list failed: ${res.stderr}`);
  return JSON.parse(res.stdout || '[]').sort((a, b) => a.number - b.number);
}

function checkoutBranch(branch) {
  if (dryRun) return console.log(`[dry-run] would check out ${branch}`);
  const exists = run('git', ['rev-parse', '--verify', '--quiet', branch]).status === 0;
  const res = run('git', exists ? ['checkout', branch] : ['checkout', '-b', branch]);
  if (res.status !== 0) fail(`Cannot check out ${branch}: ${res.stderr}`);
}

function claude(prompt, extra = []) {
  if (dryRun)
    return console.log(`[dry-run] claude -p "${prompt.slice(0, 80)}…" ${extra.join(' ')}`);
  return run('claude', ['-p', prompt, '--max-turns', String(maxTurns), ...extra], {
    inherit: true,
  });
}

function finishPhase(phase) {
  console.log(`✅ ${phase.milestone}: no open issues left. Pushing and opening the PR…`);
  if (dryRun) return console.log(`[dry-run] would push ${phase.branch}, open a PR and review it`);

  const push = run('git', ['push', '-u', 'origin', phase.branch]);
  if (push.status !== 0) fail(`git push failed: ${push.stderr}`);

  const existing = run('gh', [
    'pr',
    'list',
    '--head',
    phase.branch,
    '--state',
    'open',
    '--json',
    'url',
    '--jq',
    '.[0].url',
  ]).stdout;
  let url = existing;
  if (!url) {
    const body = [
      `Closes the open issues of the milestone "${phase.milestone}".`,
      '',
      '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
    ].join('\n');
    const pr = run('gh', [
      'pr',
      'create',
      '--base',
      baseBranch,
      '--head',
      phase.branch,
      '--title',
      `feat: ${phase.milestone}`,
      '--body',
      body,
    ]);
    if (pr.status !== 0) fail(`gh pr create failed: ${pr.stderr}`);
    url = pr.stdout.split('\n').pop();
  }
  console.log(`🔗 PR: ${url}`);

  console.log(`🔍 Review by ${reviewModel}…`);
  claude(
    `Review the pull request ${url}. Check architecture, security, performance and alignment ` +
      `with the PRD in docs/. Leave your findings as comments on the PR with the gh CLI. ` +
      `Do not merge the PR and do not change code.`,
    ['--model', reviewModel],
  );
}

while (state.phaseIndex < phases.length) {
  const phase = phases[state.phaseIndex];
  console.log(
    `\n🚀 Phase ${state.phaseIndex + 1}/${phases.length}: ${phase.milestone} → ${phase.branch}`,
  );
  checkoutBranch(phase.branch);

  const attempts = new Map(); // issue number -> sessions started
  for (;;) {
    const issues = openIssues(phase.milestone);
    if (issues.length === 0) break;

    const next = issues[0];
    const tries = (attempts.get(next.number) || 0) + 1;
    if (tries > maxAttemptsPerIssue) {
      fail(`Issue #${next.number} is still open after ${maxAttemptsPerIssue} sessions. Stopping.`);
    }
    if (state.count >= maxIterations) {
      save();
      fail(`Iteration limit (${maxIterations}) reached. Re-run to continue (the count resets).`);
    }

    attempts.set(next.number, tries);
    state.count++;
    save();
    console.log(
      `🔄 Iteration ${state.count}/${maxIterations} — #${next.number}: ${next.title} ` +
        `(${issues.length} open, attempt ${tries}/${maxAttemptsPerIssue})`,
    );

    const prompt = config.prompt
      .replace('{milestone}', phase.milestone)
      .replace('{branch}', phase.branch);
    claude(prompt);

    if (dryRun) {
      console.log('[dry-run] stopping after the first iteration of this phase');
      break;
    }
  }

  if (!dryRun || openIssues(phase.milestone).length === 0) finishPhase(phase);
  if (dryRun) {
    state.phaseIndex++; // in memory only: a dry run never saves
    state.count = 0;
    continue;
  }

  // Advance and save together, so a crash after this point never repeats the PR and review.
  state.phaseIndex++;
  state.count = 0;
  save();
}

if (!dryRun) {
  state = { count: 0, phaseIndex: 0 };
  save();
}
console.log('\n🎉 All phases are complete.');
