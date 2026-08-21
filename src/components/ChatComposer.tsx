import { useRef, useState } from "react";
import { Send, CornerDownRight, Sparkles, Loader2 } from "lucide-react";

interface Props {
  mode: "root" | "child";
  parentQuestion?: string;
  sending: boolean;
  onSend: (question: string) => void;
}

export default function ChatComposer({ mode, parentQuestion, sending, onSend }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const q = value.trim();
    if (!q || sending) return;
    onSend(q);
    setValue("");
    textareaRef.current?.focus();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card transition-shadow focus-within:shadow-lift">
      {mode === "child" && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-primary">
          <CornerDownRight className="h-3.5 w-3.5" />
          正在
          <span className="max-w-[240px] truncate font-medium">
            “{parentQuestion}”
          </span>
          下继续追问
        </div>
      )}
      {mode === "root" && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          新建根问题（开启一个新分支）
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="max-h-40 min-h-[64px] w-full resize-y bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
        placeholder={
          sending
            ? "AI 正在思考…"
            : mode === "child"
              ? "基于当前内容继续追问，例如：那 A.1 和 A.2 的区别是什么？"
              : "输入你想学习的第一个问题…"
        }
        value={value}
        disabled={sending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-secondary">
          Enter 发送 · Shift+Enter 换行
        </span>
        <button
          className={
            sending
              ? "inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-primary/60 px-3.5 py-1.5 text-xs font-medium text-white"
              : "btn-primary px-3.5 py-1.5 text-xs"
          }
          onClick={submit}
          disabled={sending || !value.trim()}
        >
          {sending ? (
            <>
              <span className="h-3.5 w-3.5 animate-blink-caret rounded-sm bg-white/80" />
              思考中
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              发送
            </>
          )}
        </button>
      </div>
    </div>
  );
}
