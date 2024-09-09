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

// Get Tribe
export async function getTribe(token) {
  try {
    const { data } = await axios.get('https://game-domain.blum.codes/api/v1/tribe/my', {
      headers: { Authorization: token },
    });
    return data;
  } catch (error) {
    if (error.response.data.message === 'NOT_FOUND') {
      return;
    } else {
      console.log(error.response.data.message);
    }
  }
}

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

// Start Farming Session
export async function startFarmingSession(token) {
  const { data } = await axios.post('https://game-domain.blum.codes/api/v1/farming/start', null, {
    headers: { Authorization: token },
  });
  return data;
}

// Get Tasks
export async function getTasks(token) {
  const { data } = await axios.get('https://game-domain.blum.codes/api/v1/tasks', {
    headers: { Authorization: token },
  });
  return data[0].subSections;
}

// Start Task
export async function startTask(token, taskId, title) {
  try {
    const { data } = await axios.post(
      `https://game-domain.blum.codes/api/v1/tasks/${taskId}/start`,
      null,
      { headers: { Authorization: token } }
    );
    return data;
  } catch (error) {
    if (error.response?.data?.message === 'Task type does not support start') {
      console.error(`🚨 Start task "${title}" failed, because the task is not started yet.`);
    } else {
      console.log(error.response.data.message);
    }
  }
}

// Claim Task Reward
export async function claimTaskReward(token, taskId) {
  const { data } = await axios.post(
    `https://game-domain.blum.codes/api/v1/tasks/${taskId}/claim`,
    null,
    { headers: { Authorization: token } }
  );
  return data;
}

// Get Game ID
export async function getGameId(token) {
  const { data } = await axios.post('https://game-domain.blum.codes/api/v1/game/play', null, {
    headers: { Authorization: token },
  });
  return data;
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
