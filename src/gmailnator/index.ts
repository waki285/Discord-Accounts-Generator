import Axios, { AxiosInstance } from "axios";
const baseUrl = "https://www.gmailnator.com/";
const headers = {
  authority: "www.gmailnator.com",
  "sec-ch-ua": "^\\^Google",
  accept: "application/json, text/javascript, */*; q=0.01",
  "x-requested-with": "XMLHttpRequest",
  "sec-ch-ua-mobile": "?0",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  origin: "https://www.gmailnator.com",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  referer: "https://www.gmailnator.com/inbox/",
  "accept-language": "en-US,en;q=0.9,",
  "sec-gpc": "1",
};

class Gmailnator {
  public client: AxiosInstance;
  public csrfToken: string;
  constructor() {
    this.client = Axios.create({
      withCredentials: true
    });
    this.csrfToken = ""
  };
  public static async build(): Promise<Gmailnator> {
    const gmailnator = new Gmailnator();
    gmailnator.client = Axios.create({
      withCredentials: true
    });
    gmailnator.csrfToken = await gmailnator.getCsrf();
    return gmailnator;
  }
  public async getCsrf(): Promise<string> {
    const response = await this.client.get(baseUrl, { headers });
    const token = response.headers["set-cookie"]?.find(x => x.includes("csrf_gmailnator_cookie"))?.split(";")[0]?.replace("csrf_gmailnator_cookie=", "");
    return token as string;
  }
}

class GmailnatorRead extends Gmailnator {
  constructor(email: string, rawEmail: string, types: "dot" | "plus") {
    super();

  }
}

export { Gmailnator };