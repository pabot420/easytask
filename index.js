import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import moment from 'moment';
import colors from 'colors';
import { fileURLToPath } from 'url';
import os from 'os';
import { execSync } from 'child_process';
import axios from 'axios';
import figlet from 'figlet';
import chalk from 'chalk';
import gradient from 'gradient-string';
import cliProgress from 'cli-progress';
import pkg from 'terminal-kit';
const { terminal: terminalKit } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENCRYPTION_KEY = crypto.scryptSync(os.hostname() + os.userInfo().username, 'salt', 32);
const ALGORITHM = 'aes-256-gcm';

const whiteBoxAES = (input, key) => {
    const obfuscatedOperation = (byte, index) => {
        let result = byte;
        for (let i = 0; i < key.length; i++) {
            result ^= key[(index + i) % key.length];
            result = (result << 1) | (result >>> 7); // Rotate left
        }
        return result;
    };

    return Buffer.from(input).map(obfuscatedOperation);
};

const secureEncrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return whiteBoxAES(Buffer.from(iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex'), 'utf8'), ENCRYPTION_KEY).toString('base64');
};

const secureDecrypt = (encryptedText) => {
    const deobfuscated = whiteBoxAES(Buffer.from(encryptedText, 'base64'), ENCRYPTION_KEY).toString('utf8');
    const [ivHex, encryptedHex, tagHex] = deobfuscated.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedBuffer, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const getHardwareFingerprint = () => {
    let fingerprint = '';
    
    try {
        if (process.platform === 'win32') {
            fingerprint = execSync('wmic csproduct get uuid').toString().split('\n')[1].trim();
        } else if (process.platform === 'darwin') {
            fingerprint = execSync('ioreg -rd1 -c IOPlatformExpertDevice | awk \'/IOPlatformUUID/ { split($0, line, "\\""); printf("%s\\n", line[4]); }\'').toString().trim();
        } else if (process.platform === 'linux') {
            fingerprint = execSync('cat /var/lib/dbus/machine-id || cat /etc/machine-id').toString().trim();
        }
    } catch (error) {
        console.error('Error getting hardware fingerprint:', error);
    }
    
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

const SECURE_STORAGE_FILE = path.join(__dirname, '.secure_storage');

const readSecureStorage = () => {
    if (!fs.existsSync(SECURE_STORAGE_FILE)) {
        console.log(`Secure storage file does not exist at ${SECURE_STORAGE_FILE}`);
        return null;
    }
    const encryptedData = fs.readFileSync(SECURE_STORAGE_FILE, 'utf8');
    try {
        return JSON.parse(secureDecrypt(encryptedData));
    } catch (error) {
        console.error('Error reading secure storage:', error);
        return null;
    }
};

const writeSecureStorage = (data) => {
    try {
        const encryptedData = secureEncrypt(JSON.stringify(data));
        fs.writeFileSync(SECURE_STORAGE_FILE, encryptedData);
        console.log(`Secure storage file written at ${SECURE_STORAGE_FILE}`);
    } catch (error) {
        console.error('Error writing secure storage:', error);
    }
};

const EXPIRATION_DAYS = 3;

const detectDebugger = () => {
    const startTime = new Date();
    debugger;
    const endTime = new Date();
    return endTime - startTime > 100;
};

const checkIntegrity = () => {
    const expectedChecksum = "pre-calculated-checksum";
    const actualChecksum = crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
    return expectedChecksum === actualChecksum;
};

const checkExpiration = () => {
    try {
        if (detectDebugger() || !checkIntegrity()) {
            console.log(colors.red('Terdeteksi upaya peretasan. Aplikasi dihentikan.'));
            process.exit(1);
        }

        const currentFingerprint = getHardwareFingerprint();
        const storage = readSecureStorage();

        if (!storage || storage.fingerprint !== currentFingerprint) {
            const newStorage = {
                fingerprint: currentFingerprint,
                firstRunDate: Date.now(),
                runCount: 0
            };
            writeSecureStorage(newStorage);
            return true; 
        }

        storage.runCount++;
        writeSecureStorage(storage);

        const daysSinceFirstRun = (Date.now() - storage.firstRunDate) / (1000 * 60 * 60 * 24);

        if (daysSinceFirstRun > EXPIRATION_DAYS) {
            console.log(colors.red('Masa berlaku aplikasi sudah habis. Silakan hubungi pengembang.'));
            return false;
        }

        return true;
    } catch (error) {
        console.error(colors.red(`Error checking expiration: ${error.message}`));
        process.exit(1); 
    }
};

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
      const randomPoints = Math.floor(Math.random() * (275 - 180 + 1)) + 150; // Random points between 150 and 275
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
  let token = await getToken(queryId); // Assuming getToken is an async function

  if (!token) {
    console.error(chalk.red('✖ [ERROR] Token is undefined! Skipping this account.'));
    return;
  }

  try {
    const maxRetries = 3;

    displayTaskProgress(taskBar, 'Claiming Farm');
    await retryAction(() => claimFarmReward(token), maxRetries);
    
    displayTaskProgress(taskBar, 'Farming Session');
    await retryAction(() => startFarmingSession(token), maxRetries);

    displayTaskProgress(taskBar, 'Auto Tasks');
    await retryAction(() => completeTasks(token), maxRetries);
    
    displayTaskProgress(taskBar, 'Daily Reward');
    await retryAction(() => claimDailyReward(token), maxRetries);
    
    displayTaskProgress(taskBar, 'Game Points');
    await retryAction(() => claimGamePoints(token), maxRetries); 

    return { success: true, queryId };
  } catch (error) {
    console.error(chalk.red(`✖ [FAILURE] Error occurred for token: ${token} - ${error.message}`));
    return { success: false, queryId, error: error.message };
  }
};

const runScriptForAllAccounts = async () => {

  if (!checkExpiration()) {
    console.log(chalk.red('Aplikasi tidak valid atau masa berlaku telah habis.'));
    process.exit(1);
  }

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
