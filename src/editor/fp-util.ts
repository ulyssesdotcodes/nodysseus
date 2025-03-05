export const pick = <
  T extends Record<string, unknown>,
  R extends Record<string, unknown>,
  S extends Partial<T> & R
>(
  obj: T,
  attrs: Array<keyof T>,
  initial?: R
): S =>
  attrs.reduce(
    (res, attr) => (
      (res[attr as keyof S] = (obj as unknown as S)[attr] as S[keyof S]), res
    ),
    initial as unknown as S
  );
export const remap = <T extends Record<string, unknown>>(
  obj: T,
  attrs: Partial<Record<keyof T, string>>,
  initial?: Record<string, unknown>
) =>
  Object.entries(attrs).reduce(
    (res, attr) => ((res[attr[1]] = obj[attr[0]]), res),
    initial
  );
