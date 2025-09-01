import * as React from 'react';

import { createAbortController } from './createAbortController';

class AbortError extends Error {
  constructor() {
    super('Aborted');
  }
}

const assertNever = (_t: never): never => {
  throw new Error();
};

export type State<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  resolvedCount: number;
};

const PENDING = 0;
const RESOLVED = 1;
const REJECTED = 2;
const RESET = 3;

type Action<T> =
  | {
      type: typeof RESOLVED;
      data: T;
    }
  | {
      type: typeof REJECTED;
      error: Error;
    }
  | { type: typeof PENDING }
  | { type: typeof RESET };

function reducer<T>(state: State<T>, action: Action<T>) {
  switch (action.type) {
    case RESOLVED:
      return {
        ...state,
        error: null,
        data: action.data,
        loading: false,
        resolvedCount: state.resolvedCount + 1,
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

    case RESET:
      return initialState;

    default:
      assertNever(action);
      throw new Error();
  }
}

const initialState = {
  data: null,
  error: null,
  loading: false,
  resolvedCount: 0,
};

export interface UseAbortablePromiseOptions {
  abortController?: AbortController;
}

export function useAbortablePromise<T>(
  promise: (signal: AbortSignal | undefined) => Promise<T>,
  inputs: React.DependencyList,
  { abortController }: UseAbortablePromiseOptions = {},
) {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const getAbortController = () => {
    if (abortControllerRef.current == null) {
      abortControllerRef.current = abortController || createAbortController();
    }
    return abortControllerRef.current;
  };

  React.useEffect(() => {
    const controller = getAbortController();

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
        if (unmounted || aborted) {
          return;
        }

        dispatch({ type: RESOLVED, data: result });
        if (controller.signal) {
          controller.signal.removeEventListener('abort', abort);
        }
      },
      (error) => {
        if (unmounted || aborted) {
          return;
        }

        dispatch({ type: REJECTED, error });

        if (controller.signal) {
          controller.signal.removeEventListener('abort', abort);
        }
      },
    );

    return () => {
      unmounted = true;
      controller.abort();
      abortControllerRef.current = null;

      if (controller.signal) {
        controller.signal.removeEventListener('abort', abort);
      }
    };
  }, inputs);

  return [state, () => abortControllerRef.current?.abort()] as [
    State<T>,
    () => void,
  ];
}

export function useMutation<Input, ReturnValue>(
  mutationFn: (value: Input) => Promise<ReturnValue>,
) {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const execute = React.useCallback(async (value: Input) => {
    try {
      dispatch({ type: PENDING });
      const result = await mutationFn(value);
      dispatch({ type: RESOLVED, data: result });
      return result;
    } catch (error: any) {
      dispatch({ type: REJECTED, error });
      throw error;
    }
  }, []);

  const reset = React.useCallback(() => {
    dispatch({ type: RESET });
  }, []);

  return [state, execute, reset] as const;
}
