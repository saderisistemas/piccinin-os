const https = require('https');

const API_TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const API_SECRET = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';
const OS_ID = '359671335';

async function run() {
  const payload = {
    servicos: [
      {
        servico: {
          servico_id: "57940785", // Manutenção
          quantidade: "1",
          valor_venda: "0",
          tipo_desconto: "R$",
          desconto_valor: "0"
        }
      }
    ]
  };

  const options = {
    hostname: 'bomsaldo.com',
    path: `/api/ordens_servicos/${OS_ID}`,
    method: 'PUT',
    headers: {
      'access-token': API_TOKEN,
      'secret-access-token': API_SECRET,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => console.log(d));
  });
  req.write(JSON.stringify(payload));
  req.end();
}
run();
