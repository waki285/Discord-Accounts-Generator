import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth"
import { Browser, Page } from "puppeteer"
import { EventEmitter } from "events";
import { readFile } from "fs/promises";
import { red, magenta, green, yellowBright, bgWhite, cyan, bgMagenta } from "chalk";
import { hcaptcha } from "puppeteer-hcaptcha"
import axios from "axios";
import { randomBytes } from "crypto";
import { GmailnatorGet } from "./gmailnator/index";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import fetch from "cross-fetch";
puppeteer.use(pluginStealth());

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
  constructor(options?: { getEmail?: GE, useSolver?: US}) {
    super();
    if (options && options.useSolver) this._useSolver = options.useSolver; else this._useSolver = true;
    if (options && options.getEmail) this._getEmail = options.getEmail; else this._getEmail = true;
    this._browser = null;
    console.log(`${K} ${DAG} ${SUCCESS} initialized.`);
    this._username = null;
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
    console.log(`${K} ${DAG} ${INFO} scrapping email now.`);
    /*const g = new GmailnatorGet();
    const t = await g.init();
    console.log(`${K} ${DAG} ${SUCCESS} token used ${t}`);
    const newEmail = await g.getEmail();
    console.log(`${K} ${DAG} ${SUCCESS} email used ${newEmail}`);*/
    if (!this._browser) throw new Error("You don't launch browser! please run generator.launch()");
    const mailPage = await this._browser.newPage();
    PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => blocker.enableBlockingInPage(mailPage));
    await mailPage.goto("https://www.gmailnator.com");
    await mailPage.waitForResponse("https://www.gmailnator.com/index/indexquery");
    const mail = (await mailPage.$("#email_address"))?.evaluate(node => node.nodeValue);
    console.log(mail);

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
    //await page.waitForTimeout(9000);
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

    if (this._getEmail) {}
  }
};

(async () => {
  const generator = new Generator();
  await generator.launch();
  await generator.scrapEmail();
  await generator.getRandomName()
  await generator.gotoDiscord();
  await generator.typeInfo();
})();