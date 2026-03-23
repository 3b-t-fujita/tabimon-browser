/**
 * エラーバナー共通 component。
 */
interface Props {
  message: string;
}

export function ErrorBanner({ message }: Props) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
