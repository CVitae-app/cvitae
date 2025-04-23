import { useState, useCallback, useRef } from "react";

export default function useUndoRedo(initialValueOrFn, maxHistory = 50) {
  const initialValue =
    typeof initialValueOrFn === "function" ? initialValueOrFn() : initialValueOrFn;

  const [state, setState] = useState(initialValue);
  const history = useRef([initialValue]);
  const pointer = useRef(0);

  const updateState = useCallback((newValue, options = { saveHistory: true }) => {
    const currentValue =
      typeof newValue === "function"
        ? newValue(history.current[pointer.current])
        : newValue;

    const prev = history.current[pointer.current];

    // 🔒 Avoid state updates if nothing changed
    if (JSON.stringify(currentValue) === JSON.stringify(prev)) {
      return;
    }

    if (!options.saveHistory) {
      setState(currentValue);
      return;
    }

    if (pointer.current < history.current.length - 1) {
      history.current = history.current.slice(0, pointer.current + 1);
    }

    history.current.push(currentValue);

    if (history.current.length > maxHistory) {
      history.current.shift();
    } else {
      pointer.current++;
    }

    setState(currentValue);
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (pointer.current > 0) {
      pointer.current--;
      setState(history.current[pointer.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (pointer.current < history.current.length - 1) {
      pointer.current++;
      setState(history.current[pointer.current]);
    }
  }, []);

  const reset = useCallback((newValue) => {
    const resolved = typeof newValue === "function" ? newValue() : newValue;
    history.current = [resolved];
    pointer.current = 0;
    setState(resolved);
  }, []);

  return {
    state,
    setState: updateState,
    undo,
    redo,
    reset,
    canUndo: pointer.current > 0,
    canRedo: pointer.current < history.current.length - 1,
  };
}
