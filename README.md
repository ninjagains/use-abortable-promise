# use-abortable-promise

> React Hook for managing abortable `Promise`s.

```bash
yarn add use-abortable-promise
```

## Usage

```js
function App() {
  const [offset, setOffset] = useState(0);

  const [{ data, loading, error }, abort] = useAbortablePromise(
    async signal => {
      try {
        return await Promise.all([
          fetchUserById(offset + 1, { signal }),
          fetchUserById(offset + 2, { signal }),
          fetchUserById(offset + 3, { signal })
        ]);
      } catch (error) {
        if (error.message === 'Timeout') {
          abort();
        }

        throw error;
      }
    },
    [offset]
  );

  return (
    <>
      <button onClick={() => abort()}>Abort</button>
      <button onClick={() => setOffset(offset => offset + 1)}>
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

The power of React Hooks let you compose and create even more customized hooks wihout a lot of effort. Take for example a `useRest` hook that automatically wire up `fetch` that automatically aborts on timeouts using `use-abortable-promise`.

```js
import useAbortablePromise from 'use-abortable-promise';

function delay(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response.json();
}

export default function useRest<T>(
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

      return await Promise.race([
        fn(fetchWithSignal),
        delay(15000).then(() => Promise.reject(new Error('Timeout')))
      ]);
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
function UserList() {
  const [refreshCount, setRefreshCount] = useState(0);
  const { data, error, loading } = useRest(
    fetch =>
      Promise.all([
        fetch('/users/inactive'),
        fetch('/users/active'),
        Promise.resolve(Math.random())
      ]),
    [refreshCount]
  );

  return (
    <>
      <button onClick={() => setRefreshCount(c => c + 1)}>Refresh</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}
```

## License

MIT
