import { render, screen } from '@testing-library/react';

import { renderHook } from '@testing-library/react-hooks';
import { useAbortablePromise } from '..';

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

function App({ fail = false, id = 0 }: { fail?: boolean; id?: number }) {
  const [{ data, loading, error }] = useAbortablePromise(async () => {
    if (fail) {
      throw new Error('Error');
    }
    return `Hello ${id}`;
  }, [fail, id]);

  if (error) {
    return <div>{error.message}</div>;
  }

  if (loading) {
    return <div>Loading</div>;
  }

  return <div>{data}</div>;
}

test('pending', async () => {
  render(<App />);
  await screen.findByText('Loading');
});

test('resolved', async () => {
  const { rerender } = render(<App />);
  rerender(<App id={1} />);
  await screen.findByText('Hello 1');
});

test('rejected', async () => {
  render(<App fail />);
  await screen.findByText('Error');
});

test('custom AbortController', async () => {
  const abort = jest.fn();
  const { result, unmount } = renderHook(() =>
    useAbortablePromise(
      () => delay(1000).then(() => Promise.resolve('should have been aborted')),
      [],
      {
        abortController: {
          abort,
          signal: undefined,
        } as any,
      }
    )
  );

  unmount();
  await delay(400);

  expect(abort).toHaveBeenCalled();
  expect(result.current[0].data).toEqual(null);
});
