async function test() {
  const KAPRUKA_MCP_URL = 'https://mcp.kapruka.com/mcp';
  const initRes = await fetch(KAPRUKA_MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agent', version: '1.0' } } })
  });
  const sessionId = initRes.headers.get('mcp-session-id');
  await initRes.text();
  
  const callRes = await fetch(KAPRUKA_MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'mcp-session-id': sessionId },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'kapruka_get_product', arguments: { params: { product_id: 'CAKE00KA001685' } } } })
  });
  const text = await callRes.text();
  console.log(text.substring(0, 1000));
}
test();
