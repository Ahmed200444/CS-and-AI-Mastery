export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) return response;

  let html = await response.text();

  // Remove any older loader reference, then inject the latest one every time.
  html = html.replace(/<script[^>]*src=["']\/assets\/course-practice-routing\.js[^"']*["'][^>]*><\/script>/gi, '');

  const loader = '<script type="module" src="/assets/course-practice-routing.js?v=20260806-2"></script>';
  const marker = '<meta name="cs-ai-course-loader" content="20260806-2">';

  if (html.includes('</head>')) html = html.replace('</head>', `${marker}</head>`);
  else html = marker + html;

  if (html.includes('</body>')) html = html.replace('</body>', `${loader}</body>`);
  else html += loader;

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, max-age=0');
  headers.set('x-cs-ai-course-loader', '20260806-2');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
