export const PERMISSIONS = {
  ENGINE_MAIN_READ: "engine:main:read",
  ENGINE_SYSTEM_READ: "engine:system:read",
  NAVIGATION_READ: "navigation:read",
  CHART_READ: "chart:read",
  ALARM_EVENT_READ: "alarm:event:read",
  ALARM_EVENT_ACK: "alarm:event:ack",
  ALARM_EVENT_RESET: "alarm:event:reset",
  TREND_READ: "trend:read",
  TREND_EXPORT: "trend:export",
  CONFIG_POINT_TABLE_READ: "config:point-table:read",
  CONFIG_POINT_TABLE_UPDATE: "config:point-table:update",
  CONFIG_POINT_TABLE_IMPORT: "config:point-table:import",
  CONFIG_POINT_TABLE_EXPORT: "config:point-table:export",
  CONFIG_POINT_TABLE_VALIDATE: "config:point-table:validate",
  CONFIG_POINT_TABLE_APPLY: "config:point-table:apply",
  CONFIG_POINT_TABLE_ROLLBACK: "config:point-table:rollback",
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DISABLE: "user:disable",
  USER_PASSWORD_RESET: "user:password-reset",
  ROLE_READ: "role:read",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  INGEST_TELEMETRY_WRITE: "ingest:telemetry:write",
  INGEST_BATCH_READ: "ingest:batch:read",
  QUALITY_READ: "quality:read",
  REPORT_READ: "report:read",
  REPORT_CREATE: "report:create",
  REPORT_EXPORT: "report:export",
  AUDIT_READ: "audit:read",
  AUDIT_EXPORT: "audit:export",
};

export const LEGACY_PERMISSION_ALIASES = {
  "engine:read": [
    PERMISSIONS.ENGINE_MAIN_READ,
    PERMISSIONS.ENGINE_SYSTEM_READ,
    PERMISSIONS.NAVIGATION_READ,
    PERMISSIONS.CHART_READ,
  ],
  "alarm:read": [PERMISSIONS.ALARM_EVENT_READ],
  "alarm:write": [PERMISSIONS.ALARM_EVENT_ACK, PERMISSIONS.ALARM_EVENT_RESET],
  "trend:read": [PERMISSIONS.TREND_READ],
  "ingest:write": [
    PERMISSIONS.CONFIG_POINT_TABLE_READ,
    PERMISSIONS.CONFIG_POINT_TABLE_UPDATE,
    PERMISSIONS.CONFIG_POINT_TABLE_IMPORT,
    PERMISSIONS.CONFIG_POINT_TABLE_EXPORT,
    PERMISSIONS.CONFIG_POINT_TABLE_VALIDATE,
    PERMISSIONS.CONFIG_POINT_TABLE_APPLY,
    PERMISSIONS.CONFIG_POINT_TABLE_ROLLBACK,
    PERMISSIONS.INGEST_TELEMETRY_WRITE,
  ],
  "user:read": [PERMISSIONS.USER_READ, PERMISSIONS.ROLE_READ],
  "user:write": [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DISABLE,
    PERMISSIONS.USER_PASSWORD_RESET,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
  ],
  "report:write": [PERMISSIONS.REPORT_CREATE, PERMISSIONS.REPORT_EXPORT],
};

export const expandPermissions = (permissions = []) => {
  const expanded = new Set(permissions);
  permissions.forEach((permission) => {
    (LEGACY_PERMISSION_ALIASES[permission] || []).forEach((alias) => expanded.add(alias));
  });
  return Array.from(expanded);
};

export const hasPermissionInSet = (permissions = [], permission) => {
  if (!permission) return true;
  return expandPermissions(permissions).includes(permission);
};

export const hasAnyPermissionInSet = (permissions = [], required = []) =>
  required.some((permission) => hasPermissionInSet(permissions, permission));

export const ACCESS_GROUPS = [
  {
    key: "monitoring",
    name: "监控页面",
    permissions: [
      [PERMISSIONS.ENGINE_MAIN_READ, "主机页面查看"],
      [PERMISSIONS.ENGINE_SYSTEM_READ, "机舱系统页面查看"],
      [PERMISSIONS.NAVIGATION_READ, "导航页面查看"],
      [PERMISSIONS.CHART_READ, "海图页面查看"],
    ],
  },
  {
    key: "alarm",
    name: "报警处置",
    permissions: [
      [PERMISSIONS.ALARM_EVENT_READ, "报警事件查看"],
      [PERMISSIONS.ALARM_EVENT_ACK, "报警确认"],
      [PERMISSIONS.ALARM_EVENT_RESET, "报警复位"],
    ],
  },
  {
    key: "trend",
    name: "趋势与数据",
    permissions: [
      [PERMISSIONS.TREND_READ, "趋势查询"],
      [PERMISSIONS.TREND_EXPORT, "趋势导出"],
      [PERMISSIONS.QUALITY_READ, "数据质量查看"],
    ],
  },
  {
    key: "config",
    name: "采集配置",
    permissions: [
      [PERMISSIONS.CONFIG_POINT_TABLE_READ, "点表查看"],
      [PERMISSIONS.CONFIG_POINT_TABLE_UPDATE, "点表编辑"],
      [PERMISSIONS.CONFIG_POINT_TABLE_IMPORT, "点表导入"],
      [PERMISSIONS.CONFIG_POINT_TABLE_EXPORT, "点表导出"],
      [PERMISSIONS.CONFIG_POINT_TABLE_VALIDATE, "点表校验"],
      [PERMISSIONS.CONFIG_POINT_TABLE_APPLY, "点表应用"],
      [PERMISSIONS.CONFIG_POINT_TABLE_ROLLBACK, "点表回滚"],
      [PERMISSIONS.INGEST_TELEMETRY_WRITE, "遥测数据接入"],
      [PERMISSIONS.INGEST_BATCH_READ, "接入批次查看"],
    ],
  },
  {
    key: "access",
    name: "用户角色",
    permissions: [
      [PERMISSIONS.USER_READ, "用户查看"],
      [PERMISSIONS.USER_CREATE, "用户创建"],
      [PERMISSIONS.USER_UPDATE, "用户编辑"],
      [PERMISSIONS.USER_DISABLE, "用户停用"],
      [PERMISSIONS.USER_PASSWORD_RESET, "重置用户密码"],
      [PERMISSIONS.ROLE_READ, "角色查看"],
      [PERMISSIONS.ROLE_CREATE, "角色创建"],
      [PERMISSIONS.ROLE_UPDATE, "角色编辑"],
      [PERMISSIONS.ROLE_DELETE, "角色删除"],
    ],
  },
  {
    key: "reportAudit",
    name: "报告审计",
    permissions: [
      [PERMISSIONS.REPORT_READ, "报告查看"],
      [PERMISSIONS.REPORT_CREATE, "报告创建"],
      [PERMISSIONS.REPORT_EXPORT, "报告导出"],
      [PERMISSIONS.AUDIT_READ, "审计日志查看"],
      [PERMISSIONS.AUDIT_EXPORT, "审计日志导出"],
    ],
  },
];

export const permissionLabel = (permissionCode, fallback = "") => {
  for (const group of ACCESS_GROUPS) {
    const item = group.permissions.find(([code]) => code === permissionCode);
    if (item) return item[1];
  }
  return fallback || permissionCode;
};
