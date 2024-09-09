import axios from 'axios';

export async function getToken(queryId) {
  try {
    const { data } = await axios({
      url: 'https://user-domain.blum.codes/api/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP',
      method: 'POST',
      data: {
        query: queryId,
        referralToken: 'vTHusRz4j0', 
      },
    });

    if (data && data.token && data.token.access) {
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

export async function getUsername(token) {
  const response = await axios({
    url: 'https://gateway.blum.codes/v1/user/me',
    method: 'GET',
    headers: { Authorization: token },
  });
  return response.data.username;
}

export async function getBalance(token) {
  const response = await axios({
    url: 'https://game-domain.blum.codes/api/v1/user/balance',
    method: 'GET',
    headers: { Authorization: token },
  });
  return response.data;
}

export async function getTribe(token) {
  try {
    const response = await axios({
      url: 'https://game-domain.blum.codes/api/v1/tribe/my',
      method: 'GET',
      headers: { Authorization: token },
    });
    return response.data;
  } catch (error) {
    if (error.response.data.message === 'NOT_FOUND') {
      return;
    } else {
      console.log(error.response.data.message);
    }
  }
}

export async function claimFarmReward(token) {
  try {
    const { data } = await axios({
      url: 'https://game-domain.blum.codes/api/v1/farming/claim',
      method: 'POST',
      headers: { Authorization: token },
      data: null,
    });
    return data;
  } catch (error) {
    if (error.response.data.message === `It's too early to claim`) {
      console.error(`🚨 Claim failed! It's too early to claim.`.red);
    } else if (error.response.data.message === `Need to start farm`) {
      console.error(`🚨 Claim failed! Need to start farm.`.red);
    } else {
      console.error(`🚨 Error occurred from farm claim: ${error}`.red);
    }
  }
}

export async function claimDailyReward(token) {
  try {
    const { data } = await axios({
      url: 'https://game-domain.blum.codes/api/v1/daily-reward?offset=-420',
      method: 'POST',
      headers: {
        Authorization: token,
      },
      data: null,
    });

    return data;
  } catch (error) {
    if (error.response.data.message === 'same day') {
      console.error(
        `🚨 Daily claim failed because you already claim this day.`.red
      );
    } else {
      console.error(`🚨 Error occurred from daily claim: ${error}`.red);
    }
  }
}

export async function startFarmingSession(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/farming/start',
    method: 'POST',
    headers: { Authorization: token },
    data: null,
  });
  return data;
}

export async function getTasks(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/tasks',
    method: 'GET',
    headers: { Authorization: token },
  });
  return data[0].subSections;
}

export async function startTask(token, taskId, title) {
  try {
    const { data } = await axios({
      url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/start`,
      method: 'POST',
      headers: { Authorization: token },
      data: null,
    });
    return data;
  } catch (error) {
    if (
      error.response &&
      error.response.data &&
      error.response.data.message === 'Task type does not support start'
    ) {
      console.error(
        `🚨 Start task "${title}" failed, because the task is not started yet.`
          .red
      );
    } else {
      console.log(error.response.data.message);
    }
  }
}

export async function claimTaskReward(token, taskId) {
  const { data } = await axios({
    url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/claim`,
    method: 'POST',
    headers: { Authorization: token },
    data: null,
  });
  return data;
}

export async function getGameId(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/game/play',
    method: 'POST',
    headers: { Authorization: token },
    data: null,
  });
  return data;
}

export async function claimGamePoints(token, gameId, points) {
  const { data } = await axios({
    url: `https://game-domain.blum.codes/api/v1/game/claim`,
    method: 'POST',
    headers: { Authorization: token },
    data: {
      gameId,
      points,
    },
  });
  return data;
}
