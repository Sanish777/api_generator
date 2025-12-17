#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const generate = require('./index');

program
  .name('api-generator')
  .description('Generate MySQL stored procedures and JavaScript API functions')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate stored procedure and API function from natural language prompt')
  .option('-p, --prompt <prompt>', 'Natural language description of what to generate', '')
  .action(async (options) => {
    if (!options.prompt) {
      console.error('Error: --prompt is required');
      process.exit(1);
    }

      await generate(options.prompt);
    try {
      console.log('✓ Generation complete! Check the /generated directory.');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();

