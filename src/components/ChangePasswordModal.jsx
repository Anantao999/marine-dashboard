import React, { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { changeOwnPassword } from "../api/accessManagementApi";
import { getChineseApiError } from "../api/errorMessages";

const ChangePasswordModal = ({ open, onClose, onChanged }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8 || newPassword.length > 64) {
      setError("新密码需为 8-64 位字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      await changeOwnPassword({ oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onChanged?.();
      onClose();
    } catch (requestError) {
      setError(getChineseApiError(requestError, "密码修改失败"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onMouseDown={onClose}>
      <form
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl dark:bg-surface-container-lowest"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f7f6] text-[#006b66]">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-on-surface">修改登录密码</h2>
              <p className="text-xs text-slate-500">修改成功后将退出当前账号</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" title="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {[
            ["当前密码", oldPassword, setOldPassword, "current-password"],
            ["新密码", newPassword, setNewPassword, "new-password"],
            ["确认新密码", confirmPassword, setConfirmPassword, "new-password"],
          ].map(([label, value, setter, autoComplete]) => (
            <label key={label} className="block text-xs font-bold text-slate-600 dark:text-on-surface-variant">
              <span className="mb-1.5 block">{label}</span>
              <input
                type="password"
                value={value}
                onChange={(event) => setter(event.target.value)}
                autoComplete={autoComplete}
                required
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 outline-none focus:border-[#4cd7d0] dark:border-white/10 dark:bg-surface-container-low"
              />
            </label>
          ))}
        </div>

        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 text-xs font-bold text-slate-500">取消</button>
          <button disabled={submitting} className="h-10 rounded-md bg-[#1a1b1f] px-5 text-xs font-bold text-white disabled:opacity-50">
            {submitting ? "提交中..." : "确认修改"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordModal;
