import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";

// scrypt cost settings (N=2^15, r=8, p=3 is a recommended safe combination)
const N = 32768;
const R = 8;
const P = 3;
const KEY_LENGTH = 64;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number, keylen: number) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      keylen,
      { N: n, r, p, maxmem: 64 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
}

// Stored format: scrypt$N$r$p$salt$hash
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, N, R, P, KEY_LENGTH);
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, n, r, p, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(
    password,
    Buffer.from(saltHex, "hex"),
    Number(n),
    Number(r),
    Number(p),
    expected.length
  );
  return timingSafeEqual(actual, expected);
}