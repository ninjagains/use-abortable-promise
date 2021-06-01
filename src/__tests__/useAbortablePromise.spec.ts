import { renderHook } from '@testing-library/react-hooks';
import { useAbortablePromise } from '../';

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

test('pending', () => {
  const { result } = renderHook(() =>
    useAbortablePromise(() => Promise.resolve('Hello World'), [])
  );

  expect(result.current[0]).toEqual({
    data: null,
    error: null,
    loading: true,
  });
});

test('resolved', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useAbortablePromise(() => Promise.resolve('Hello World'), [])
  );

  await waitForNextUpdate();

  expect(result.current[0]).toEqual({
    data: 'Hello World',
    error: null,
    loading: false,
  });
});

test('rejected', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useAbortablePromise(() => Promise.reject(new Error('error')), [])
  );

  await waitForNextUpdate();

  expect(result.current[0]).toEqual({
    data: null,
    error: new Error('error'),
    loading: false,
  });
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

test('fetch', async () => {
  let aborted;
  const {
    result: {
      current: [payload, abort],
    },
  } = renderHook(() =>
    useAbortablePromise(
      (signal) =>
        new Promise((resolve) => {
          signal!.addEventListener('abort', () => {
            aborted = true;
          });

          resolve('should never');
        }),
      []
    )
  );

  abort();

  expect(aborted).toEqual(true);
  expect(payload.data).toEqual(null);
});
