// "Load more" for paged lists (20 at a time).
function LoadMore({ hasMore, onLoadMore, loading }) {
  if (!hasMore) return null;
  return (
    <div className="load-more">
      <button className="wiw-ghost" onClick={onLoadMore} disabled={loading}>
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
}

export default LoadMore;
