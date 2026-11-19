/** Type contract every app runtime must satisfy. */
export * from "../core/src/types";

export declare const api: any;
export declare function fileUrl(abs: string): string;
export declare function on<T>(name: string, cb: (p: T) => void): Promise<() => void>;
export declare function inTauri(): boolean;
export declare function isWebApp(): boolean;
export declare function notifyStatus(status: string): Promise<void>;
export declare function openUrl(url: string): Promise<void>;
export declare function revealItemInDir(path: string): Promise<void>;
export declare function open(opts?: {
  directory?: boolean;
  title?: string;
  defaultPath?: string;
}): Promise<string | string[] | null>;
