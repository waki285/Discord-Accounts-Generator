import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth"
import { Browser, ElementHandle, Page } from "puppeteer"
import { EventEmitter } from "events";
import { readFile } from "fs/promises";
import { red, magenta, green, yellowBright, bgWhite, cyan, bgMagenta, magentaBright } from "chalk";
import { hcaptcha } from "puppeteer-hcaptcha"
import axios from "axios";
import { randomBytes } from "crypto";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import fetch from "cross-fetch";
import { createInterface } from "readline";
import hCaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { Solver } from "2captcha";

import { config } from "dotenv";
config();

puppeteer.use(pluginStealth());
puppeteer.use(hCaptchaPlugin({
  provider: {
    id: "2captcha",
    token: process.env.TWOCAPTCHA_TOKEN
  },
  visualFeedback: true,
  throwOnError: true
}))
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = async (query: string): Promise<string> => new Promise((r) => {
  rl.question(query, (answer) => r(answer));
});

const sleep = async (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const K = `${magenta("[")}*${magenta("]")}`;
const DAG = bgWhite.black("DAG");
const INFO = cyan("info");
const WARNING = yellowBright("WARNING");
const ERROR = red("ERROR!");
const FATAL = bgWhite.red("ERROR!");
const SUCCESS = green("success");
const QUESTION = magentaBright("QUESTION")

function getRandom(min: number, max: number): number {
  const random = Math.floor(Math.random() * (max + 1 - min)) + min;
  return random;
}

type solveType = "2captcha" | "lib" | null;

class DAGError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `${K} ${DAG} ${FATAL}`;
  };
}

