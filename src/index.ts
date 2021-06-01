import { DependencyList, useCallback, useMemo } from 'react';
import { State, usePromise } from './usePromise';

import { createAbortController } from './createAbortController';

export interface UseAbortablePromiseOptions {
  abortController?: AbortController;
}

function useAbortablePromise<T>(
  promise: (signal: AbortSignal | undefined) => Promise<T>,
  inputs: DependencyList,
  { abortController }: UseAbortablePromiseOptions = {}
) {
  const controller = useMemo(() => {
    return abortController || createAbortController();
  }, inputs);

  const abort = useCallback(() => controller.abort(), [controller]);
  const promiseFn = useCallback(promise, inputs);

  const state = usePromise(
    () => promiseFn(controller.signal),
    inputs,
    controller.signal,
    abort
  );

  return [state, abort] as [State<T>, () => void];
}

export { usePromise, useAbortablePromise, createAbortController };
