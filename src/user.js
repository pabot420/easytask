import axios from 'axios';

// Get Username
export async function getUsername(token) {
  const { data } = await axios.get('https://gateway.blum.codes/v1/user/me', {
    headers: { Authorization: token },
  });
  return data.username;
}

// Get Balance
export async function getBalance(token) {
  const { data } = await axios.get('https://game-domain.blum.codes/api/v1/user/balance', {
    headers: { Authorization: token },
  });
  return data;
}
