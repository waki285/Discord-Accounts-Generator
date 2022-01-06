import Axios, { AxiosInstance, AxiosResponse } from "axios";
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
} as const;

class Gmailnator {
  public client: AxiosInstance;
  public csrfToken: string | null;
  constructor() {
    this.client = Axios.create({
      withCredentials: true
    });
    this.csrfToken = null;
  };
  public async getCsrf(): Promise<string> {
    const response = await this.client.get(baseUrl, { headers });
    const token = response.headers["set-cookie"]?.find(x => x.includes("csrf_gmailnator_cookie"))?.split(";")[0]?.replace("csrf_gmailnator_cookie=", "");
    this.csrfToken = token as string;
    return token as string;
  }
}

class GmailnatorRead extends Gmailnator {
  public type: "dot" | "plus";
  public email: string;
  public rawEmail: string;
  constructor(email: string, rawEmail: string, types: "dot" | "plus") {
    super();
    this.type = types;
    this.email = email;
    this.rawEmail = rawEmail;
  };
  async init(): Promise<void> {
    await this.getCsrf();
    return;
  }
  private _getEmailName(): string {
    const nameOnly = /(^.*?(?=[%|@])[%|@])/;
    const fil = nameOnly.exec(this.email);
    if (!fil) throw new Error("no matches");
    const fil2: string = [...fil.values()][0];
    const fil3: string = fil2.replace("%", "").replace("@", "");
    return fil3;
  };
  private async _requestsMailbox(): Promise<AxiosResponse<any, any>> {
    await this.init();
    let dataa: string;
    if (this.type === "dot") {
      dataa = `csrf_gmailnator_token=${this.csrfToken}&action=LoadMailList&Email_address=${this.rawEmail}`;
    } else {
      dataa = `csrf_gmailnator_token=${this.csrfToken}&action=LoadMailList&Email_address=${this.email}`;
    }
    const r = await this.client.post(baseUrl + "mailbox/mailboxquery", dataa, {
      headers: headers,
      responseType: "json"
    });
    return r;
  };
  async getInbox(): Promise<string[] | string> {
    const jsonInbox = await this._requestsMailbox();
    let inboxContent: string[] | string = [];
    try {
      for (const email in jsonInbox) {
        inboxContent.push(String(jsonInbox.data[email].content));
      };
    } catch (e) {
      console.log(e);
      inboxContent = "";
    }
    return inboxContent;
  }
  async getSingleMessage(msgId: string): Promise<string> {
    const emailName = this._getEmailName();
    const data = `csrf_gmailnator_token=${this.csrfToken}&action=get_message&message_id=${msgId}&email=${emailName}`;

    const r = await this.client.post(baseUrl + "mailbox/get_single_message", data, {
      headers: headers,
      responseType: "json"
    });

    return r.data.content;
  };
};

class GmailnatorGet extends Gmailnator {
  constructor() {
    super();
  };
  async init(): Promise<void> {
    await this.getCsrf();
    return;
  };
  async getEmail(): Promise<string> {
    await this.init();
    const payload = {
      "csrf_gmailnator_token": this.csrfToken,
      action: "GenerateEmail",
      "data[]": 3
    };

    const r = await this.client.post(baseUrl + "index/indexquery", payload, {
      responseType: "text"
    });
    return r.data;
  }
}

const dfilterEmail = (email: string): string => {
  const atReplace = email.replaceAll("@", "%40");
  const dotReplace = atReplace.replaceAll(".", "");
  const final = dotReplace.replace("com", ".com");
  return final;
};

const pfilterEmail = (email: string): string => {
  const atReplace = email.replaceAll("@", "%40");
  const plusReplace = atReplace.replace("+", "%2B");
  return plusReplace;
}

const findEmailType = (emails: string[]): "dot" | "plus" | undefined => {
  let dotCounter = 0;
  for (const i of emails) {
    if (i === "+") return "plus";
    if (i === ".") dotCounter++;
    if (dotCounter > 1) return 'dot'
  }
}

export { Gmailnator, GmailnatorRead, GmailnatorGet, dfilterEmail, pfilterEmail, findEmailType };