export const PET_STATES = {
  DEFAULT: "default",
  REFLECTION: "reflection",
  FINAL: "final"
};

const state = {
  current: PET_STATES.DEFAULT,
  expression: "neutral",
  reflectionQueue: [],
  reflectionIndex: 0,
  reflectionTimer: null,
  reflectionRotationTimer: null,
  listeners: new Set()
};

export function getState() {
  return state;
}

export function subscribe(listener) {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

export function notify() {
  state.listeners.forEach((listener) => listener(state));
}

export function setCurrentState(nextState) {
  state.current = nextState;
  notify();
}

export function setExpression(expression) {
  state.expression = expression;
  notify();
}
