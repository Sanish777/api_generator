# AI Generation Rules for API Generator

## Purpose
Generate MySQL stored procedures and corresponding JavaScript API functions based on natural language prompts.

## Rules

### 1. Stored Procedure Generation
- Always use MySQL stored procedure syntax
- Include proper error handling with DECLARE HANDLER
- Use IN/OUT/INOUT parameters appropriately
- Support pagination when requested (LIMIT/OFFSET)
- Return result sets using SELECT statements
- Include proper parameter validation
- Use meaningful parameter names with "p_" prefix (e.g., p_page, p_limit, p_total)
- **CRITICAL: NEVER use reserved keywords like "limit", "page", "order", "table" as parameter names**
- Always use: IN p_page INT, IN p_limit INT, OUT p_total INT
- Use p_limit and p_page in LIMIT clause: LIMIT p_limit OFFSET (p_page - 1) * p_limit
- Add comments explaining the procedure purpose

### 2. JavaScript API Function Generation
- Use async/await syntax
- Use mysql2/promise for database connections
- Read database config from environment variables
- Handle errors gracefully with try/catch
- Return consistent response format: { success: boolean, data: any, error: string|null }
- Use connection pooling for production
- Close connections properly
- Support pagination parameters (page, limit)

### 3. Naming Conventions
- Stored procedures: `sp_<action>_<entity>` (e.g., `sp_get_users`)
- JavaScript functions: `get<Entity><Action>` (e.g., `getUsers`)
- Use camelCase for JavaScript
- Use snake_case for SQL

### 4. Code Quality
- Keep code simple and readable
- Add inline comments where necessary
- Follow MySQL best practices
- Follow JavaScript best practices
- Ensure deterministic output
- Make code reusable

### 5. Output Format
- Generate complete, working code
- No placeholders or TODOs
- Include all necessary imports/requires
- Include error handling
- Include parameter validation

### 6. Database Connection
- Use environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
- Support both MySQL and SQL Server (detect from config)
- Default to MySQL if not specified

### 7. Special Requirements
- Pagination: Always include page and limit parameters
- Filtering: Support WHERE clauses based on prompt
- Sorting: Support ORDER BY when appropriate
- Security: Use parameterized queries (stored procedures handle this)

### 8. JSON Structure for JavaScript Generation
- When generating JavaScript API functions, use the following JSON structure to represent table data:
  ```json
  {
    "table_name": "users",
    "columns": ["id", "username", "email", "created_at"],
    "primary_key": "id",
    "data_key": "users"
  }
  ```
- Use this JSON structure to:
  - Build the SELECT statement columns in the stored procedure
  - Determine the data key name in the JavaScript response object
  - Map table columns to JavaScript object properties
  - Generate appropriate function names based on table name
- The JavaScript function should return data in this format:
  ```json
  {
    "success": true,
    "data": {
      "<data_key>": [/* array of records */],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "totalPages": 10
      }
    },
    "error": null
  }
  ```
- Always extract table information from the prompt and create a JSON representation
- Use the JSON structure to generate both SQL and JavaScript code consistently

