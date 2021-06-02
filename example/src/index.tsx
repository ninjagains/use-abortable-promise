import './index.scss';

import React, { useState } from 'react';
import { useAbortablePromise, useMutation } from '../../src';

import { render } from 'react-dom';

interface Post {
  id: number;
  title: string;
  body: string;
}

let postId = 0;
const posts: Post[] = [];

function Posts() {
  const titleRef = React.useRef<HTMLInputElement>(null);

  const [mutation, createPost] = useMutation<Post, Post>(async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    posts.push(value);
    return value;
  });

  const [query] = useAbortablePromise(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return posts.slice();
    // Trigger a re-fetch every time the mutation resolves
  }, [mutation.resolvedCount]);

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const title = titleRef.current?.value.trim() || 'Untitled';
    await createPost({ id: postId++, title, body: '' });
    if (titleRef.current) {
      titleRef.current.value = '';
    }
  };

  return (
    <div>
      {query.loading && <>Fetching posts...</>}
      {query.data?.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
      {query.data?.length === 0 && <>No posts :(</>}
      <form onSubmit={handleSubmit} method="post">
        <input ref={titleRef} type="text" name="title" />
        <button type="submit" disabled={mutation.loading}>
          Submit
        </button>
      </form>
    </div>
  );
}

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
    <div className="wrapper">
      <Posts />
      <div>
        <button onClick={() => abort()}>Abort</button>
        <button onClick={() => setOffset((offset) => offset + 1)}>
          Increase Offset ({offset})
        </button>
        <pre>
          {JSON.stringify({ data, loading, error: error?.message }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

render(<App />, document.getElementById('root'));
