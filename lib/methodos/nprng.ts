/**
 * numpy.random.default_rng(seed) 와 같은 난수열(PCG64 + SeedSequence) — 정수 뽑기(integers)와 실수(random)만.
 * 파이썬 엔진이 씨앗값을 고정해 쓰는 부트스트랩(M13·M36)을 같은 번호열로 재현하려고 옮겼다.
 */
const INIT_A = 0x43b0d7e5, MULT_A = 0x931e8875, INIT_B = 0x8b51f9dd, MULT_B = 0x58f38ded, MIX_L = 0xca01f9dd, MIX_R = 0x4973f715;
const MASK128 = (1n << 128n) - 1n, MASK64 = (1n << 64n) - 1n;
const PCG_MULT = 47026247687942121848144207491837523525n;

function seedWords(seed: number | bigint): number[] {
  let v = BigInt(seed); const out: number[] = [];
  if (v === 0n) return [0];
  while (v > 0n) { out.push(Number(v & 0xffffffffn)); v >>= 32n; }
  return out;
}
function mixEntropy(entropy: number[]): number[] {
  const pool = [0, 0, 0, 0]; let hc = INIT_A;
  const hashmix = (value: number) => { value = (value ^ hc) >>> 0; hc = Math.imul(hc, MULT_A) >>> 0; value = Math.imul(value, hc) >>> 0; value = (value ^ (value >>> 16)) >>> 0; return value; };
  const mix = (x: number, y: number) => { let r = (Math.imul(MIX_L, x) - Math.imul(MIX_R, y)) >>> 0; r = (r ^ (r >>> 16)) >>> 0; return r; };
  for (let i = 0; i < 4; i++) pool[i] = hashmix(i < entropy.length ? entropy[i] : 0);
  for (let s = 0; s < 4; s++) for (let d = 0; d < 4; d++) if (s !== d) pool[d] = mix(pool[d], hashmix(pool[s]));
  for (let s = 4; s < entropy.length; s++) for (let d = 0; d < 4; d++) pool[d] = mix(pool[d], hashmix(entropy[s]));
  return pool;
}
function generateState64(pool: number[], n64: number): bigint[] {
  let hc = INIT_B; const w32: number[] = [];
  for (let i = 0; i < n64 * 2; i++) { let d = (pool[i % 4] ^ hc) >>> 0; hc = Math.imul(hc, MULT_B) >>> 0; d = Math.imul(d, hc) >>> 0; d = (d ^ (d >>> 16)) >>> 0; w32.push(d); }
  const out: bigint[] = []; for (let k = 0; k < n64; k++) out.push(BigInt(w32[2 * k]) | (BigInt(w32[2 * k + 1]) << 32n)); return out;
}

export class NumpyRng {
  private state = 0n; private inc = 0n; private hasU32 = false; private u32 = 0;
  constructor(seed: number | bigint) {
    const st = generateState64(mixEntropy(seedWords(seed)), 4);
    const initstate = (st[0] << 64n) | st[1], initseq = (st[2] << 64n) | st[3];
    this.inc = ((initseq << 1n) | 1n) & MASK128; this.step(); this.state = (this.state + initstate) & MASK128; this.step();
  }
  private step() { this.state = (this.state * PCG_MULT + this.inc) & MASK128; }
  next64(): bigint {
    this.step(); const hi = this.state >> 64n, lo = this.state & MASK64; const x = (hi ^ lo) & MASK64; const rot = Number(this.state >> 122n);
    return rot === 0 ? x : ((x >> BigInt(rot)) | (x << BigInt(64 - rot))) & MASK64;
  }
  next32(): number {
    if (this.hasU32) { this.hasU32 = false; return this.u32; }
    const n = this.next64(); this.hasU32 = true; this.u32 = Number(n >> 32n); return Number(n & 0xffffffffn);
  }
  /** rng.random() — [0,1) 53비트 */
  random(): number { return Number(this.next64() >> 11n) * (1 / 9007199254740992); }
  /** rng.integers(0, n, size=1) — n ≤ 2^32 인 경우의 Lemire 방식 */
  integer(n: number): number {
    const rng = n - 1; if (rng === 0) return 0; if (rng === 0xffffffff) return this.next32();
    if (rng > 0xffffffff) { // 64-bit path
      const rngExcl = BigInt(rng) + 1n; let m = this.next64() * rngExcl; let left = m & MASK64;
      if (left < rngExcl) { const thr = (MASK64 - BigInt(rng)) % rngExcl; while (left < thr) { m = this.next64() * rngExcl; left = m & MASK64; } }
      return Number(m >> 64n);
    }
    const rngExcl = rng + 1; let m = BigInt(this.next32()) * BigInt(rngExcl); let left = Number(m & 0xffffffffn);
    if (left < rngExcl) { const thr = (0xffffffff - rng) % rngExcl; while (left < thr) { m = BigInt(this.next32()) * BigInt(rngExcl); left = Number(m & 0xffffffffn); } }
    return Number(m >> 32n);
  }
  integers(n: number, size: number): number[] { const out = new Array<number>(size); for (let i = 0; i < size; i++) out[i] = this.integer(n); return out; }
}
