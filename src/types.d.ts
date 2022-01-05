import { Page } from "puppeteer"

declare module "puppeteer-hcaptcha" {
  export function hcaptcha(page: Page): Promise<void>
}