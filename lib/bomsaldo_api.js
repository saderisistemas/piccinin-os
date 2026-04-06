const TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const SECRET = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';
const API_URL = 'https://bomsaldo.com/api';

async function updateStatus(endpoint, id, payload) {
    const url = new URL(`${API_URL}${endpoint}/${id}`);
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'access-token': TOKEN,
                'secret-access-token': SECRET,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            console.error(`Falha ao inativar ${endpoint}/${id} - Status: ${response.status}`);
            return false;
        }
        return true;
    } catch(e) {
        console.error(`Erro rede ${endpoint}/${id}: ${e.message}`);
        return false;
    }
}

module.exports = {
  updateStatus
};
