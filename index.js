import dotenv from 'dotenv';
dotenv.config();

import colors from 'colors';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import axios from 'axios';
import figlet from 'figlet';
import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';
import boxen from 'boxen';
import cliProgress from 'cli-progress';
import pkg from 'terminal-kit';
const { terminal: terminalKit } = pkg;

import { delay } from './src/utils.js';

import {
  getToken,
  getUsername,
  getBalance,
  getTribe,
  claimFarmReward,
  startFarmingSession,
  getTasks,
  claimTaskReward,
  getGameId,
  claimGamePoints,
  startTask,
  claimDailyReward,
} from './src/api.js';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const TOKEN_FILE_PATH = './path/to/your/project/directory/accessTokens.txt';

const accountTokens = [
  process.env.QUERY_ID1,
  process.env.QUERY_ID2,
  process.env.QUERY_ID3,
  process.env.QUERY_ID4,
  process.env.QUERY_ID5,
  process.env.QUERY_ID6,
  process.env.QUERY_ID7,
  process.env.QUERY_ID8,
  process.env.QUERY_ID9,
  process.env.QUERY_ID10,
  process.env.QUERY_ID11,
  process.env.QUERY_ID12,
  process.env.QUERY_ID13,
  process.env.QUERY_ID14,
  process.env.QUERY_ID15,
  process.env.QUERY_ID16,
  process.env.QUERY_ID17,
  process.env.QUERY_ID18,
  process.env.QUERY_ID19,
];

const displayHeader = () => {
  console.clear();
  terminalKit.fullscreen();
  
  const title = gradient('cyan', 'magenta').multiline(figlet.textSync('BLUM BOT', {
    font: 'ANSI Shadow',
    horizontalLayout: 'fitted',
    verticalLayout: 'fitted',
  }));

  terminalKit.moveTo(1, 1);
  terminalKit(title);

  const subTitle = chalk.cyan('🌌 Advanced Multi-Account Airdrop System v2.0');
  terminalKit.moveTo(Math.floor((process.stdout.columns - subTitle.length) / 2), title.split('\n').length + 2);
  terminalKit(subTitle + '\n\n');

  const connInfo = chalk.magenta('📡 Secure Channel: t.me/slyntherinnn');
  terminalKit.moveTo(Math.floor((process.stdout.columns - connInfo.length) / 2), terminalKit.height - 2);
  terminalKit(connInfo);
};

const initializeProgressBars = (total) => {
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {percentage}% | {value}/{total} Accounts',
  }, cliProgress.Presets.shades_grey);

  const overallBar = multibar.create(total, 0, { title: chalk.cyan('Overall Progress') });
  const taskBar = multibar.create(5, 0, { title: chalk.yellow('Current Task   ') });

  return { multibar, overallBar, taskBar };
};

const displayTaskProgress = (taskBar, taskName) => {
  taskBar.update(0, { title: chalk.yellow(`${taskName.padEnd(15)}`) });
  for (let i = 0; i <= 5; i++) {
    setTimeout(() => taskBar.update(i), i * 200);
  }
};

const displaySummary = (results) => {
  terminalKit.clear();
  terminalKit.moveTo(1, 1);

  const summaryTitle = gradient('gold', 'yellow').multiline(figlet.textSync('MISSION REPORT', {
    font: 'Small',
    horizontalLayout: 'fitted',
  }));
  terminalKit(summaryTitle + '\n\n');

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  terminalKit.table(
    [
      ['Status', 'Count', 'Percentage'],
      ['Success', successCount, `${((successCount / results.length) * 100).toFixed(2)}%`],
      ['Fail', failCount, `${((failCount / results.length) * 100).toFixed(2)}%`]
    ],
    {
      hasBorder: true,
      contentHasMarkup: true,
      borderChars: 'lightRounded',
      borderAttr: { color: 'cyan' },
      width: 60,
      fit: true
    }
  );

  terminalKit.moveTo(1, terminalKit.height - 3);
  terminalKit(gradient.passion(`🎉 Mission Complete: ${successCount}/${results.length} accounts successfully processed!`));
};

const getTokenAndSave = async (queryId) => {
  const token = await getToken(queryId);
  if (token) {
    fs.writeFileSync(TOKEN_FILE_PATH, token);
    console.log('✅ New token has been saved.');
  }
  return token;
};

