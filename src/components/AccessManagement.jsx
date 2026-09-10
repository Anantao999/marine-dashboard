import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import {
  createRole,
  createUser,
  deleteRole,
  getUser,
  listPermissions,
  listRoles,
  listUsers,
  resetUserPassword,
  updateRole,
  updateUser,
} from "../api/accessManagementApi";
import { getChineseApiError } from "../api/errorMessages";
import { useAuth } from "../hooks/useAuth";
import { ACCESS_GROUPS, PERMISSIONS, permissionLabel } from "../auth/permissions";

const PAGE_SIZE = 20;

const Modal = ({ title, subtitle, onClose, children, width = "max-w-xl" }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onMouseDown={onClose}>
    <section
      className={`max-h-[90dvh] w-full ${width} overflow-y-auto rounded-lg bg-white shadow-2xl dark:bg-surface-container-lowest`}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-surface-container-lowest">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-on-surface">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" title="关闭">
          <X className="h-5 w-5" />
        </button>
      </header>
      {children}
    </section>
  </div>
);

const RoleSelector = ({ roles, selected, onChange }) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {roles.map((role) => {
      const checked = selected.includes(role.roleCode);
      return (
        <label key={role.roleCode} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${checked ? "border-[#4cd7d0] bg-[#effcfb]" : "border-slate-200"}`}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onChange(checked ? selected.filter((item) => item !== role.roleCode) : [...selected, role.roleCode])}
          />
          <span className="min-w-0">
            <span className="block text-xs font-black text-slate-800">{role.roleName}</span>
            <span className="block truncate font-mono text-[10px] text-slate-400">{role.roleCode}</span>
          </span>
        </label>
      );
    })}
  </div>
);

const UserForm = ({ user, roles, onClose, onSaved }) => {
  const editing = Boolean(user);
  const [form, setForm] = useState({
    username: user?.username || "",
    password: "",
    displayName: user?.displayName || "",
    enabled: user?.enabled ?? true,
    roles: user?.roles || [],
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!editing && !/^[A-Za-z0-9_]{3,32}$/.test(form.username)) return setError("用户名需为 3-32 位字母、数字或下划线");
    if (!editing && (form.password.length < 8 || form.password.length > 64)) return setError("密码需为 8-64 位字符");
    if (!form.displayName.trim() || form.displayName.trim().length > 64) return setError("显示名需为 1-64 个字符");
    if (!form.roles.length) return setError("请至少选择一个角色");

    setSubmitting(true);
    try {
      if (editing) {
        await updateUser(user.userId, { displayName: form.displayName.trim(), enabled: form.enabled, roles: form.roles });
      } else {
        await createUser({ username: form.username.trim(), password: form.password, displayName: form.displayName.trim(), roles: form.roles });
      }
      onSaved();
      onClose();
    } catch (requestError) {
      setError(getChineseApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editing ? "编辑用户" : "新建用户"} subtitle={editing ? `用户账号：${user.username}` : "创建后该账号即可登录系统"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5">
        {!editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600">用户名<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#4cd7d0]" /></label>
            <label className="text-xs font-bold text-slate-600">初始密码<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#4cd7d0]" /></label>
          </div>
        )}
        <label className="block text-xs font-bold text-slate-600">显示名称<input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#4cd7d0]" /></label>
        {editing && (
          <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
            账号状态
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4" />
          </label>
        )}
        <div><p className="mb-2 text-xs font-bold text-slate-600">分配角色</p><RoleSelector roles={roles} selected={form.roles} onChange={(next) => setForm({ ...form, roles: next })} /></div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="h-10 px-4 text-xs font-bold text-slate-500">取消</button><button disabled={submitting} className="h-10 rounded-md bg-[#1a1b1f] px-5 text-xs font-bold text-white disabled:opacity-50">{submitting ? "保存中..." : "保存"}</button></div>
      </form>
    </Modal>
  );
};

const PasswordReset = ({ user, onClose, onSaved }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8 || password.length > 64) return setError("新密码需为 8-64 位字符");
    setSubmitting(true);
    try {
      await resetUserPassword(user.userId, password);
      onSaved("密码已重置");
      onClose();
    } catch (requestError) {
      setError(getChineseApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal title="重置用户密码" subtitle={`目标账号：${user.username}`} onClose={onClose} width="max-w-md"><form onSubmit={submit} className="space-y-4 p-5"><label className="block text-xs font-bold text-slate-600">新密码<input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#4cd7d0]" /></label>{error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="h-10 px-4 text-xs font-bold text-slate-500">取消</button><button disabled={submitting} className="h-10 rounded-md bg-[#1a1b1f] px-5 text-xs font-bold text-white disabled:opacity-50">确认重置</button></div></form></Modal>;
};

const RoleForm = ({ role, permissions, onClose, onSaved }) => {
  const editing = Boolean(role);
  const [form, setForm] = useState({ roleCode: role?.roleCode || "", roleName: role?.roleName || "", permCodes: role?.permissions?.map((item) => item.permCode) || [] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supportedCodes = useMemo(() => new Set(permissions.map((item) => item.permCode)), [permissions]);
  const plannedCodes = useMemo(() => new Set(ACCESS_GROUPS.flatMap((group) => group.permissions.map(([code]) => code))), []);
  const permissionGroups = useMemo(() => {
    const backendByCode = new Map(permissions.map((item) => [item.permCode, item]));
    const groups = ACCESS_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.map(([code, name]) => ({
        permCode: code,
        permName: backendByCode.get(code)?.permName || name,
        supported: supportedCodes.has(code),
      })),
    }));
    const legacy = permissions
      .filter((item) => !plannedCodes.has(item.permCode))
      .map((item) => ({ ...item, supported: true }));
    if (legacy.length) groups.push({ key: "legacy", name: "后端当前兼容权限", permissions: legacy });
    return groups;
  }, [permissions, plannedCodes, supportedCodes]);
  const toggle = (code) => {
    if (!supportedCodes.has(code)) return;
    setForm((current) => ({ ...current, permCodes: current.permCodes.includes(code) ? current.permCodes.filter((item) => item !== code) : [...current.permCodes, code] }));
  };
  const submit = async (event) => {
    event.preventDefault();
    const code = form.roleCode.trim().toUpperCase();
    if (!editing && !/^[A-Z][A-Z0-9_]{1,31}$/.test(code)) return setError("角色编码需为 2-32 位，以字母开头，只能包含大写字母、数字或下划线");
    if (!form.roleName.trim() || form.roleName.trim().length > 64) return setError("角色名称需为 1-64 个字符");
    if (!form.permCodes.length) return setError("请至少勾选一个权限");
    const unsupported = form.permCodes.filter((permCode) => !supportedCodes.has(permCode));
    if (unsupported.length) return setError(`以下权限后端尚未上线，不能保存：${unsupported.join("、")}`);
    setSubmitting(true);
    try {
      if (editing) await updateRole(role.roleCode, { roleName: form.roleName.trim(), permCodes: form.permCodes });
      else await createRole({ roleCode: code, roleName: form.roleName.trim(), permCodes: form.permCodes });
      onSaved();
      onClose();
    } catch (requestError) {
      setError(getChineseApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Modal title={editing ? "编辑角色" : "新建角色"} subtitle="权限修改会在用户下一次请求时立即生效" onClose={onClose} width="max-w-5xl">
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">角色编码<input disabled={editing} value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value.toUpperCase() })} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono outline-none focus:border-[#4cd7d0] disabled:bg-slate-100" /></label>
          <label className="text-xs font-bold text-slate-600">角色名称<input value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#4cd7d0]" /></label>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-600">权限点</p>
            <span className="text-[10px] font-bold text-slate-400">灰色项表示后端尚未返回，暂不能保存</span>
          </div>
          <div className="space-y-3">
            {permissionGroups.map((group) => (
              <section key={group.key} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 text-xs font-black text-slate-700">{group.name}</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.permissions.map((permission) => {
                    const checked = form.permCodes.includes(permission.permCode);
                    return (
                      <label
                        key={permission.permCode}
                        className={`rounded-md border px-3 py-2 ${permission.supported ? "cursor-pointer" : "cursor-not-allowed opacity-45"} ${checked ? "border-[#4cd7d0] bg-[#effcfb]" : "border-slate-200"}`}
                        title={permission.supported ? permission.permName : "后端权限点尚未上线"}
                      >
                        <span className="flex items-start gap-2">
                          <input type="checkbox" disabled={!permission.supported} checked={checked} onChange={() => toggle(permission.permCode)} className="mt-0.5" />
                          <span>
                            <span className="block font-mono text-[10px] font-black text-slate-700">{permission.permCode}</span>
                            <span className="block text-[10px] leading-4 text-slate-500">{permission.permName}</span>
                            {!permission.supported && <span className="mt-1 inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700">待后端上线</span>}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
        {form.permCodes.some((code) => [PERMISSIONS.USER_CREATE, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DISABLE, PERMISSIONS.USER_PASSWORD_RESET, PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_DELETE, "user:write"].includes(code)) && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">用户和角色写权限属于管理员级权限，保存后会影响账号访问范围。</p>}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="h-10 px-4 text-xs font-bold text-slate-500">取消</button><button disabled={submitting} className="h-10 rounded-md bg-[#1a1b1f] px-5 text-xs font-bold text-white disabled:opacity-50">{submitting ? "保存中..." : "保存角色"}</button></div>
      </form>
    </Modal>
  );
};

const AccessManagement = ({ onExit }) => {
  const { hasPermission } = useAuth();
  const canCreateUser = hasPermission(PERMISSIONS.USER_CREATE);
  const canUpdateUser = hasPermission(PERMISSIONS.USER_UPDATE);
  const canResetPassword = hasPermission(PERMISSIONS.USER_PASSWORD_RESET);
  const canReadRoles = hasPermission(PERMISSIONS.ROLE_READ);
  const canCreateRole = hasPermission(PERMISSIONS.ROLE_CREATE);
  const canUpdateRole = hasPermission(PERMISSIONS.ROLE_UPDATE);
  const canDeleteRole = hasPermission(PERMISSIONS.ROLE_DELETE);
  const canManageRoles = canReadRoles && (canCreateRole || canUpdateRole || canDeleteRole);
  const [tab, setTab] = useState("users");
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [enabled, setEnabled] = useState("");
  const [users, setUsers] = useState({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [userEditor, setUserEditor] = useState(undefined);
  const [passwordUser, setPasswordUser] = useState(null);
  const [roleEditor, setRoleEditor] = useState(undefined);
  const [deletingRole, setDeletingRole] = useState(null);
  const [userDetail, setUserDetail] = useState(null);

  const loadReferences = useCallback(async () => {
    const requests = canReadRoles ? [listRoles()] : [];
    if (canManageRoles) requests.push(listPermissions());
    const [roleEnvelope, permissionEnvelope] = await Promise.all(requests);
    setRoles(roleEnvelope.data || []);
    setPermissions(permissionEnvelope?.data || []);
  }, [canManageRoles, canReadRoles]);

  const loadUsers = useCallback(async () => {
    const envelope = await listUsers({ page, pageSize: PAGE_SIZE, keyword, enabled: enabled === "" ? undefined : enabled });
    setUsers(envelope.data || { items: [], total: 0, page, pageSize: PAGE_SIZE });
  }, [enabled, keyword, page]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadUsers(), loadReferences()]);
    } catch (requestError) {
      setError(getChineseApiError(requestError, "用户权限数据加载失败"));
    } finally {
      setLoading(false);
    }
  }, [loadReferences, loadUsers]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(() => setNotice(""), 3000); return () => clearTimeout(timer); }, [notice]);

  const totalPages = Math.max(1, Math.ceil(users.total / PAGE_SIZE));
  const permissionNames = useMemo(() => Object.fromEntries(permissions.map((item) => [item.permCode, permissionLabel(item.permCode, item.permName)])), [permissions]);
  const groupedPermissions = useMemo(() => {
    const backendByCode = new Map(permissions.map((item) => [item.permCode, item]));
    const knownCodes = new Set(ACCESS_GROUPS.flatMap((group) => group.permissions.map(([code]) => code)));
    const known = ACCESS_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions
        .map(([code, name]) => ({ permCode: code, permName: backendByCode.get(code)?.permName || name, supported: backendByCode.has(code) })),
    }));
    const other = permissions
      .filter((item) => !knownCodes.has(item.permCode))
      .map((item) => ({ ...item, supported: true }));
    if (other.length) known.push({ key: "legacy", name: "后端当前兼容权限", permissions: other });
    return known;
  }, [permissions]);

  const removeRole = async () => {
    if (!deletingRole) return;
    try {
      await deleteRole(deletingRole.roleCode);
      setDeletingRole(null);
      setNotice("角色已删除");
      await reload();
    } catch (requestError) {
      setError(getChineseApiError(requestError));
      setDeletingRole(null);
    }
  };

  const showUserDetail = async (item) => {
    setUserDetail({ loading: true, user: item, error: "" });
    try {
      const envelope = await getUser(item.userId);
      setUserDetail({ loading: false, user: envelope.data, error: "" });
    } catch (requestError) {
      setUserDetail({ loading: false, user: item, error: getChineseApiError(requestError, "用户详情加载失败") });
    }
  };

  return (
    <main className="access-management-page flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f6f8] px-3 pb-3 pt-2 dark:bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-900" title="返回监控页面"><ArrowLeft className="h-5 w-5" /></button>
          <div><h1 className="text-lg font-black text-slate-900 dark:text-on-surface">用户与权限管理</h1><p className="text-xs text-slate-500">账号、动态角色与权限点由后端统一管理</p></div>
        </div>
        <button onClick={reload} disabled={loading} className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />刷新</button>
      </header>

      <div className="flex shrink-0 border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-surface-container-lowest">
        <button onClick={() => setTab("users")} className={`flex h-11 items-center gap-2 border-b-2 px-4 text-xs font-black ${tab === "users" ? "border-[#0058bc] text-[#0058bc]" : "border-transparent text-slate-500"}`}><UserCog className="h-4 w-4" />用户管理</button>
        {canReadRoles && <button onClick={() => setTab("roles")} className={`flex h-11 items-center gap-2 border-b-2 px-4 text-xs font-black ${tab === "roles" ? "border-[#0058bc] text-[#0058bc]" : "border-transparent text-slate-500"}`}><ShieldCheck className="h-4 w-4" />角色管理</button>}
      </div>

      {(error || notice) && <div className={`mx-4 mt-3 rounded-md px-3 py-2 text-xs font-bold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || notice}</div>}

      {tab === "users" ? (
        <section className="flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); setKeyword(searchValue.trim()); }} className="flex flex-wrap gap-2">
              <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="搜索用户名或显示名" className="h-9 w-64 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#4cd7d0]" /></label>
              <select value={enabled} onChange={(e) => { setPage(1); setEnabled(e.target.value); }} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600"><option value="">全部状态</option><option value="true">已启用</option><option value="false">已停用</option></select>
              <button className="h-9 rounded-md bg-slate-800 px-4 text-xs font-bold text-white">查询</button>
            </form>
            {canCreateUser && <button onClick={() => setUserEditor(null)} className="flex h-9 items-center gap-2 rounded-md bg-[#0058bc] px-4 text-xs font-bold text-white"><Plus className="h-4 w-4" />新建用户</button>}
          </div>
          <div className="min-h-0 flex-1 overflow-auto border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-container-lowest">
            <table className="min-w-[880px] w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-surface-container-low"><tr><th className="px-4 py-3">用户</th><th className="px-4 py-3">角色</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">创建时间</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
              <tbody>{users.items.map((item) => <tr key={item.userId} className="border-t border-slate-100 dark:border-white/5"><td className="px-4 py-3"><div className="font-black text-slate-800 dark:text-on-surface">{item.displayName}</div><div className="font-mono text-[10px] text-slate-400">{item.username} / {item.userId}</div></td><td className="px-4 py-3"><div className="flex flex-wrap gap-1">{item.roles.map((role) => <span key={role} className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-600">{role}</span>)}</div></td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 font-bold ${item.enabled ? "text-emerald-700" : "text-slate-400"}`}><span className={`h-2 w-2 rounded-full ${item.enabled ? "bg-emerald-500" : "bg-slate-300"}`} />{item.enabled ? "启用" : "停用"}</span></td><td className="px-4 py-3 text-slate-500">{new Date(item.createdAt).toLocaleString("zh-CN", { hour12: false })}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => showUserDetail(item)} className="p-2 text-slate-500 hover:text-[#0058bc]" title="查看详情"><Eye className="h-4 w-4" /></button>{canUpdateUser && <button onClick={() => setUserEditor(item)} className="p-2 text-slate-500 hover:text-[#0058bc]" title="编辑"><Pencil className="h-4 w-4" /></button>}{canResetPassword && <button onClick={() => setPasswordUser(item)} className="p-2 text-slate-500 hover:text-[#0058bc]" title="重置密码"><KeyRound className="h-4 w-4" /></button>}</div></td></tr>)}</tbody>
            </table>
            {!loading && !users.items.length && <div className="flex h-40 items-center justify-center text-xs text-slate-400">没有符合条件的用户</div>}
          </div>
          <footer className="mt-3 flex shrink-0 items-center justify-between text-xs text-slate-500"><span>共 {users.total} 个用户</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span>{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></footer>
        </section>
      ) : (
        <section className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-black text-slate-800 dark:text-on-surface">角色列表</h2><p className="text-xs text-slate-500">角色权限变更会立即影响在线用户的下一次请求</p></div>{canCreateRole && <button onClick={() => setRoleEditor(null)} className="flex h-9 items-center gap-2 rounded-md bg-[#0058bc] px-4 text-xs font-bold text-white"><Plus className="h-4 w-4" />新建角色</button>}</div>
          {canManageRoles && groupedPermissions.length > 0 && <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{groupedPermissions.map((group) => <div key={group.key} className="rounded-md border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-surface-container-lowest"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-black text-slate-700">{group.name}</span><span className="text-[10px] font-bold text-slate-400">{group.permissions.filter((permission) => permission.supported).length}/{group.permissions.length}</span></div><div className="flex flex-wrap gap-1.5">{group.permissions.map((permission) => <span key={permission.permCode} className={`rounded px-2 py-1 font-mono text-[10px] font-bold ${permission.supported ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700 opacity-70"}`} title={permission.supported ? permission.permName : `${permission.permName}：待后端上线`}>{permission.permCode}</span>)}</div></div>)}</div>}
          <div className="overflow-auto border border-slate-200 bg-white dark:border-white/10 dark:bg-surface-container-lowest"><table className="min-w-[900px] w-full border-collapse text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-surface-container-low"><tr><th className="px-4 py-3">角色</th><th className="px-4 py-3">权限集合</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody>{roles.map((role) => <tr key={role.roleCode} className="border-t border-slate-100 align-top dark:border-white/5"><td className="px-4 py-3"><div className="font-black text-slate-800 dark:text-on-surface">{role.roleName}</div><div className="font-mono text-[10px] text-slate-400">{role.roleCode}</div></td><td className="px-4 py-3"><div className="flex max-w-4xl flex-wrap gap-1.5">{role.permissions.map((permission) => <span key={permission.permCode} title={permissionNames[permission.permCode] || permission.permName} className="rounded bg-[#eef4fb] px-2 py-1 font-mono text-[10px] font-bold text-[#0058bc]">{permission.permCode}</span>)}</div></td><td className="px-4 py-3"><div className="flex justify-end gap-1">{canUpdateRole && <button disabled={role.roleCode === "ADMIN"} onClick={() => setRoleEditor(role)} className="p-2 text-slate-500 hover:text-[#0058bc] disabled:cursor-not-allowed disabled:opacity-25" title={role.roleCode === "ADMIN" ? "内置管理员角色不可编辑" : "编辑角色"}><Pencil className="h-4 w-4" /></button>}{canDeleteRole && <button disabled={role.roleCode === "ADMIN"} onClick={() => setDeletingRole(role)} className="p-2 text-slate-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25" title={role.roleCode === "ADMIN" ? "内置管理员角色不可删除" : "删除角色"}><Trash2 className="h-4 w-4" /></button>}</div></td></tr>)}</tbody></table></div>
        </section>
      )}

      {userEditor !== undefined && <UserForm user={userEditor} roles={roles} onClose={() => setUserEditor(undefined)} onSaved={() => { setNotice(userEditor ? "用户已更新" : "用户已创建"); reload(); }} />}
      {passwordUser && <PasswordReset user={passwordUser} onClose={() => setPasswordUser(null)} onSaved={setNotice} />}
      {roleEditor !== undefined && <RoleForm role={roleEditor} permissions={permissions} onClose={() => setRoleEditor(undefined)} onSaved={() => { setNotice(roleEditor ? "角色已更新" : "角色已创建"); reload(); }} />}
      {userDetail && <Modal title="用户详情" subtitle={`${userDetail.user.username} / ${userDetail.user.userId}`} onClose={() => setUserDetail(null)}><div className="space-y-4 p-5">{userDetail.loading ? <p className="text-xs text-slate-500">正在读取用户详情...</p> : <><dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">显示名称</dt><dd className="mt-1 font-bold text-slate-800">{userDetail.user.displayName}</dd></div><div><dt className="text-slate-400">账号状态</dt><dd className="mt-1 font-bold text-slate-800">{userDetail.user.enabled ? "启用" : "停用"}</dd></div></dl><div><p className="mb-2 text-xs font-bold text-slate-500">角色</p><div className="flex flex-wrap gap-1.5">{(userDetail.user.roles || []).map((role) => <span key={role} className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-700">{role}</span>)}</div></div><div><p className="mb-2 text-xs font-bold text-slate-500">权限并集</p><div className="flex flex-wrap gap-1.5">{(userDetail.user.permissions || []).map((permission) => <span key={permission} className="rounded bg-[#eef4fb] px-2 py-1 font-mono text-[10px] font-bold text-[#0058bc]">{permission}</span>)}</div></div></>}{userDetail.error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{userDetail.error}</p>}</div></Modal>}
      {deletingRole && <Modal title="删除角色" subtitle={`角色：${deletingRole.roleName}（${deletingRole.roleCode}）`} onClose={() => setDeletingRole(null)} width="max-w-md"><div className="p-5"><p className="text-sm text-slate-600">删除后无法恢复。若仍有用户绑定该角色，后端会拒绝删除。</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeletingRole(null)} className="h-10 px-4 text-xs font-bold text-slate-500">取消</button><button onClick={removeRole} className="h-10 rounded-md bg-red-600 px-5 text-xs font-bold text-white">确认删除</button></div></div></Modal>}
    </main>
  );
};

export default AccessManagement;
