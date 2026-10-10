export default function handler(req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'ok',
      service: 'Forex4you Trading Platform',
      timestamp: new Date().toISOString(),
    })
  );
}