const handleApiError = async (error, retryCount = 0) => {
  const maxRetries = 3;

  if (error.response && error.response.data) {
    const message = error.response.data.message;

    if (message === `It's too early to claim`) {
      console.error(`🚨 Claim failed! It's too early to claim.`.red);
    } else if (message === 'Need to start farm') {
      console.error(`🚨 Claim failed! You need to start farm first.`.red);
    } else if (message === 'Need to claim farm') {
      console.error(`🚨 Claim failed! You need to claim farm first.`.red);
    } else if (message === 'Token expired') {
      console.error(`🚨 Token expired! Refreshing the token...`.red);
      await delay(3000);
      const newToken = await getTokenAndSave();
      return newToken;
    } else if (error.response.status === 520) {
      console.error(`🚨 Error 520: Cloudflare issue detected. Retrying... (${retryCount + 1}/${maxRetries})`.yellow);
      if (retryCount < maxRetries) {
        await delay(5000);  // Jeda 5 detik sebelum mencoba ulang
        return retryCount + 1;  // Tambahkan retry counter
      } else {
        console.error(`❌ Gagal setelah ${maxRetries} kali mencoba.`.red);
        return null;
      }
    } else {
      console.error(`🚨 An unexpected error occurred: ${message}`.red);
    }
  } else {
    console.error(`🚨 An unexpected error occurred: ${error.message}`.red);
  }

  return null;
};

const performActionWithRetry = async (action, token, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action(token);  // Pass token to action
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('🚨 Token expired or unauthorized. Please check your token.'.red);
        break;  // Stop retrying if token is unauthorized
      }
      if (i === maxRetries - 1) throw error;  // If max retries reached, throw error
      console.log(`Retrying... (${i + 1}/${maxRetries})`.yellow);
      await delay(5000);  // Tambahkan delay antar percobaan
    }
  }
};

const retryAction = async (action, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      console.log(`❌ Error: ${error.message} (Retry ${i + 1}/${maxRetries})`.yellow);
      if (i === maxRetries - 1) throw error; // Stop retrying if max retries reached
      await delay(3000); // Delay between retries
    }
  }
};

const claimFarmRewardSafely = async (token) => {
  try {
    console.log('🌾 Claiming farm reward...'.yellow);
    await performActionWithRetry(claimFarmReward, token);
    console.log('✅ Farm reward claimed successfully!'.green);
  } catch (error) {
    console.log(`❌ Failed to claim farm reward: ${error.message}`.red);
  }
};

const startFarmingSessionSafely = async (token) => {
  try {
    console.log('🚜 Starting farming session...'.yellow);
    const farmingSession = await performActionWithRetry(startFarmingSession, token);
    const farmStartTime = moment(farmingSession.startTime).format('MMMM Do YYYY, h:mm:ss A');
    const farmEndTime = moment(farmingSession.endTime).format('MMMM Do YYYY, h:mm:ss A');
    console.log(`✅ Farming session started!`.green);
    console.log(`⏰ Start time: ${farmStartTime}`);
    console.log(`⏳ End time: ${farmEndTime}`);
  } catch (error) {
    console.log(`❌ Failed to start farming session: ${error.message}`.red);
  }
};

