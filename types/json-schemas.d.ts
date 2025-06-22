import type { TObject, TSchema } from "@sinclair/typebox";

type Opts = {
  query?: TObject;
  headers?: TObject;
  params?: TObject;
  body?: TObject;
} & {
  [key: string]: TSchema | undefined;
};

type ExcludeBody<T extends Record<string, TSchema | undefined>> = {
  [K in keyof T as K extends "body" ? never : K]: T[K];
};

type RequireProperties<T> = {
  [K in keyof T]-?: Exclude<T[K], undefined>;
};

export function jsonSchemas<Data extends Opts>(
  schemas: Data
): {
  schemas: {
    meta: TObject<RequireProperties<ExcludeBody<Data>>>;
  } & (Data extends { body: TObject } ? { body: Data["body"] } : {});
  getMeta: any;
  parseBody: any;
};
