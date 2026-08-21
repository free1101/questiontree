import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Server,
  Cpu,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import { getSettings, saveSettings, testConnection } from "../lib/api";
import type { Settings } from "../types";

const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/plan/v3";

interface TestResult {
  ok: boolean;
  message: string;
  model?: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setTestResult(null);
  };

  const handleSave = () => {
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    saveSettings(form);
    setTesting(true);
    setTestResult(null);
    try {
      const r = await testConnection();
      setTestResult(r);
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : "网络错误" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-ink-secondary transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <h1 className="text-base font-semibold text-ink">设置</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-6 pb-16 pt-20">
        {/* 接入模式说明 */}
        <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-sm leading-relaxed text-ink-secondary">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <span>
              默认使用<strong className="text-ink">服务端共用 API Key</strong>
              （管理员配置在服务器 .env 中）。如果你想用自己的火山方舟 Key，请关闭该开关并填写下方信息，Key
              仅保存在你自己的浏览器中，不会上传服务器。
            </span>
          </p>
        </div>

        {/* API Key 模式 */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">API Key</h2>
                <p className="text-xs text-ink-secondary">选择使用哪种 Key</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.useServerKey}
                onChange={(e) => update("useServerKey", e.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          </div>

          {!form.useServerKey && (
            <div className="mt-5 animate-fade-in">
              <label className="text-xs font-medium text-ink-secondary">你的 Ark API Key</label>
              <input
                type="password"
                className="input-base mt-1.5"
                placeholder="ark-xxxxxxxx…"
                value={form.apiKey}
                onChange={(e) => update("apiKey", e.target.value)}
              />
              <p className="mt-1.5 text-xs text-ink-secondary">
                仅保存在浏览器 localStorage，随请求头发送到你的服务端代理转发。
              </p>
            </div>
          )}
        </div>

        {/* 模型配置 */}
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Cpu className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-ink">模型配置</h2>
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-ink-secondary">
                <Server className="h-3.5 w-3.5" />
                接口地址（Base URL）
              </label>
              <input
                className="input-base mt-1.5 font-mono text-[13px]"
                placeholder={DEFAULT_BASE_URL}
                value={form.baseUrl}
                onChange={(e) => update("baseUrl", e.target.value)}
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-ink-secondary">
                <Globe className="h-3.5 w-3.5" />
                模型 ID
              </label>
              <input
                className="input-base mt-1.5 font-mono text-[13px]"
                placeholder={DEFAULT_MODEL}
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
              />
              <p className="mt-1.5 text-xs text-ink-secondary">
                留空使用服务端默认模型（{DEFAULT_MODEL}）。标准按量付费通道可用
                https://ark.cn-beijing.volces.com/api/v3。
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="btn-primary" onClick={handleSave}>
              {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "已保存" : "保存配置"}
            </button>
            <button className="btn-secondary" onClick={handleTest} disabled={testing}>
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              测试连接
            </button>
          </div>

          {testResult && (
            <div
              className={
                "mt-4 flex items-start gap-2 rounded-lg p-3 text-sm animate-fade-in " +
                (testResult.ok
                  ? "border border-success/30 bg-success/5 text-success"
                  : "border border-danger/30 bg-danger/5 text-danger")
              }
            >
              {testResult.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>
                {testResult.message}
                {testResult.ok && testResult.model && (
                  <span className="ml-1 font-mono text-xs">（{testResult.model}）</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* 说明 */}
        <div className="card p-6 text-xs leading-relaxed text-ink-secondary">
          <h3 className="text-sm font-semibold text-ink">使用提示</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>回答完成后，AI 会自动为当前分支及所有上级分支刷新「核心思想」摘要。</li>
            <li>摘要可手动编辑，编辑后 AI 不会再自动覆盖（除非点击「重新生成」）。</li>
            <li>所有数据保存在服务器 SQLite 文件中（个人本地运行则保存在本机）。</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
