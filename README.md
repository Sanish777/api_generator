    # API Generator

A Node.js CLI tool that generates MySQL stored procedures and JavaScript API functions from natural language prompts. The tool connects to your database, analyzes table schemas, and uses AI to generate production-ready code.

## Features

- 🤖 **AI-Powered Generation**: Uses OpenAI to generate code based on natural language prompts
- 🗄️ **Database Integration**: Automatically fetches table schemas from your MySQL database
- 📄 **Dual Output**: Generates both SQL stored procedures and JavaScript API functions
- 🔄 **Pagination Support**: Built-in pagination support for all generated APIs
- ✅ **Production Ready**: Generates complete, working code with error handling

## Prerequisites

- Node.js (v14 or higher)
- MySQL database (LAMPP/XAMPP or standalone)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   DB_PORT=3306

   # OpenAI API Configuration
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   ```

## Usage

### Basic Command

Generate API code from a natural language prompt:

```bash
node cli.js generate --prompt "Get all users with pagination"
```

### Examples

**Get all records with pagination:**
```bash
node cli.js generate --prompt "Get all products with pagination"
```

**Get filtered records:**
```bash
node cli.js generate --prompt "Get all active users with pagination"
```

**Get specific table:**
```bash
node cli.js generate --prompt "Get all orders from orders table with pagination"
```

## Generated Files

The tool generates two files in the `/generated` directory:

1. **SQL Stored Procedure** (`sp_get_<table>.sql`)
   - MySQL stored procedure with pagination
   - Error handling
   - Returns total count and paginated results

2. **JavaScript API Function** (`get<Table>.js`)
   - Async/await function
   - Database connection using environment variables
   - Returns JSON response with data and pagination info

## Running Generated Files

### 1. Execute SQL Stored Procedure

First, create the stored procedure in your database:

```bash
mysql -u root -p your_database < generated/sp_get_users.sql
```

Or using MySQL command line:
```sql
mysql> USE your_database;
mysql> SOURCE generated/sp_get_users.sql;
```

### 2. Use JavaScript API Function

Create a test file to use the generated API:

**test-api.js:**
```javascript
const { getUsers } = require('./generated/getUsers');

async function test() {
    try {
        const result = await getUsers(1, 10); // page 1, limit 10
        
        if (result.success) {
            console.log('Users:', result.data.users);
            console.log('Pagination:', result.data.pagination);
        } else {
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('Failed:', error);
    }
}

test();
```

Run the test:
```bash
node test-api.js
```

### 3. Use in Your Application

Import and use the generated function in your application:

```javascript
const { getUsers } = require('./generated/getUsers');

// In your route handler or API endpoint
app.get('/api/users', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await getUsers(page, limit);
    
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});
```

## Response Format

The generated JavaScript functions return a consistent JSON format:

```json
{
    "success": true,
    "data": {
        "users": [
            {
                "id": 1,
                "username": "john_doe",
                "email": "john@example.com",
                "created_at": "2024-01-01T00:00:00.000Z"
            }
        ],
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

On error:
```json
{
    "success": false,
    "data": null,
    "error": "Error message here"
}
```

## Project Structure

```
api_generator/
├── agent.md              # AI generation rules
├── cli.js                # CLI entry point
├── index.js              # Main generator logic
├── package.json          # Dependencies
├── .env.example          # Environment variables template
├── templates/            # Code templates
│   ├── api.js.tpl        # JavaScript API template
│   └── procedure.sql.tpl # SQL procedure template
└── generated/            # Generated files (created automatically)
    ├── sp_get_*.sql      # SQL stored procedures
    └── get*.js           # JavaScript API functions
```

## Troubleshooting

### Database Connection Error
- Verify your database credentials in `.env`
- Ensure MySQL server is running
- Check if the database exists
- Verify network connectivity to database host

### Table Not Found
- Make sure the table name in your prompt matches an existing table
- Check table name spelling (case-sensitive in some MySQL configurations)
- Verify you're connected to the correct database

### OpenAI API Error
- Verify your `OPENAI_API_KEY` is correct
- Check your OpenAI account has available credits
- Ensure you have internet connectivity

### Generated Code Issues
- Review the generated files in `/generated` directory
- Check that the stored procedure was created successfully
- Verify table columns match the generated SQL

## Tips

1. **Be Specific**: Include the table name in your prompt for better results
   - ✅ "Get all users with pagination"
   - ❌ "Get all with pagination"

2. **Table Names**: The tool automatically detects table names, but you can be explicit
   - "Get all records from products table with pagination"

3. **Review Generated Code**: Always review the generated code before using in production

4. **Customize**: You can edit the generated files to add custom logic or filters

## License

ISC

## Support

For issues or questions, please check:
- Database connection settings
- OpenAI API key validity
- Table schema accessibility
- Generated code syntax

