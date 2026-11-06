import { useEffect, useRef } from 'react';

// "Load more" for paged lists (20 at a time). With `auto`, the next page loads
// on its own as the bottom of the list scrolls into view; the button stays as a fallback.
function LoadMore({ hasMore, onLoadMore, loading, auto }) {
  const ref  = useRef(null);
  const load = useRef(onLoadMore);
  load.current = onLoadMore;

  useEffect(() => {
    if (!auto || !hasMore || loading || !ref.current || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); load.current(); } }, { rootMargin: '300px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [auto, hasMore, loading]);

  if (!hasMore) return null;
  return (
    <div className="load-more" ref={ref}>
      <button className="wiw-ghost" onClick={onLoadMore} disabled={loading}>
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
}

export default LoadMore;
