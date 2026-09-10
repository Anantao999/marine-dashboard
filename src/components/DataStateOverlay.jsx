import React from "react";
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";

const DataStateOverlay = ({ resources, label = "页面数据" }) => {
  const items = (Array.isArray(resources) ? resources : [resources]).filter(Boolean);
  const errorResource = items.find((item) => item.status === "error");
  const loading = items.some((item) => item.status === "loading" || item.status === "idle");
  if (!errorResource && !loading) return null;

  const reload = () => items.forEach((item) => item.reload?.());
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#f5f6f8]/95 p-6 backdrop-blur-sm dark:bg-background/95">
      <div className="max-w-md text-center">
        {errorResource ? <AlertTriangle className="mx-auto h-9 w-9 text-red-600" /> : <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-[#0058bc]" />}
        <h2 className="mt-3 text-sm font-black text-slate-800 dark:text-on-surface">
          {errorResource ? `${label}加载失败` : `正在加载${label}`}
        </h2>
        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
          {errorResource?.error || "正在从后端接口读取数据，请稍候。"}
        </p>
        {errorResource && (
          <button onClick={reload} className="mx-auto mt-4 flex h-9 items-center gap-2 rounded-md bg-[#1a1b1f] px-4 text-xs font-bold text-white">
            <RefreshCw className="h-3.5 w-3.5" />重新请求
          </button>
        )}
      </div>
    </div>
  );
};

export default DataStateOverlay;
