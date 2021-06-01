import * as React from 'react';

import { createAbortController } from './createAbortController';

class AbortError extends Error {
  constructor() {
    super('Aborted');
  }
}

export type State<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
};

const PENDING = 0;
const RESOLVED = 1;
const REJECTED = 2;

type Action<T> =
  | {
      type: typeof RESOLVED;
      data: T;
    }
  | {
      type: typeof REJECTED;
      error: Error;
    }
  | { type: typeof PENDING };

function reducer<T>(state: State<T>, action: Action<T>) {
  switch (action.type) {
    case RESOLVED:
      return {
        ...state,
        error: null,
        data: action.data,
        loading: false,
      };

    case REJECTED:
      return {
        ...state,
        data: null,
        error: action.error,
        loading: false,
      };

    case PENDING:
      return {
        ...state,
        error: null,
        data: null,
        loading: true,
      };

    default:
      throw new Error();
  }
}

export interface UseAbortablePromiseOptions {
  abortController?: AbortController;
}

export function useAbortablePromise<T>(
  promise: (signal: AbortSignal | undefined) => Promise<T>,
  inputs: React.DependencyList,
  { abortController }: UseAbortablePromiseOptions = {}
) {
  const [state, dispatch] = React.useReducer(reducer, {
    data: null,
    error: null,
    loading: false,
  });

  const controller = React.useMemo<AbortController>(() => {
    return abortController || createAbortController();
  }, [abortController]);

  React.useEffect(() => {
    let unmounted = false;
    let aborted = false;

    function abort() {
      aborted = true;
      dispatch({ type: REJECTED, error: new AbortError() });
    }

    if (controller.signal) {
      if (controller.signal.aborted) {
        throw new AbortError();
      }

      controller.signal.addEventListener('abort', abort);
    }

    dispatch({ type: PENDING });

    promise(controller.signal).then(
      (result) => {
        if (unmounted || aborted) return;
        dispatch({ type: RESOLVED, data: result });
        if (controller.signal) {
          controller.signal.removeEventListener('abort', abort);
        }
      },
      (error) => {
        if (unmounted || aborted) return;
        dispatch({ type: REJECTED, error });
        if (controller.signal) {
          controller.signal.removeEventListener('abort', abort);
        }
      }
    );

    return () => {
      unmounted = true;
      controller.abort();
      if (controller.signal) {
        controller.signal.removeEventListener('abort', abort);
      }
    };
  }, inputs);

  return [state, () => controller.abort()] as [State<T>, () => void];
}
