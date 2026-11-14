import { machine } from "./index.js";

async function main() {
  const task = machine({
    todo: { start: ["doing"] },
    doing: { finish: ["done"], pause: ["todo"] },
    done: { reopen: ["todo"] },
  });

  // 1. can I do this?
  console.log(task.can("doing", "pause")); // ["todo"]
  console.log(task.can("todo", "finish")); // []

  // 2. do it: pass the current state, get the new one back
  console.log(await task.fire("todo", "start", null)); // { ok: true, state: "doing" }
  console.log(await task.fire("todo", "finish", null)); // { ok: false, state: "todo", reason: "can't finish from todo" }

  // 3. run code on a move, and pick the target when there are several
  const order = machine({
    cart: { pay: ["paid", "failed"], cancel: ["cancelled"] },
    failed: { pay: ["paid", "failed"], cancel: ["cancelled"] },
    paid: { ship: ["shipped"] },
    shipped: {},
    cancelled: {},
  });
  const pay = (card: string) => order.fire("cart", "pay", card, { pay: (_from, card) => (card === "ok" ? "paid" : "failed") });
  console.log(await pay("ok")); // { ok: true, state: "paid" }
  console.log(await pay("declined")); // { ok: true, state: "failed" }
  console.log(await order.fire("cart", "pay", "ok")); // { ok: false, ..., reason: "pay from cart must pick one of: paid, failed" }

  // 4. say no with refuse, or fail by throwing. Either way the state doesn't move
  const door = machine({
    open: { close: ["closed"] },
    closed: { open: ["open"], lock: ["locked"] },
    locked: { unlock: ["closed"] },
  });
  const unlock = (key: string) => door.fire("locked", "unlock", key, { unlock: (_from, key) => (key === "1234" ? undefined : { refuse: "wrong key" }) });
  console.log(await unlock("0000")); // { ok: false, state: "locked", reason: "wrong key" }
  console.log(await unlock("1234")); // { ok: true, state: "closed" }

  const jammed = await door
    .fire("closed", "lock", null, {
      lock: () => {
        throw new Error("bolt jammed");
      },
    })
    .catch((error: Error) => `threw: ${error.message}`);
  console.log(jammed); // "threw: bolt jammed"

  // 5. several moves in order. Stops at the first refusal, and undoes nothing
  console.log(await door.path("open", ["close", "lock"], null)); // { ok: true, state: "locked", done: 2 }
  console.log(await door.path("open", ["lock", "close"], null)); // { ok: false, state: "open", reason: "can't lock from open", done: 0 }

  // 6. mistakes are caught as you type. These don't compile:
  // task.can("todo", "nope");      // not an event in this table
  // task.can("nowhere", "start");  // not a state
  // and a table with a move to a state that doesn't exist throws when the machine is created
}

main();
