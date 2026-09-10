const exactMessages = {
  "username already exists": "用户名已存在",
  "cannot disable current user": "不能停用当前登录账号",
  "cannot remove current user's ADMIN role": "不能移除自己的管理员角色",
  "cannot disable or demote the last enabled admin": "系统必须保留至少一个启用的管理员",
  "at least one role is required": "请至少选择一个角色",
  "username must be 3 to 32 letters, digits, or underscores": "用户名需为 3-32 位字母、数字或下划线",
  "password must be 8 to 64 characters": "密码需为 8-64 位字符",
  "displayName must be 1 to 64 characters": "显示名需为 1-64 个字符",
  "oldPassword is incorrect": "旧密码错误",
  "user not found": "用户不存在",
  "role already exists": "角色编码已存在",
  "roleCode must be 2 to 32 uppercase letters, digits, or underscores": "角色编码需为 2-32 位，以字母开头，只能包含大写字母、数字或下划线",
  "roleName must be 1 to 64 characters": "角色名称需为 1-64 个字符",
  "at least one permission is required": "请至少勾选一个权限",
  "builtin role ADMIN cannot be modified or deleted": "内置管理员角色不可修改或删除",
  "role not found": "角色不存在",
  "permission denied": "当前账号无权限执行此操作",
  "invalid username or password": "用户名或密码错误",
};

export const getChineseApiError = (error, fallback = "操作失败，请稍后重试") => {
  const message = error?.payload?.message || error?.message || "";
  if (exactMessages[message]) return exactMessages[message];
  if (message.startsWith("unknown role:")) return "角色不存在，角色列表可能已经更新";
  if (message.startsWith("unknown permission:")) return "权限点不存在，请刷新权限列表";
  const inUse = message.match(/^role is still assigned to (\d+) user\(s\)$/);
  if (inUse) return `该角色仍被 ${inUse[1]} 个用户使用，请先调整用户角色`;
  if (error?.status === 401) return "登录已过期或账号已停用，请重新登录";
  if (error?.status === 403) return "当前账号无权限执行此操作";
  if (error?.status >= 500) return "后端服务异常，请稍后重试";
  return message || fallback;
};
