import commander from 'commander';

import stanza from './generate/stanza.mjs';

const command = new commander.Command()
  .command('generate')
  .alias('g')
  .description('generate codes from templates')
  .addCommand(stanza);

export default command;
