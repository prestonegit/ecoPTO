// Pure merge rules, kept free of backend imports so they can be tested on their own.

// Fields that CI writes back after this composer saves (push-newsletter.mjs resets status,
// stamps lastTestSentAt, records the broadcast id).
export const BOT_KEYS = new Set(['status', 'lastTestSentAt', 'lastTestHash', 'resendBroadcastId', 'confirmSend', 'lastError', 'lastErrorAt']);

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function changedKeys(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  return [...keys].filter((k) => !same(a?.[k], b?.[k]));
}

// A three-way merge at the field level, against the version this editor last loaded:
//
//   - someone else changed a field I didn't touch     -> take theirs
//   - I changed a field they didn't touch             -> keep mine
//   - we both changed it, to the same value           -> fine
//   - we both changed it, differently                 -> a real conflict; ask
//
// The first draft of this only auto-merged bot bookkeeping and called everything else a
// conflict. Testing showed why that's wrong: colleague edits the closing line, I edit the
// subject, and the only choices offered each silently discard one person's work. Asking is
// reserved for the case where there's genuinely no right answer to pick automatically.
//
// Bot-owned keys get one extra rule: if both sides touched `status`, the person's intent
// wins, since they just clicked a send action and CI's reset is already stale by definition.
// `prefer` settles collisions instead of reporting them — used once someone has picked a
// side in the conflict banner, so their choice applies to the colliding fields only and
// every non-colliding edit, theirs and yours, still survives.
export function mergeRemoteChanges({ base, remote, local, prefer }) {
  if (!prefer && base.body !== remote.body && local.body !== base.body && local.body !== remote.body) {
    return { ok: false, remoteChanged: ['the body text'] };
  }
  const remoteChanged = changedKeys(base.data, remote.data);
  const localChanged = new Set(changedKeys(base.data, local.data));
  const collisions = remoteChanged.filter(
    (k) => localChanged.has(k) && !same(local.data[k], remote.data[k]) && !BOT_KEYS.has(k),
  );
  if (collisions.length && !prefer) return { ok: false, remoteChanged: collisions };

  const data = { ...local.data };
  const merged = [];
  for (const k of remoteChanged) {
    const collided = collisions.includes(k);
    if (localChanged.has(k) && !(collided && prefer === 'remote')) continue; // keep mine
    if (remote.data[k] === undefined) delete data[k];
    else data[k] = remote.data[k];
    merged.push(k);
  }
  const bodyCollides = base.body !== remote.body && local.body !== base.body && local.body !== remote.body;
  const body = bodyCollides ? (prefer === 'remote' ? remote.body : local.body) : base.body !== remote.body ? remote.body : local.body;
  return { ok: true, data, body, merged };
}
