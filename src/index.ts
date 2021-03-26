import { program } from 'commander';
import commands from './util';

process.on('unhandledRejection', (error) => {
  if (program.verbose) {
    console.error(error);
  } else {
    console.error('use --verbose for more details');
  }
});

export function run(): void {
  program.version('0.0.1');
  try {
    program
      .name('airdropcli')
      .version('0.0.1')
      .option('-v,--verbose', 'Show verbose error logs')
      .description('Command-line interface for claiming ANC airdrop');
    program.addCommand(commands.exec_command);
    program.addCommand(commands.query);
    program.parse(process.argv);
  } catch (e) {
    console.log(e.message);
  }
}
