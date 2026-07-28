# 1.1.1 CREATE / DROP / RENAME DATABASE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: In SQL, you manage databases with three core commands: `CREATE DATABASE` (to make a new one), `DROP DATABASE` (to permanently delete it), and `RENAME DATABASE` (to change its name, though support varies across database systems).

PostgreSQL and MySQL use `CREATE`/`DROP` directly, while SQL Server uses similar syntax but does not support `RENAME DATABASE` directly — instead you use `ALTER DATABASE`.

---

## 📌 CREATE DATABASE
- **Purpose:** Create a new database container to hold tables, views, and other objects.  
- **Syntax (MySQL/PostgreSQL):**
  ```sql
  CREATE DATABASE database_name;
  ```
- **Optional:**  
  - `CREATE DATABASE IF NOT EXISTS database_name;` → avoids error if it already exists.  
- **SQL Server:**  
  ```sql
  CREATE DATABASE database_name;
  ```

---

## 🗑️ DROP DATABASE
- **Purpose:** Permanently delete a database and all its objects.  
- **Syntax (MySQL/PostgreSQL):**
  ```sql
  DROP DATABASE database_name;
  ```
- **Safe form:**  
  ```sql
  DROP DATABASE IF EXISTS database_name;
  ```
- **SQL Server:**  
  ```sql
  DROP DATABASE database_name;
  ```

> [!WARNING]
> You cannot drop a database if you are currently connected to it. Always disconnect active sessions first.

---

## ✏️ RENAME DATABASE
- **MySQL:**  
  - Direct `RENAME DATABASE` is deprecated/unsupported. Instead, you must create a new database and move tables manually.  
- **PostgreSQL:**  
  ```sql
  ALTER DATABASE old_name RENAME TO new_name;
  ```
- **SQL Server:**  
  ```sql
  ALTER DATABASE old_name MODIFY NAME = new_name;
  ```

---

## 🔍 Example Workflow
```sql
-- Create a new database
CREATE DATABASE HR_DB;

-- Use the database
USE HR_DB;

-- Drop the database safely
DROP DATABASE IF EXISTS HR_DB;

-- Rename database (PostgreSQL)
ALTER DATABASE HR_DB RENAME TO HumanResources;
```

---

## ⚠️ Analyst Notes
- **Always double-check before DROP** — deletion is 100% irreversible.  
- **Renaming** is not universally supported; in MySQL, you must migrate objects manually.  
- **Permissions:** You need database administrator (DBA) privileges to create, drop, or rename databases.  

---

## ✅ Key Takeaways
- **CREATE DATABASE** → makes a new database.  
- **DROP DATABASE** → deletes it permanently.  
- **RENAME DATABASE** → supported in PostgreSQL/SQL Server, not in MySQL.  
- Use `IF EXISTS` / `IF NOT EXISTS` for safer operations.  
