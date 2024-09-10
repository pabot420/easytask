import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  }
});

const API_TIMEOUT = 30000; 

export async function getToken(queryId) {
  try {
    const { data } = await axios({
      url: 'https://user-domain.blum.codes/api/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP',
      method: 'POST',
      data: {
        query: queryId,
        referralToken: 'vTHusRz4j0',
      },
      timeout: API_TIMEOUT,
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
    timeout: API_TIMEOUT,
  });
  return response.data.username;
}

export async function getBalance(token) {
  const response = await axios({
    url: 'https://game-domain.blum.codes/api/v1/user/balance',
    method: 'GET',
    headers: { Authorization: token },
    timeout: API_TIMEOUT,
  });
  return response.data;
}

export async function getTribe(token) {
  try {
    const response = await axios({
      url: 'https://game-domain.blum.codes/api/v1/tribe/my',
      method: 'GET',
      headers: { Authorization: token },
      timeout: API_TIMEOUT,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message === 'NOT_FOUND') {
      return null;
    } else {
      console.log(error.response ? error.response.data.message : error.message);
      return null;
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
      timeout: API_TIMEOUT,
    });
    
    if (data && data.success) {
      console.log('✅ Farm reward claimed successfully!'.green);
      return data;
    } else {
      console.error('❌ Farm claim failed: Unexpected response'.red);
      return null;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(`❌ Farm claim failed: ${error.response.data.message}`.red);
    } else {
      console.error(`❌ Error occurred during farm claim: ${error.message}`.red);
    }
    return null;
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
      timeout: API_TIMEOUT,
    });

    return data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message === 'same day') {
      console.error(
        `🚨 Daily claim failed because you already claim this day.`.red
      );
    } else {
      console.error(`🚨 Error occurred from daily claim: ${error.message}`.red);
    }
    return null;
  }
}

export async function startFarmingSession(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/farming/start',
    method: 'POST',
    headers: { Authorization: token },
    data: null,
    timeout: API_TIMEOUT,
  });
  return data;
}

export async function getTasks(token) {
  try {
    const { data } = await axios({
      url: 'https://game-domain.blum.codes/api/v1/tasks',
      method: 'GET',
      headers: { Authorization: token },
      timeout: API_TIMEOUT,
    });
    
    if (data && data[0] && data[0].subSections) {
      return data[0].subSections;
    } else {
      console.error('❌ Unexpected task data structure'.red);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching tasks: ${error.message}`.red);
    return [];
  }
}

export async function startTask(token, taskId, title) {
  try {
    const { data } = await axios({
      url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/start`,
      method: 'POST',
      headers: { Authorization: token },
      data: null,
      timeout: API_TIMEOUT,
    });
    
    console.log(`✅ Task "${title}" started successfully`.green);
    return data;
  } catch (error) {
    if (error.response && error.response.data) {
      if (error.response.data.message === 'Task type does not support start') {
        console.log(`ℹ️ Task "${title}" does not require starting`.yellow);
        return null;
      } else {
        console.error(`❌ Error starting task "${title}": ${error.response.data.message}`.red);
      }
    } else {
      console.error(`❌ Unexpected error starting task "${title}": ${error.message}`.red);
    }
    return null;
  }
}

export async function claimTaskReward(token, taskId, title) {
  try {
    const { data } = await axios({
      url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/claim`,
      method: 'POST',
      headers: { Authorization: token },
      data: null,
      timeout: API_TIMEOUT,
    });
    
    console.log(`✅ Reward for task "${title}" claimed successfully`.green);
    return data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(`❌ Error claiming reward for task "${title}": ${error.response.data.message}`.red);
    } else {
      console.error(`❌ Unexpected error claiming reward for task "${title}": ${error.message}`.red);
    }
    return null;
  }
}

export async function getGameId(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/game/play',
    method: 'POST',
    headers: { Authorization: token },
    data: null,
    timeout: API_TIMEOUT,
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
    timeout: API_TIMEOUT,
  });
  return data;
}
