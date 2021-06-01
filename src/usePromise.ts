import { DependencyList, useEffect, useReducer } from 'react';

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

export function usePromise<T>(
  promise: () => Promise<T>,
  inputs: DependencyList,
  signal?: AbortSignal | null,
  onCancel?: () => void
) {
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    let unmounted = false;
    let aborted = false;

    function abort() {
      aborted = true;
      dispatch({ type: REJECTED, error: new AbortError() });
    }

    if (signal) {
      if (signal.aborted) {
        throw new AbortError();
      }

      signal.addEventListener('abort', abort);
    }

    dispatch({ type: PENDING });

    promise().then(
      (result) => {
        if (unmounted || aborted) return;
        dispatch({ type: RESOLVED, data: result });
        signal && signal.removeEventListener('abort', abort);
      },
      (error) => {
        if (unmounted || aborted) return;
        dispatch({ type: REJECTED, error });
        signal && signal.removeEventListener('abort', abort);
      }
    );

    return () => {
      unmounted = true;
      if (signal) {
        signal.removeEventListener('abort', abort);
      }
      onCancel && onCancel();
    };
  }, inputs);

  return state;
}
