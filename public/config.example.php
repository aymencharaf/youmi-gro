<?php
return [
  'host' => 'YOUR_MYSQL_HOST',
  'dbname' => 'YOUR_DATABASE_NAME',
  'user' => 'YOUR_DATABASE_USER',
  'pass' => 'YOUR_DATABASE_PASSWORD',
  // Set these once to create the first platform administrator.
  'admin_username' => 'aymen',
  'admin_password' => 'ay120012',
  'gemini_api_key' => 'OPTIONAL_GEMINI_API_KEY',

  // Multi-tenant database isolation. Enable only when your MySQL account can access
  // the vendor databases. On shared hosting, create each database first if CREATE DATABASE is blocked.
  'tenant_databases_enabled' => false,
  'tenant_db_host' => 'YOUR_MYSQL_HOST',
  'tenant_db_user' => 'YOUR_TENANT_DB_USER',
  'tenant_db_pass' => 'YOUR_TENANT_DB_PASSWORD',
  'tenant_db_prefix' => 'youmi_tenant_',
];
