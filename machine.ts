type Table = Record<string, Record<string, readonly string[]>>;
type Refuse = { refuse: string };

export type Result<S> = { ok: true; state: S } | { ok: false; state: S; reason: string };

export function machine<const T extends Table>(table: T) {
  type S = keyof T & string;
  type E = { [K in S]: keyof T[K] & string }[S];

  // runs when a move happens. Return the state you reached (needed when a move has several targets),
  // or { refuse: "why" } to stop it. Throwing also stops it. Either way the state doesn't move
  type Handlers<C> = Partial<Record<E, (from: S, ctx: C) => S | Refuse | void | Promise<S | Refuse | void>>>;

  for (const [from, moves] of Object.entries(table))
    for (const [event, targets] of Object.entries(moves))
      for (const to of targets) if (!(to in table)) throw new Error(`${from}.${event} goes to unknown state '${to}'`);

  // where this event can lead from this state. Empty means it can't be fired here
  const can = (from: S, event: E): readonly S[] => (table[from] as Record<string, readonly S[]>)[event] ?? [];

  async function fire<C>(from: S, event: E, ctx: C, handlers: Handlers<C> = {}): Promise<Result<S>> {
    const allowed = can(from, event);
    if (!allowed.length) return { ok: false, state: from, reason: `can't ${event} from ${from}` };

    // the handler runs before the state moves
    const out = (await handlers[event]?.(from, ctx)) as S | Refuse | undefined;
    if (typeof out === "object") return { ok: false, state: from, reason: out.refuse };

    const to = out ?? (allowed.length === 1 ? allowed[0] : undefined);
    if (!to) return { ok: false, state: from, reason: `${event} from ${from} must pick one of: ${allowed.join(", ")}` };
    if (!allowed.includes(to)) return { ok: false, state: from, reason: `${event} from ${from} can't end in ${to}` };
    return { ok: true, state: to };
  }

  // several events in order. Stops at the first one that's refused. Nothing is undone
  async function path<C>(from: S, events: E[], ctx: C, handlers: Handlers<C> = {}) {
    let state = from;
    for (const [done, event] of events.entries()) {
      const result = await fire(state, event, ctx, handlers);
      if (!result.ok) return { ...result, done };
      state = result.state;
    }
    return { ok: true as const, state, done: events.length };
  }

  return { can, fire, path };
}
