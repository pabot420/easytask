import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import moment from 'moment';
import colors from 'colors';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyFilePath = path.join(__dirname, '.keyfile');
let encryptionKey;

if (!fs.existsSync(keyFilePath)) {

  encryptionKey = crypto.randomBytes(32).toString('hex');
  
  fs.writeFileSync(keyFilePath, encryptionKey);
  console.log(`Generated and saved new ENCRYPTION_KEY in .keyfile: ${encryptionKey}`);
} else {

  encryptionKey = fs.readFileSync(keyFilePath, 'utf-8');
  console.log(`Using existing ENCRYPTION_KEY from .keyfile: ${encryptionKey}`);
}

const ENCRYPTION_KEY = Buffer.from(encryptionKey, 'hex');

const FIRST_RUN_FILE = path.join(__dirname, '.hidden_config');
const ALGORITHM = 'aes-256-cbc';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const result = iv.toString('hex') + ':' + encrypted.toString('hex');
  console.log('Encrypted:', result); // Debug
  return result;
};

const decrypt = (text) => {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    console.log('Decrypting with IV:', iv.toString('hex')); // Debug
    console.log('Encrypted text:', encryptedText.toString('hex')); // Debug

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error.message);
    process.exit(1);
  }
};

const checkSystemTime = (lastRunDate) => {
  const currentDate = moment();
  if (moment(lastRunDate).isAfter(currentDate)) {
    console.log(colors.red('Terdeteksi perubahan waktu sistem. Aplikasi dihentikan.'));
    process.exit(1); 
  }
};

const checkExpiry = () => {
  let firstRunDate;

  if (fs.existsSync(FIRST_RUN_FILE)) {
    const encryptedDate = fs.readFileSync(FIRST_RUN_FILE, 'utf-8');
    console.log('Reading encrypted date from file:', encryptedDate); // Debug
    firstRunDate = decrypt(encryptedDate);
  } else {
    firstRunDate = moment().format('YYYY-MM-DD');
    const encryptedDate = encrypt(firstRunDate);
    fs.writeFileSync(FIRST_RUN_FILE, encryptedDate);
    console.log('Creating new encrypted date:', encryptedDate); // Debug
  }

  const currentDate = moment();
  const runDate = moment(firstRunDate, 'YYYY-MM-DD');
  const diffDays = currentDate.diff(runDate, 'days');

  checkSystemTime(runDate);

  if (diffDays > 3) {
    console.log(colors.red('Masa berlaku aplikasi sudah habis. Silakan hubungi pengembang.'));
    process.exit(1);
  }
};

checkExpiry();


import axios from 'axios';
import figlet from 'figlet';
import chalk from 'chalk';
import gradient from 'gradient-string';
import cliProgress from 'cli-progress';
import pkg from 'terminal-kit';
const { terminal: terminalKit } = pkg;

import { delay } from './src/utils.js'; // Use ES module syntax for importing

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

const TOKEN_FILE_PATH = path.join(__dirname, 'accessTokens.txt');

const accountTokens = [
  process.env.QUERY_ID1,
  process.env.QUERY_ID2,
  process.env.QUERY_ID3,
  process.env.QUERY_ID4,
  process.env.QUERY_ID5  
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

const handleApiError = async (error) => {
  if (
    error.response &&
    error.response.data &&
    error.response.data.message === `It's too early to claim`
  ) {
    console.error(`🚨 Claim failed! It's too early to claim.`.red);
  } else if (
    error.response &&
    error.response.data &&
    error.response.data.message === 'Need to start farm'
  ) {
    console.error(`🚨 Claim failed! You need to start farm first.`.red);
  } else if (
    error.response &&
    error.response.data &&
    error.response.data.message === 'Need to claim farm'
  ) {
    console.error(`🚨 Claim failed! You need to claim farm first.`.red);
  } else if (
    error.response &&
    error.response.data &&
    error.response.data.message === 'Token expired'
  ) {
    console.error(`🚨 Token expired! Refreshing the token...`.red);
    await delay(3000);
    const newToken = await getTokenAndSave();
    return newToken;
  } else {
    if (error.response && error.response.data) {
      console.error(
        `🚨 An unexpected error occurred because of Cloudflare, please try again in a few minutes.`
          .red
      );
    } else {
      console.error(`🚨 An unexpected error occurred: ${error.message}`.red);
    }
  }
  return null;
};

const performActionWithRetry = async (action, token, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action(token);  
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('🚨 Token expired or unauthorized. Please check your token.'.red);
        break; 
      }
      if (i === maxRetries - 1) throw error;  
      console.log(`Retrying... (${i + 1}/${maxRetries})`.yellow);
      await delay(5000); 
    }
  }
};

