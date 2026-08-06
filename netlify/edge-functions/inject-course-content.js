export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  let html = await response.text();
  const loader = '<script type="module" src="/assets/course-practice-routing.js?v=20260806-1"></script>';

  if (!html.includes('/assets/course-practice-routing.js')) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${loader}</body>`);
    } else {
      html += loader;
    }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-cache');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
