const placeholders = {
  postgresql: 'Host=127.0.0.1;Port=5432;Database=app;Username=postgres;Password=***',
  mysql: 'Server=127.0.0.1;Port=3306;Database=app;Uid=root;Pwd=***',
  sqlserver: 'Server=127.0.0.1;Database=app;User Id=sa;Password=***;TrustServerCertificate=True',
  sqlite: 'Data Source=C:\\data\\app.db'
}

export function getConnectionPlaceholder(dbType) {
  return placeholders[dbType] || placeholders.postgresql
}
