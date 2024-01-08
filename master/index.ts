Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    switch (method) {
      case 'GET': {
        if (url.pathname === '/') {
          return new Response("Home page!");
        }
        break;
      }
      case 'POST': {
        if (url.pathname === '/') {
          const data = await req.json();
          return new Response(JSON.stringify(data));
        }
        break
      }
    }
    return new Response("404!");
  },
});
