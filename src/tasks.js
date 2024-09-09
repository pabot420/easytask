import axios from 'axios';

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