const retryAction = async (action, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      console.log(`❌ Error: ${error.message} (Retry ${i + 1}/${maxRetries})`.yellow);
      if (i === maxRetries - 1) throw error;
      await delay(3000); 
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
          if (task.status === 'NOT_STARTED') {
            await performActionWithRetry(() => startTask(token, task.id, task.title));
            console.log(`Started task: ${task.title}`.green);
          }
          if (task.status === 'STARTED' || task.status === 'READY_FOR_CLAIM') {
            await performActionWithRetry(() => claimTaskReward(token, task.id));
            console.log(`Claimed reward for task: ${task.title}`.green);
          }
        } catch (error) {
          console.log(`Failed to process task ${task.title}: ${error.message}`.red);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Failed to complete tasks: ${error.message}`.red);
  }
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

const claimGamePointsSafely = async (token) => {
  console.log('🎮 Starting game points claiming...'.cyan);

  try {
    const balanceResponse = await getBalance(token); 
    const gameChances = balanceResponse.playPasses;
    console.log(`📊 You have ${gameChances} game chances available.`.cyan);

    let tasks = [];
    for (let i = 0; i < gameChances; i++) {
      const randomPoints = Math.floor(Math.random() * (275 - 150 + 1)) + 150; // Random points between 150 and 275
      tasks.push(playAndClaimGame(token, randomPoints, i + 1));
    }

    let results = await Promise.all(tasks); 

    results.forEach((result, index) => {
      console.log(`Result of game ${index + 1}:`, result);
    });

    console.log('🏁 All games have been played.'.green);
  } catch (error) {
    console.log(`❌ Failed to process game points claiming: ${error.message}`.red);
  }
};

const playAndClaimGame = async (token, points, iteration) => {
  console.log(`🆔 Starting game ${iteration}...`.cyan);

  return retryAction(async () => {
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
      throw new Error(`Failed to claim points for game ${iteration}: ${error.message}`);
    }
  });
};

const processAccount = async (queryId, taskBar) => {
  let token = await getTokenAndSave(queryId);

  if (!token) {
    console.error(chalk.red('✖ [ERROR] Token is undefined! Skipping this account.'));
    return;
  }

  try {
    const maxRetries = 3;

    displayTaskProgress(taskBar, 'Claiming Farm');
    await retryAction(() => claimFarmRewardSafely(token), maxRetries);
    
    displayTaskProgress(taskBar, 'Farming Session');
    await retryAction(() => startFarmingSessionSafely(token), maxRetries);

    displayTaskProgress(taskBar, 'Auto Tasks');
    await retryAction(() => completeTasksSafely(token), maxRetries);
    
    displayTaskProgress(taskBar, 'Daily Reward');
    await retryAction(() => claimDailyRewardSafely(token), maxRetries);
    
    displayTaskProgress(taskBar, 'Game Points');
    await retryAction(() => claimGamePointsSafely(token), maxRetries); 

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

  const failedAccounts = results.filter(r => !r.success);
  if (failedAccounts.length > 0) {
    console.log(chalk.red(`✖ ${failedAccounts.length} accounts failed:`));
    failedAccounts.forEach(acc => console.log(`- ${acc.queryId}: ${acc.error}`));
  }

  displaySummary(results);
};

runScriptForAllAccounts();
