import axios from 'axios';
import { TickTickProfile } from './models/TickTickProfile';
import { TickTickTask } from './models/TickTickTask';
import { TickTickLogin } from './models/TickTickUser';
axios.defaults.withCredentials = true;

export class TickTickClient {

    private cookies: any;
    private cookieHeader: any;

    public async login(username: string, password: string): Promise<TickTickLogin> {
        const url = "https://ticktick.com/api/v2/user/signon?wc=true&remember=true";

        const options = {
          username: username,
          password: password,
        };

        const result = await axios.post(url, options, {
          headers: { "Content-Type": "application/json" },
        });

        this.cookies = result.headers["set-cookie"];
        this.cookieHeader = this.cookies.join("; ") + ";";

        return <TickTickLogin> result.data;
    }

    public async getProfile(): Promise<TickTickProfile> {
        const url = "https://api.ticktick.com/api/v2/user/profile";
        const result = await axios.get(url, {
            headers: {
              Cookie: this.cookieHeader,
            },
        });

        return <TickTickProfile> result.data;
    }

    public async createTask(task: TickTickTask): Promise<any> {
      const url = "https://api.ticktick.com/api/v2/batch/task";
      const body = {
        add: [
          task
        ],
        addAttachments: [],
        delete: [],
        deleteAttachments: [],
        update: [],
        updateAttachments: []
      }
      const result = await axios.post(url, body, {
        headers: {
          Cookie: this.cookieHeader,
        },
      });

      return <any> result.data;
    }
}
