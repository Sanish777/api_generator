const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const OpenAI = require('openai');
require('dotenv').config();

/**
 * Connect to database and get table schema
 */
async function getTableSchema(tableName) {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    // Get column information
    const [columns] = await connection.execute(
      `SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME, tableName]
    );

    // Get primary key
    const [primaryKeys] = await connection.execute(
      `SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ? 
        AND CONSTRAINT_NAME = 'PRIMARY'`,
      [process.env.DB_NAME, tableName]
    );

    const primaryKey = primaryKeys.length > 0 ? primaryKeys[0].COLUMN_NAME : null;

    // Build JSON structure
    const tableJson = {
      table_name: tableName,
      columns: columns.map(col => ({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === 'YES',
        key: col.COLUMN_KEY,
        default: col.COLUMN_DEFAULT,
        extra: col.EXTRA
      })),
      primary_key: primaryKey,
      data_key: tableName.toLowerCase().replace(/_/g, '')
    };

    return tableJson;
  } catch (error) {
    throw new Error(`Failed to get table schema: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Extract table name from prompt
 */
function extractTableName(prompt) {
  // Simple extraction - look for common patterns
  const lowerPrompt = prompt.toLowerCase();
  
  // Look for "from <table>", "table <table>", etc. (highest priority)
  const fromPattern = /(?:from|table)\s+(\w+)/i;
  let match = prompt.match(fromPattern);
  if (match && match[1]) {
    return match[1];
  }
  
  // Look for "get all <table>", "fetch all <table>", etc.
  const allPattern = /(?:get|fetch|select|show)\s+all\s+(\w+)/i;
  match = prompt.match(allPattern);
  if (match && match[1]) {
    return match[1];
  }
  
  // Look for "get <table>", "fetch <table>", etc.
  const getPattern = /(?:get|fetch|select|show)\s+(\w+)/i;
  match = prompt.match(getPattern);
  if (match && match[1] && match[1].toLowerCase() !== 'all') {
    return match[1];
  }
  
  // Look for "<table> with pagination" or "<table> and pagination"
  const withPattern = /(\w+)\s+(?:with|and)\s+(?:pagination|limit)/i;
  match = prompt.match(withPattern);
  if (match && match[1] && match[1].toLowerCase() !== 'all') {
    return match[1];
  }
  
  // Look for "all <table>" pattern (lower priority to avoid matching "all" alone)
  const allSimplePattern = /\ball\s+(\w+)/i;
  match = prompt.match(allSimplePattern);
  if (match && match[1]) {
    return match[1];
  }

  // Default fallback
  return 'users';
}

/**
 * Call OpenAI API to generate code
 */
async function callAI(prompt, rules, tableSchema) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const systemPrompt = `You are a code generator that creates MySQL stored procedures and JavaScript API functions.

${rules}

Table Schema (JSON):
${JSON.stringify(tableSchema, null, 2)}

Generate code based on the user's prompt. Return ONLY valid JSON in this exact format:
{
  "procedure": {
    "name": "sp_get_<table_name>",
    "sql": "<complete SQL stored procedure code>"
  },
  "api": {
    "name": "get<TableName>",
    "js": "<complete JavaScript function code>"
  }
}

CRITICAL SQL REQUIREMENTS:
- Parameter names MUST use "p_" prefix: p_page, p_limit (NOT "page" or "limit" - these are reserved keywords)
- Use OUT parameter for total count: OUT p_total INT
- Procedure signature: CREATE PROCEDURE sp_get_<table>(IN p_page INT, IN p_limit INT, OUT p_total INT)
- MUST declare variable for offset: DECLARE v_offset INT DEFAULT 0;
- MUST calculate offset in variable: SET v_offset = (p_page - 1) * p_limit;
- NEVER use calculations directly in LIMIT clause - always use variable: LIMIT p_limit OFFSET v_offset
- Include parameter validation: IF p_page < 1 THEN SET p_page = 1; END IF; (same for p_limit)
- Get total count: SELECT COUNT(*) INTO p_total FROM <table>
- Return paginated data: SELECT ... FROM <table> ORDER BY <primary_key> LIMIT p_limit OFFSET v_offset
- Use DELIMITER $$ and DELIMITER ; for procedure definition
- Include proper error handling with DECLARE EXIT HANDLER FOR SQLEXCEPTION

JavaScript Requirements (MUST follow this exact pattern):
- Import: const mysql = require('mysql2/promise'); require('dotenv').config();
- Function signature: async function get<TableName>(page = 1, limit = 10)
- Connection: let connection; then createConnection with process.env variables
- Use connection.execute() (NOT query) for both CALL and SELECT
- Call procedure: const [results] = await connection.execute('CALL sp_get_<table>(?, ?, @total)', [page, limit]);
- Get total: const [totalResult] = await connection.execute('SELECT @total as total');
- Extract data: const data = results[0]; (first result set from stored procedure)
- Return format: { success: true, data: { <table_name>: data, pagination: { page, limit, total, totalPages } }, error: null }
- Error handling: try/catch returning { success: false, data: null, error: error.message }
- Finally block: if (connection) await connection.end();
- Export: module.exports = { get<TableName> };

Important:
- Use the actual table schema provided above
- Include all columns from the schema in the SELECT statement
- Generate complete, working code (no placeholders)
- Follow all rules from agent.md
- NEVER use "limit" or "page" as parameter names - always use p_limit and p_page`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const responseText = completion.choices[0].message.content;
    const response = JSON.parse(responseText);

    return response;
  } catch (error) {
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Read agent.md rules
 */
async function readAgentRules() {
  const rulesPath = path.join(__dirname, 'agent.md');
  const rules = await fs.readFile(rulesPath, 'utf-8');
  return rules;
}

/**
 * Read template file
 */
async function readTemplate(templateName) {
  const templatePath = path.join(__dirname, 'templates', templateName);
  const template = await fs.readFile(templatePath, 'utf-8');
  return template;
}

/**
 * Ensure generated directory exists
 */
async function ensureGeneratedDir() {
  const generatedPath = path.join(__dirname, 'generated');
  try {
    await fs.access(generatedPath);
  } catch {
    await fs.mkdir(generatedPath, { recursive: true });
  }
}

/**
 * Write generated file
 */
async function writeGeneratedFile(filename, content) {
  const generatedPath = path.join(__dirname, 'generated', filename);
  await fs.writeFile(generatedPath, content, 'utf-8');
}

/**
 * Main generator function
 * Uses agent.md rules to guide AI generation
 * Connects to database to get actual table schema
 * Uses OpenAI to generate code based on prompt and schema
 */
async function generate(prompt) {
  try {
    // Validate database credentials
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      throw new Error('Database credentials not set. Please check your .env file.');
    }

    // Read agent rules from agent.md
    const rules = await readAgentRules();
    
    // Extract table name from prompt
    const tableName = extractTableName(prompt);
    console.log(`📊 Detected table: ${tableName}`);
    
    // Get actual table schema from database
    console.log(`🔌 Connecting to database to get table schema...`);
    const tableSchema = await getTableSchema(tableName);
    console.log(`✓ Found ${tableSchema.columns.length} columns in ${tableName}`);
    
    // Call AI with prompt, rules, and actual table schema
    console.log(`🤖 Generating code with AI...`);
    const aiResponse = await callAI(prompt, rules, tableSchema);
    
    // Validate AI response
    if (!aiResponse.procedure || !aiResponse.api) {
      throw new Error('Invalid AI response format');
    }
    
    // Ensure generated directory exists
    await ensureGeneratedDir();
    
    // Generate procedure name from AI response
    const procedureName = aiResponse.procedure.name;
    const apiName = aiResponse.api.name;
    
    // Write SQL file
    const sqlFilename = `${procedureName}.sql`;
    await writeGeneratedFile(sqlFilename, aiResponse.procedure.sql);
    console.log(`✓ Generated: ${sqlFilename}`);
    
    // Write JavaScript file
    const jsFilename = `${apiName}.js`;
    await writeGeneratedFile(jsFilename, aiResponse.api.js);
    console.log(`✓ Generated: ${jsFilename}`);
    
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`);
  }
}

module.exports = generate;
