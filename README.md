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

## License

MIT
