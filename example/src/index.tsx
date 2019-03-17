import React, { useState } from 'react';
import { render } from 'react-dom';
import useAbortablePromise from 'use-abortable-promise';

async function timeout(ms: number): Promise<never> {
  await new Promise(resolve => setTimeout(resolve, ms));
  throw new Error('Timeout');
}

async function fetchUserById(
  id: number,
  options: RequestInit = {}
): Promise<{ id: number; name: string }> {
  const response = await Promise.race([
    timeout(6000),
    fetch(`https://jsonplaceholder.typicode.com/users/${id}`, options)
  ]);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

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

render(<App />, document.getElementById('root'));
