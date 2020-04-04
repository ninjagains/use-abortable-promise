import { useMemo, useCallback, DependencyList } from 'react';
import usePromise, { State } from './usePromise';
import createAbortController from './createAbortController';

type Options = {
  abortController?: AbortController;
};

function useAbortablePromise<T>(
  promise: (signal: AbortSignal | undefined) => Promise<T>,
  inputs: DependencyList,
  { abortController }: Options = {}
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

export { usePromise };

export default useAbortablePromise;
