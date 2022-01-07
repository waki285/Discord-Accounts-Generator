import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth"
import { Browser, Page } from "puppeteer"
import { EventEmitter } from "events";
import { readFile } from "fs/promises";
import { red, magenta, green, yellowBright, bgWhite, cyan, bgMagenta, magentaBright } from "chalk";
import { hcaptcha } from "puppeteer-hcaptcha"
import axios from "axios";
import { randomBytes } from "crypto";
import { GmailnatorGet } from "./gmailnator/index";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import fetch from "cross-fetch";
import { createInterface } from "readline";
puppeteer.use(pluginStealth());
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = async (query: string): Promise<string> => new Promise((r) => {
  rl.question(query, (answer) => r(answer));
});

const K = `${magenta("[")}*${magenta("]")}`;
const DAG = bgWhite.black("DAG");
const INFO = cyan("info");
const WARNING = yellowBright("WARNING");
const ERROR = red("ERROR!");
const SUCCESS = green("success");

function getRandom(min: number, max: number): number {
  const random = Math.floor(Math.random() * (max + 1 - min)) + min;
  return random;
}

class Generator<GE extends boolean, US extends boolean> extends EventEmitter {
  private _useSolver: boolean;
  private _getEmail: boolean;
  private _browser: Browser | null;
  private _username: string | null;
  private _email: string | null;
  constructor(options?: { getEmail?: GE, useSolver?: US}) {
    super();
    if (options && options.useSolver !== void 0) this._useSolver = options.useSolver; else this._useSolver = true;
    if (options && options.getEmail !== void 0) this._getEmail = options.getEmail; else this._getEmail = true;
    this._browser = null;
    console.log(`${K} ${DAG} ${SUCCESS} initialized.`);
    this._username = null;
    this._email = null;
  };
  async launch(args?: string[]): Promise<void> {
    const defaultArgs = ["--no-sandbox", "--disable-setuid-sandbox"];
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
    if (this._getEmail === false) throw new Error("You choose don't scrap email!");
    console.log(`${K} ${DAG} ${INFO} scrapping email now.`);
    /*const g = new GmailnatorGet();
    const t = await g.init();
    console.log(`${K} ${DAG} ${SUCCESS} token used ${t}`);
    const newEmail = await g.getEmail();
    console.log(`${K} ${DAG} ${SUCCESS} email used ${newEmail}`);*/
    if (!this._browser) throw new Error("You don't launch browser! please run generator.launch()");
    const mailPage = await this._browser.newPage();
    PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => blocker.enableBlockingInPage(mailPage));
    mailPage.goto("https://www.gmailnator.com");
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
    if (!this._browser) throw new Error("You don't launch browser! please run generator.launch() .");
    const pages: Page[] = await this._browser.pages();
    const page:Page = pages[0] || await this._browser.newPage();
    if (pages.length > 1) await page.bringToFront();
    await page.goto("https://discord.com/register");
    console.log(`${K} ${DAG} ${SUCCESS} success go to discord register page.`);
  };
  async typeInfo() {
    console.log(`${K} ${DAG} ${INFO} type username and password etc.`);
    if (!this._browser) throw new Error("You don't launch browser! please run generator.launch()");
    const pages: Page[] = await this._browser.pages();
    const page:Page | undefined = pages[0];
    if (!page) throw new Error("You don't open discord! please run generator.gotoDiscord()");
    if (!this._username) throw new Error("You don't have username! please run generator.getRandomName()");
    await page.waitForSelector("input[name=email]");
    if (this._getEmail) {
      if (!this._email) throw new Error("You don't have an email! please run generator.scrapEmail()");
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
      const email = await question(`${K} ${DAG} ${magentaBright("QUESTION")} please type email in this console: `);
      const reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.+-]*@{1}[A-Za-z0-9_.-]{1,}.[A-Za-z0-9]{1,}$/;
      if (!reg.test(email)) throw new Error("It's not an email!");
      console.log(`${K} ${DAG} ${SUCCESS} ok. type email ${email}`);
      await page.type("input[name=email]", email);
    };

    console.log(`${K} ${DAG} ${SUCCESS} all complete! submitting form...`);
    await page.click("button[type=submit]");

  }
};

(async () => {
  const generator = new Generator({ getEmail: false });
  await generator.launch();
//  await generator.scrapEmail();
  await generator.getRandomName()
  await generator.gotoDiscord();
  await generator.typeInfo();
})();