const completeTasksSafely = async (token) => {
  try {
    console.log('✅ Auto completing tasks...'.yellow);
    const tasksData = await performActionWithRetry(getTasks, token);
    for (const category of tasksData) {
      for (const task of category.tasks) {
        try {
          console.log(`Processing task: ${task.title} (Status: ${task.status})`.cyan);
          
          if (task.status === 'NOT_STARTED') {
            await performActionWithRetry(() => startTask(token, task.id, task.title));
            console.log(`Started task: ${task.title}`.green);
            // delay
            await delay(2000);
          }
          
          const updatedTask = await performActionWithRetry(() => getTaskStatus(token, task.id));
          
          if (updatedTask.status === 'STARTED' || updatedTask.status === 'READY_FOR_CLAIM') {
            await performActionWithRetry(() => claimTaskReward(token, task.id));
            console.log(`Claimed reward for task: ${task.title}`.green);
          } else if (updatedTask.status === 'COMPLETED') {
            console.log(`Task already completed: ${task.title}`.yellow);
          } else {
            console.log(`Unable to claim reward for task: ${task.title} (Status: ${updatedTask.status})`.yellow);
          }
          
          await delay(3000);
        } catch (error) {
          console.log(`Failed to process task ${task.title}: ${error.message}`.red);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Failed to complete tasks: ${error.message}`.red);
  }
};

const getTaskStatus = async (token, taskId) => {
  const response = await axios.get(`https://api-domain.blum.codes/api/v1/tasks/${taskId}`, {
    headers: { Authorization: token }
  });
  return response.data;
};

const claimDailyRewardSafely = async (token) => {
  try {
    console.log('✨ Claiming daily reward...'.yellow);
    await performActionWithRetry(claimDailyReward, token);
    console.log('✅ Daily reward claimed successfully!'.green);
  } catch (error) {
    console.log(`❌ Failed to claim daily reward: ${error.message}`.red);
  }
};

const playAndClaimGame = async (token, points, iteration) => {
  console.log(`🆔 Starting game ${iteration}...`.cyan);

  try {
    let playResponse = await axios.post('https://game-domain.blum.codes/api/v1/game/play', null, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });

    let gameId = playResponse.data.gameId;
    console.log(`Game ID: ${gameId} (Iteration ${iteration})`.cyan);

    console.log(`⏳ Waiting for 32 seconds... (Iteration ${iteration})`.yellow);
    await delay(32000);

    let claimResponse = await axios.post(
      'https://game-domain.blum.codes/api/v1/game/claim',
      { gameId, points },
      { headers: { Authorization: token, 'Content-Type': 'application/json' } }
    );

    console.log(`✅ Successfully claimed ${points} points (Iteration ${iteration})`.green);
    return 'OK';
  } catch (error) {
    console.log(`❌ Failed to claim points for game ${iteration}: ${error.message}`.red);
    throw error;
  }
};

const claimGamePointsSafely = async (token) => {
  console.log('🎮 Starting game points claiming...'.cyan);

  try {
    const balanceResponse = await getBalance(token); // Get the balance to determine the available game chances
    const gameChances = balanceResponse.playPasses;
    console.log(`📊 You have ${gameChances} game chances available.`.cyan);

    let tasks = [];
    for (let i = 0; i < gameChances; i++) {
      const randomPoints = Math.floor(Math.random() * (275 - 150 + 1)) + 150; // Random points between 150 and 275
      tasks.push(playAndClaimGame(token, randomPoints, i + 1));
    }

    let results = await Promise.all(tasks); // Wait for all games to complete

    // Display results
    results.forEach((result, index) => {
      console.log(`Result of game ${index + 1}:`, result);
    });

    console.log('🏁 All games have been played.'.green);
  } catch (error) {
    console.log(`❌ Failed to process game points claiming: ${error.message}`.red);
  }
};

const processAccount = async (queryId, taskBar) => {
  let token = await getTokenAndSave(queryId);

  if (!token) {
    console.error(chalk.red('✖ [ERROR] Token is undefined! Skipping this account.'));
    return;
  }

  try {
    displayTaskProgress(taskBar, 'Claiming Farm');
    await claimFarmRewardSafely(token);
    
    displayTaskProgress(taskBar, 'Farming Session');
    await startFarmingSessionSafely(token);

    displayTaskProgress(taskBar, 'Auto Tasks');
    await completeTasksSafely(token);
    
    displayTaskProgress(taskBar, 'Daily Reward');
    await claimDailyRewardSafely(token);
    
    displayTaskProgress(taskBar, 'Game Points');
    await claimGamePointsSafely(token);

    await delay(10000); 
    return { success: true, queryId };
  } catch (error) {
    console.error(chalk.red(`✖ [FAILURE] Error occurred for token: ${token} - ${error.message}`));
    return { success: false, queryId, error: error.message };
  }
};

const runScriptForAllAccounts = async () => {
  displayHeader();

  const results = [];
  const total = accountTokens.length;
  const { multibar, overallBar, taskBar } = initializeProgressBars(total);

  for (let i = 0; i < accountTokens.length; i++) {
    const queryId = accountTokens[i];
    
    const result = await processAccount(queryId, taskBar);
    results.push(result);

    overallBar.update(i + 1);
  }

  multibar.stop();
  await delay(1000);
  displaySummary(results);
};

// Start the process
runScriptForAllAccounts();
