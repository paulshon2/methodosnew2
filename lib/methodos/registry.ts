import { Runner } from "./types";
import * as T1 from "./t1";
import * as T2 from "./t2";
import * as T3 from "./t3";
import * as T4 from "./t4";
import * as T5 from "./t5";
import * as T6 from "./t6";
export const runners: Record<string, Runner> = {
  M01: T1.M01, M02: T1.M02, M03: T1.M03, M04: T1.M04, M05: T1.M05, M06: T1.M06, M07: T1.M07, M08: T1.M08,
  M09: T2.M09, M10: T2.M10, M11: T2.M11, M12: T2.M12, M13: T2.M13, M14: T2.M14, M15: T2.M15, M16: T2.M16, M17: T2.M17, M18: T2.M18,
  M19: T3.M19, M20: T3.M20, M21: T3.M21, M22: T3.M22, M23: T3.M23, M24: T3.M24,
  M25: T4.M25, M26: T4.M26, M27: T4.M27, M28: T4.M28, M29: T4.M29, M30: T4.M30,
  M31: T5.M31, M32: T5.M32, M33: T5.M33, M34: T5.M34, M35: T5.M35, M36: T5.M36,
  M37: T6.M37, M38: T6.M38, M39: T6.M39, M40: T6.M40, M41: T6.M41, M42: T6.M42, M43: T6.M43,
};
export const tols: Record<string, any> = { M25: 1e-4, M26: 1e-3, M27: 1e-4, M30: 1e-4, M31: 1e-4, M32: 1e-4, M34: 1e-5, M35: 1e-5, M36: 2e-3, M37: { mi_pooled: 0.15, '*': 1e-6 }, M38: 1e-5, M43: 1e-5 }
export const sortCols: Record<string, Record<string, number>> = { M31: { lpa_profile: 1 } };

export const skipCols: Record<string, string[]> = { M31: ['같은 답 도달 횟수', '유형'], M43: [] };
