import axios from 'axios';

// Claim Farm Reward
export async function claimFarmReward(token) {
  try {
    const { data } = await axios.post('https://game-domain.blum.codes/api/v1/farming/claim', null, {
      headers: { Authorization: token },
    });
    return data;
  } catch (error) {
    if (error.response.data.message === `It's too early to claim`) {
      console.error(`🚨 Claim failed! It's too early to claim.`);
    } else if (error.response.data.message === `Need to start farm`) {
      console.error(`🚨 Claim failed! Need to start farm.`);
    } else {
      console.error(`🚨 Error occurred from farm claim: ${error}`);
    }
  }
}

// Start Farming Session
export async function startFarmingSession(token) {
  const { data } = await axios.post('https://game-domain.blum.codes/api/v1/farming/start', null, {
    headers: { Authorization: token },
  });
  return data;
}
