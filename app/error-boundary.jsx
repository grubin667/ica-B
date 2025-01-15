import { useState, useEffect } from 'react';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  const resetError = () => setHasError(false);

  const ErrorFallback = () => (
    <div>
      <h2>Something went wrong.</h2>
      <button onClick={resetError}>Try Again</button>
    </div>
  );

  useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      console.error('Caught an error:', error);
    };

    window.onerror = (msg, url, lineNo, columnNo, error) => {
      handleError(error);
      return true;
    };

    window.onunhandledrejection = (event) => {
      handleError(event.reason);
    };

    return () => {
      window.onerror = null;
      window.onunhandledrejection = null;
    };
  }, []);

  if (hasError) {
    return <ErrorFallback />;
  }

  return children;
};

export default ErrorBoundary;
