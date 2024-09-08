const chalk = require('chalk');
const figlet = require('figlet');

function displayHeader() {
  console.clear();
  console.log(
    chalk.cyan(
      figlet.textSync('Blum Bot', { font: 'Big', horizontalLayout: 'full' })
    )
  );
  console.log(chalk.blue('▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄'));
  console.log(chalk.blue('█ Multi-Account Blum Airdrop Bot'));
  console.log(chalk.blue('█ t.me/slyntherinnn'));
  console.log(chalk.blue('▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀'));
  console.log();
}

module.exports = { displayHeader };