-- =============================================
-- Base de datos: nc_erp
-- Tablas necesarias para auth y audit
-- =============================================

-- Tabla de usuarios (auth)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usuarios')
BEGIN
    CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        usuario VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(200) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'user',
        activo BIT NOT NULL DEFAULT 1,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Tabla de auditoría (audit)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'auditoria')
BEGIN
    CREATE TABLE auditoria (
        id INT IDENTITY(1,1) PRIMARY KEY,
        accion VARCHAR(100) NOT NULL,
        modulo VARCHAR(100) NULL,
        detalle NVARCHAR(MAX) NULL,
        usuario_id INT NULL,
        usuario_nombre VARCHAR(200) NULL,
        ip VARCHAR(50) NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_auditoria_fecha ON auditoria(fecha DESC);
    CREATE INDEX IX_auditoria_modulo ON auditoria(modulo);
    CREATE INDEX IX_auditoria_usuario ON auditoria(usuario_id);
END
GO
