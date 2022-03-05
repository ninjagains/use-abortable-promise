import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useAbortablePromise } from '..';
import { useMutation } from '../useAbortablePromise';

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
  const abort = vi.fn();
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

test('useMutation', () => {
  interface Post {
    title: string;
    body: string;
  }

  const posts: Post[] = [];

  function CreatePost() {
    const [result, createPost] = useMutation<Post, Post>(async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      posts.push(value);
      return value;
    });

    const [{ data }] = useAbortablePromise(async () => {
      return posts;
    }, []);

    const handleSubmit: React.FormEventHandler = async (e) => {
      await createPost({ title: 'Test', body: '' });
    };

    return (
      <div>
        {data?.map((post, i) => (
          <div key={i}>{post.title}</div>
        ))}
        <form onSubmit={handleSubmit}>
          <input type="text" name="title" />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }
});
