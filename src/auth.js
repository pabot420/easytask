import axios from 'axios';

// Get Token
export async function getToken(queryId) {
  try {
    const { data } = await axios.post(
      'https://user-domain.blum.codes/api/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP',
      { query: queryId, referralToken: 'vTHusRz4j0' }
    );

    if (data?.token?.access) {
      console.log('✅ Token successfully retrieved.');
      return `Bearer ${data.token.access}`;
    } else {
      console.error('❌ Failed to retrieve a valid token.');
      return null;
    }
  } catch (error) {
    console.error(`❌ Error occurred while fetching token: ${error.message}`);
    return null;
  }
}
