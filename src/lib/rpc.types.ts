import type { Database } from "./database.generated";

export type PublicRpcMap = Database["public"]["Functions"];
export type PublicRpcName = Extract<keyof PublicRpcMap, string>;

export type RpcArgs<Name extends PublicRpcName> =
  PublicRpcMap[Name] extends { Args: infer Args } ? Args : never;

export type RpcReturns<Name extends PublicRpcName> =
  PublicRpcMap[Name] extends { Returns: infer Returns } ? Returns : never;

export type RpcRow<Name extends PublicRpcName> =
  RpcReturns<Name> extends readonly (infer Row)[]
    ? Row
    : RpcReturns<Name> extends (infer Row)[]
      ? Row
      : RpcReturns<Name>;

export type RpcContract<Name extends PublicRpcName> = {
  Args: RpcArgs<Name>;
  Returns: RpcReturns<Name>;
};
