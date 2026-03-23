/**
 * 汎用 Result 型。
 * UseCase / Repository 層の戻り値として使用する。
 * 詳細設計 v4 §10 保存・復旧 に準拠した失敗伝播に使用する。
 */
export type Result<T, E extends string = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errorCode: E; readonly message?: string };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function fail<E extends string>(errorCode: E, message?: string): Result<never, E> {
  return { ok: false, errorCode, message };
}

/** Result が成功かどうかを型ガードで判定する */
export function isOk<T, E extends string>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/** Result が失敗かどうかを型ガードで判定する */
export function isFail<T, E extends string>(
  result: Result<T, E>
): result is { ok: false; errorCode: E; message?: string } {
  return !result.ok;
}
