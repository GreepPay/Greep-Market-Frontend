// Type declarations for modules that TypeScript might not find

declare module "tailwind-merge" {
  export function twMerge(...inputs: any[]): string
  export default { twMerge }
}

declare module "class-variance-authority" {
  export function cva(base: string, config?: any): any
  export type VariantProps<T> = any
}


