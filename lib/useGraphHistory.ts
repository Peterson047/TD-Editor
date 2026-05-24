"use client";

import { useState, useCallback, useRef } from "react";
import { GraphState } from "./graph";

interface HistoryState {
  past: GraphState[];
  present: GraphState;
  future: GraphState[];
}

export function useGraphHistory(initial: GraphState) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initial,
    future: [],
  });

  // batchDepth > 0 means we're in a drag/session — don't push to past
  const batchDepth = useRef(0);

  const push = useCallback((newState: GraphState | ((prev: GraphState) => GraphState)) => {
    setHistory((prev) => {
      const nextState =
        typeof newState === "function" ? (newState as (prev: GraphState) => GraphState)(prev.present) : newState;

      // During batch, just replace present without stacking
      if (batchDepth.current > 0) {
        return { ...prev, present: nextState };
      }

      // Don't push if identical
      if (JSON.stringify(nextState) === JSON.stringify(prev.present)) {
        return prev;
      }

      return {
        past: [...prev.past, prev.present].slice(-50),
        present: nextState,
        future: [],
      };
    });
  }, []);

  const beginBatch = useCallback(() => {
    batchDepth.current += 1;
  }, []);

  const endBatch = useCallback(() => {
    batchDepth.current = Math.max(0, batchDepth.current - 1);
  }, []);

  const commit = useCallback(() => {
    setHistory((prev) => {
      // Push current present into past as a snapshot
      if (JSON.stringify(prev.present) === JSON.stringify(prev.past[prev.past.length - 1])) {
        return prev;
      }
      return {
        past: [...prev.past, prev.present].slice(-50),
        present: prev.present,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    push,
    beginBatch,
    endBatch,
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
