1. You cannot import a Server Component into a Client Component, but you *can* import a Client Component into a Server Component.
~~~
// This pattern works:
// You can pass a Server Component as a child or prop of a
// Client Component.
import ExampleClientComponent from './example-client-component';
import ExampleServerComponent from './example-server-component';
 
// Pages in Next.js are Server Components by default
export default function Page() {
  return (
    <ExampleClientComponent>
      <ExampleServerComponent />
    </ExampleClientComponent>
  );
}
~~~
2. Recommended Pattern: Passing Server Components to Client Components as Props (note use of children in example that follows):
~~~
'use client';
 
import { useState } from 'react';
 
export default function ExampleClientComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);
 
  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
 
      {children}
    </>
  );
}
~~~
3. Though not strictly part of Next.js, it may be helpful to install npm package server-only. Any Client Component that imports a server-only component, will receive a build-time error.
~~~
import 'server-only';
 
export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY,
    },
  });
 
  return res.json();
}
~~~
4. Although it's possible to fetch data in Client Components, we recommend fetching data in Server Components unless you have a specific reason for fetching data on the client. Moving data fetching to the server leads to better performance and user experience. Here's a quick overview of the recommendations:

- Fetch data on the server using Server Components.
- Fetch data in parallel to minimize waterfalls and reduce loading times.
- For Layouts and Pages, fetch data where it's used. Next.js will automatically dedupe requests in a tree.
- Use Loading UI, Streaming and Suspense to progressively render a page and show a result to the user while the rest of the content loads.
5. It's still possible to fetch data client-side. We recommend using a third-party library such as SWR or React Query with Client Components. In the future, it'll also be possible to fetch data in Client Components using React's use() hook.

In the App Router, you can fetch data inside layouts, pages, and components. Data fetching is also compatible with Streaming and Suspense.

Good to know: For layouts, it's not possible to pass data between a parent layout and its children components. We recommend fetching data directly inside the layout that needs it, even if you're requesting the same data multiple times in a route. Behind the scenes, React and Next.js will cache and dedupe requests to avoid the same data being fetched more than once.
~~~
~~~
6. The root layout is our way to manipulate the HTML returned by the server to the entire app at once. It is a server component, and it does not render again upon navigation. This means any data or state in a layout will persist throughout the lifecycle of the app.
~~~
~~~
7. 