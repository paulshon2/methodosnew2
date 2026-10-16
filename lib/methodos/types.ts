import type { Table } from "./core";
export type Cell = number | string | null;
export interface Tbl { id: string; title: string; columns: string[]; rows: Cell[][] }
export interface Eff { name: string; value: number; ciLow?: number | null; ciHigh?: number | null }
export interface CI { parameter: string; estimate: number; low: number; high: number; level?: number }
export interface MResult {
  code: string; name: string;
  tables: Tbl[]; effects: Eff[]; cis: CI[]; notes: string[];
}
export interface Input { table: Table; slots: Record<string, string[]>; options: Record<string, any> }
export type Runner = (inp: Input) => MResult;
export const mk = (code: string, name: string): MResult => ({ code, name, tables: [], effects: [], cis: [], notes: [] });
