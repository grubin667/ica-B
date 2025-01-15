'use client'; // Error boundaries must be Client Components
 
// global-error.js replaces the root layout.js when active and so must define its
// own <html> and <body> tags.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong! Error: {error.message}</h2>
        <button className='h-10 px-5 text-yellow-500 transition-colors duration-150 border border-yellow-500 rounded-lg focus:shadow-outline hover:bg-yellow-500 hover:text-yellow-100' onClick={() => reset()}>
          Try again!
        </button>
      </body>
    </html>
  );
}
