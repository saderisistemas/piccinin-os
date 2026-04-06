async function getWorkflows() {
  const res = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows', {
    headers: { 'X-N8N-API-KEY': 'n8n_api_938ecb9745b1473de6f9bd475d4090956b6c039ab6452140a7cfcac4f6a1d821' }
  });
  console.log(JSON.stringify(data, null, 2));
}
getWorkflows();