class Generator<GE extends boolean, US extends solveType = solveType> extends EventEmitter {
  private _useSolver: solveType;
  private _getEmail: boolean;
  private _browser: Browser | null;
  private _username: string | null;
  private _email: string | null;
  constructor(options?: { getEmail?: GE, useSolver?: US}) {
    super();
    if (options && options.useSolver !== void 0) this._useSolver = options.useSolver; else this._useSolver = "lib";
    if (options && options.getEmail !== void 0) this._getEmail = options.getEmail; else this._getEmail = true;
    this._browser = null;
    console.log(`${K} ${DAG} ${SUCCESS} initialized.`);
    this._username = null;
    this._email = null;
  };
  async launch(args?: string[]): Promise<void> {
    const defaultArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-size=1920x1080"];
    const proxies = await readFile("./config/proxies.txt", "utf-8");
    if (!proxies) {
      console.log(`${K} ${DAG} ${WARNING} You don't use any proxy.`)
      this._browser = await puppeteer.launch({ args: args ? args.concat(defaultArgs):defaultArgs, headless: false });
      console.log(`${K} ${DAG} ${SUCCESS} browser launched.`)
      return;
    } else {
      const proxyList = proxies.split("\n");
      const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
      console.log(`${K} ${DAG} ${INFO} proxy used ${bgMagenta.white(proxy)}.`)
      this._browser = await puppeteer.launch({ args: args ? args.concat(defaultArgs).concat([`--proxy-server=${proxy}`]):defaultArgs.concat([`--proxy-server=${proxy}`]), headless: false });
      console.log(`${K} ${DAG} ${SUCCESS} browser launched.`)
      return;
    }
  };
  async scrapEmail() {
    if (this._getEmail === false) throw new DAGError("You choose don't scrap email!");
    console.log(`${K} ${DAG} ${INFO} scrapping email now.`);
    /*const g = new GmailnatorGet();
    const t = await g.init();
    console.log(`${K} ${DAG} ${SUCCESS} token used ${t}`);
    const newEmail = await g.getEmail();
    console.log(`${K} ${DAG} ${SUCCESS} email used ${newEmail}`);*/
    if (!this._browser) throw new DAGError("You don't launch browser! please run generator.launch()");
    const mailPage = await this._browser.newPage();
    PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => blocker.enableBlockingInPage(mailPage));
    await mailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
    mailPage.goto("https://www.gmailnator.com", { timeout: 10000});
    const timeout = setTimeout(() => mailPage.reload(), 2000);
    await mailPage.waitForResponse(res => !!res.url().match(/index\/indexquery/));
    clearTimeout(timeout);
    const mail = (await (await mailPage.$("#email_address"))?.getProperty("value"))!.toString().replace("JSHandle:", "");
    this._email = mail;
    console.log(`${K} ${DAG} ${SUCCESS} scrapped ${mail}.`);

  };
  async getRandomName(): Promise<string> {
    console.log(`${K} ${DAG} ${INFO} get random username.`);
    const nameFile: string = await readFile("./config/username.txt", "utf-8");
    if (nameFile) {
      const names: string[] = nameFile.split("\n");
      const name:string = names[Math.floor(Math.random() * names.length)];
      console.log(`${K} ${DAG} ${SUCCESS} username used ${name}.`);
      this._username = name;
      return name;
    } else {
      const data: string[] = (await axios("https://random-word-api.herokuapp.com/word?number=2")).data;
      const username = data.join("");
      console.log(`${K} ${DAG} ${SUCCESS} username used ${username}.`);
      this._username = username;
      return username;
    }
  };
  async gotoDiscord(): Promise<void> {
    console.log(`${K} ${DAG} ${INFO} go to https://discord.com/register .`);
    if (!this._browser) throw new DAGError("You don't launch browser! please run generator.launch()");
    const pages: Page[] = await this._browser.pages();
    const page:Page = pages[0] || await this._browser.newPage();
    if (pages.length > 1) await page.bringToFront();
    await page.goto("https://discord.com/register");
    console.log(`${K} ${DAG} ${SUCCESS} success go to discord register page.`);
  };
  async typeInfo(): Promise<Page> {
    console.log(`${K} ${DAG} ${INFO} type username and password etc.`);
    if (!this._browser) throw new DAGError("You don't launch browser! please run generator.launch()");
    const pages: Page[] = await this._browser.pages();
    const page:Page | undefined = pages[0];
    if (!page) throw new DAGError("You don't open discord! please run generator.gotoDiscord()");
    if (!this._username) throw new DAGError("You don't have username! please run generator.getRandomName()");
    await page.waitForSelector("input[name=email]");
    if (this._getEmail) {
      if (!this._email) throw new DAGError("You don't have an email! please run generator.scrapEmail()");
      console.log(`${K} ${DAG} ${INFO} type email ${this._email}`);
      await page.type("input[name=email]", this._email);
    }
    console.log(`${K} ${DAG} ${INFO} type username ${this._username}`);
    await page.type("input[name=username]", this._username);
    const pass = randomBytes(10).toString("base64").replaceAll("=", "");
    console.log(`${K} ${DAG} ${INFO} type random password ${pass}`);
    await page.type("input[name=password]", pass);

    const month = getRandom(1, 12);
    const date = getRandom(1, 28);
    const year = getRandom(1980, 2000);

    console.log(`${K} ${DAG} ${INFO} type random birthday ${month}/${date}/${year}`);
    await page.click("div[class='css-1hwfws3']");
    await page.keyboard.type(String(month));
    await page.keyboard.press("Enter");
    await page.keyboard.type(String(date));
    await page.keyboard.press("Enter");
    await page.keyboard.type(String(year));
    await page.keyboard.press("Enter");
    
    const check = await page.$("input[type=checkbox]");
    if (check) {
      console.log(`${K} ${DAG} ${INFO} checkbox found. clicking...`);
      await check.click();
    };

    if (!this._getEmail) {
      const email = await question(`${K} ${DAG} ${QUESTION} please type email in this console: `);
      const reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.+-]*@{1}[A-Za-z0-9_.-]{1,}.[A-Za-z0-9]{1,}$/;
      if (!reg.test(email)) throw new DAGError("It's not an email!");
      console.log(`${K} ${DAG} ${SUCCESS} ok. type email ${email}`);
      await page.type("input[name=email]", email);
    };

    console.log(`${K} ${DAG} ${SUCCESS} all complete! submitting form...`);
    await page.click("button[type=submit]");

    return page;

  };
  async solveCaptcha(page: Page) {
    if (this._useSolver !== null) {
      console.log(`${K} ${DAG} ${INFO} searching hCaptcha...`);
      const cap = await page.$("iframe[src*=sitekey]");
      if (!cap) await page.waitForSelector("iframe[src*=sitekey]");
      await page.waitForTimeout(3000);
//      await page.waitForResponse((res) => !!res.url().match(/hsw.js/))
      console.log(`${K} ${DAG} ${INFO} found hcaptcha. waiting for solve...`);
      if (this._useSolver === "2captcha") {
        //await page.solveRecaptchas()
        //await sleep(60000);
        const tc = new Solver(process.env.TWOCAPTCHA_TOKEN as string);
        const result = tc.hcaptcha("f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34", "https://discord.com/register");
        console.log(result);
      } else {
        await hcaptcha(page);
      }
      console.log(`${K} ${DAG} ${SUCCESS} hCaptcha solved.`);
    } else {
      let notSolve: boolean = true;
      while(notSolve) {
        const ans: string = await question(`${K} ${DAG} ${QUESTION} Have you solve captcha? please type your answer in this console [y/n]: `);
        if (ans.toLowerCase() === "yes" || ans.toLowerCase() === "y") {
          notSolve = false;
          break;
        } else if (ans.toLowerCase() === "no" || ans.toLowerCase() === "n") {
          console.log(`${K} ${DAG} ${ERROR} ok, you should type console after solve captcha.`);
          continue;
        } else {
          console.log(`${K} ${DAG} ${ERROR} wrong answer!`);
        }
      };
      console.log(`${K} ${DAG} ${SUCCESS} hCaptcha solved.`);
    }
  };
  async verifyEmail() {
    console.log(`${K} ${DAG} ${INFO} verify email.`);
    if (!this._browser) throw new DAGError("You don't launch browser! please run generator.launch()");
    if (!this._getEmail) throw new DAGError("You choose don't scrap an email!");
    const pages: Page[] = await this._browser.pages();
    const emailPage: Page | undefined = pages.find(x => x.url().match(/gmailnator/));
    if (!emailPage) throw new DAGError("You don't scrap an email or close tab! please run generator.scrapEmail() or don't close tab!");
    await emailPage.bringToFront();
    emailPage.click("button[id=button_go]");
    const timer = setTimeout(() => emailPage.click("button[id=button_reload]"), 3000);
    await emailPage.waitForResponse((res) => !!res.url().match(/mailbox\/mailboxquery/));
    clearTimeout(timer);
    let link = await emailPage.$("a[href*=messageid]");
    let mitukaranai: boolean = true;
    let kaisuu: number = 0;
    while (mitukaranai) {
      if (link) {
        mitukaranai = false;
        break;
      } else {
        if (kaisuu > 5) throw new DAGError("failed to email fetch");
        kaisuu++
        console.log(`${K} ${DAG} ${WARNING} failed to email fetch. I try fetch again after 15 seconds. ${5 - kaisuu} remaining`);
        await sleep(1500);
        link = await emailPage.$("a[href*=messageid]");
      }
    }
    await (link as ElementHandle<Element>).click();
    await ((await emailPage.$("a[href*=discord.com]")) as ElementHandle<Element>).click();
    console.log(`${K} ${DAG} ${SUCCESS} verified.`);
  };
};

export { Generator };

(async () => {
  const generator = new Generator({ useSolver: "2captcha", getEmail: false });
  await generator.launch();
//  await generator.scrapEmail();
  await generator.getRandomName()
  await generator.gotoDiscord();
  const page = await generator.typeInfo();
  await generator.solveCaptcha(page);

})();