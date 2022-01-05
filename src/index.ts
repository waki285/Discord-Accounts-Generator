import puppeteer from "puppeteer";
import { EventEmitter } from "events";
import { readFile } from "fs/promises";
import { red, magenta, green, yellowBright, bgWhite, cyan, bgMagenta } from "chalk"


const K = `${magenta("[")}*${magenta("]")}`;
const DAG = bgWhite.black("DAG");
const INFO = cyan("info");
const WARNING = yellowBright("WARNING");
const ERROR = red("ERROR!");
const SUCCESS = green("success");

class Generator<IS extends boolean> extends EventEmitter {
  private _installSolver: boolean;
  private _browser: puppeteer.Browser | null;
  constructor(options?: { installSolver?: IS}) {
    super();
    if (options && options.installSolver) this._installSolver = options.installSolver; else this._installSolver = true;
    this._browser = null;
    console.log(`${K} ${DAG} ${SUCCESS} initialized.`);
  };
  async launch(args?: string[]) {
    const defaultArgs = ["--no-sandbox", "--disable-setuid-sandbox"];
    const proxies = await readFile("./config/proxies.txt", "utf-8");
    if (!proxies) {
      this._browser = await puppeteer.launch({ args: args ? args.concat(defaultArgs):defaultArgs, headless: false });
      console.log(`${K} ${DAG} ${SUCCESS} browser launched.`)
    } else {
      const proxyList = proxies.split("\n");
      const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
      console.log(`${K} ${DAG} ${INFO} proxy used ${bgMagenta.white(proxy)}.`)
      this._browser = await puppeteer.launch({ args: args ? args.concat(defaultArgs).concat([`--proxy-server=${proxy}`]):defaultArgs.concat([`--proxy-server=${proxy}`]), headless: false });
      console.log(`${K} ${DAG} ${SUCCESS} browser launched.`)
    }
  };
  async scrapEmail() {};
};

(async () => {
  const generator = new Generator();
  generator.launch();
})();