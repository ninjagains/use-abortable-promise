import { useMemo, useCallback } from 'react';
import usePromise, { State } from './usePromise';
import createAbortController from './createAbortController';

function useAbortablePromise<T>(
  promise: (signal: AbortSignal | undefined) => Promise<T>,
  inputs: Array<any>
) {
  const controller = useMemo(createAbortController, inputs);
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

export default useAbortablePromise;
