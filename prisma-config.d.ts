declare module "prisma/config" {
  // Minimal typing to satisfy TypeScript for Prisma config usage
  // without affecting runtime behavior.
  // Prisma CLI is the only consumer of this module.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineConfig(config: any): any;
}

