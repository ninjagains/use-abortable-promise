# use-abortable-promise

> Hook for managing abortable `Promise`s (e.g. [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)) inside React components.

```bash
yarn add use-abortable-promise
```

## Usage

```js
import * as React from 'react';
import { useAbortablePromise } from 'use-abortable-promise';

function App() {
  const [offset, setOffset] = React.useState(0);

  const [{ data, loading, error }, abort] = useAbortablePromise(
    async (signal) => {
      try {
        return await Promise.all([
          fetchUserById(offset + 1, { signal }),
          fetchUserById(offset + 2, { signal }),
          fetchUserById(offset + 3, { signal }),
        ]);
      } catch (error) {
        if (error.message === 'Timeout') {
          abort();
        }

        throw error;
      }
    },
    [offset],
  );

  return (
    <>
      <button onClick={() => abort()}>Abort</button>
      <button onClick={() => setOffset((offset) => offset + 1)}>
        Increase Offset ({offset})
      </button>
      <pre>{JSON.stringify({ data, loading, error }, null, 2)}</pre>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </>
  );
}
```

See more in the [example](https://github.com/ninjagains/use-abortable-promise/blob/master/example) app.

## Composing New Hooks

The power of React Hooks let you compose and create even more customized hooks without a lot of effort. Take for example a `useRest` that wires up a `fetch` that automatically aborts on timeouts using `use-abortable-promise`.

```js
import { useAbortablePromise, timeout } from 'use-abortable-promise';

function timeout(ms: number) {
  let timeoutId: any;
  return {
    start(): Promise<never> {
      return new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout'));
        }, ms);
      });
    },
    clear() {
      clearTimeout(timeoutId);
    },
  };
}


async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response.json();
}

export function useRest<T>(
  fn: (fetch: typeof fetchJson) => Promise<T>,
  inputs: Array<unknown>
) {
  const [result, abort] = useAbortablePromise(async signal => {
    try {
      const fetchWithSignal: typeof fetchJson = (input, init) =>
        fetchJson(input, {
          ...init,
          signal
        });

      const { start, clear } = timeout(15000);
      return await Promise.race([
        start()
        fn(fetchWithSignal)
      ]).finally(clear);
    } catch (error) {
      if (error.message === 'Timeout') {
        abort();
      }

      throw error;
    }
  }, inputs);
  return result;
}
```

Use it in your components:

```js
import { useReducer } from 'react';
import { useRest } from './useRest';

function UserList() {
  const [refreshCount, refresh] = useReducer((x) => x + 1, 0);
  const { data, error, loading } = useRest(
    (fetch) =>
      Promise.all([
        fetch('/users/inactive'),
        fetch('/users/active'),
        Promise.resolve(Math.random()),
      ]),
    [refreshCount],
  );

  return (
    <>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}
```

## License

MIT
