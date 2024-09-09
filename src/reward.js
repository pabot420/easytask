import axios from 'axios';

// Claim Daily Reward
export async function claimDailyReward(token) {
  try {
    const { data } = await axios.post(
      'https://game-domain.blum.codes/api/v1/daily-reward?offset=-420',
      null,
      { headers: { Authorization: token } }
    );
    return data;
  } catch (error) {
    if (error.response.data.message === 'same day') {
      console.error(`🚨 Daily claim failed because you already claim this day.`);
    } else {
      console.error(`🚨 Error occurred from daily claim: ${error}`);
    }
  }
}

// Claim Game Points
export async function claimGamePoints(token, gameId, points) {
  const { data } = await axios.post(
    'https://game-domain.blum.codes/api/v1/game/claim',
    { gameId, points },
    { headers: { Authorization: token } }
  );
  return data;
}
