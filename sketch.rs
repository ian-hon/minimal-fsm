// boilerplate
type Transition<P> = FnMut<P>;
struct StateMachine<
  S: Hash + Eq + PartialEq,
  P
> {
  mapping: Map<(S, S), Transition<P>>
};
impl StateMachine<S, P> {
  // fn can(&'a self, to: &S, from: &S) -> Option<&'a Transition<P>> {
  fn can(&self, to: &S, from: &S) -> Option<&Transition<P>> {
      self.mapping.get((to, from)).map(|i| i.clone()) // or std::clone, whatever its called lol
  }

  fn next(&'a self, from: S) -> &'a [S] {
    mapping
      .iter()
      .filter(|(k, _), _| k.eq(from))
      .map(|(_, k), _| k.clone())
      .collect()
  }
}

fn create_machine<S, P>(
  transitions: Vec<(S, &[(S, Transition<P>)])>
) -> StateMachine<S, P> {
  unimplemented!()
}

// todo stuff
enum TodoState {
  Todo,
  Doing,
  Done
}

struct TransitionParams;

fn start(p: TransitionParams) {};
fn finish(p: TransitionParams) {};
fn pause(p: TransitionParams) {};
fn reopen(p: TransitionParams) {};

// compiles to Map<(State, State), FnMut<Params>>
let machine: StateMachine<TodoState, TransitionParams> = create_machine(vec![
  (TodoState::Todo, [
    (TodoState::Doing, start)
  ]),
  (TodoState::Doing, [
    (TodoState::Done, finish),
    (TodoState::Todo, pause)
  ]),
  (TodoState::Done, [
    (TodoState::Todo, reopen)
  ])
])

// usage
let params: TransitionParams = 0usize;

if let Some(t) = machine.can(TodoState::Todo, TodoState::Doing) {
  t(params)
}

assert_eq!(
  machine.can(TodoState::Todo, TodoState::Done),
  None
);
assert_neq!(
  machine.can(TodoState::Todo, TodoState::Doing),
  None
);
