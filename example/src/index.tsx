import React, { useState } from 'react';
import { render } from 'react-dom';
import useAbortablePromise from 'use-abortable-promise';

function timeout(ms = 1000) {
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

async function fetchUserById(
  id: number,
  options: RequestInit = {}
): Promise<{ id: number; name: string }> {
  const { start, clear } = timeout(1000);
  const response = await Promise.race([
    start(),
    fetch(`https://jsonplaceholder.typicode.com/users/${id}`, options),
  ]).finally(clear);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function App() {
  const [offset, setOffset] = useState(0);

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
    [offset]
  );

  return (
    <>
      <button onClick={() => abort()}>Abort</button>
      <button onClick={() => setOffset((offset) => offset + 1)}>
        Increase Offset ({offset})
      </button>
      <pre>
        {JSON.stringify({ data, loading, error: error?.message }, null, 2)}
      </pre>
    </>
  );
}

render(<App />, document.getElementById('root'));
