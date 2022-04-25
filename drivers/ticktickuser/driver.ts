import Homey from 'homey';
import PairSession from "homey/lib/PairSession";

import ObjectID from 'bson-objectid';

import { TickTickTask } from '../../lib/models/TickTickTask';
import { TickTickClient } from '../../lib/TickTickClient';
import { ArgumentAutocompleteResults } from 'homey/lib/FlowCard';
import { TickTickModelHelpers } from '../../lib/TickTickModelHelpers';
import { CryptoClient } from '../../lib/CryptoClient';

class TickTickUserDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('TickTickUserDriver has been initialized');
    this.registerCreateTaskAction();
    this.registerCreateTaskWithStartDateTodayAction();
  }

  async onPair(session: PairSession) {
    let username = '';
    let password = '';
    let client: TickTickClient;
    let inboxId = '';

    session.setHandler('login', async (data: any) => {
      username = data.username.toLowerCase().trim();
      password = data.password;
      client = new TickTickClient(username, password);
      const tickTickUser = await client.login();

      inboxId = tickTickUser.inboxId;

      return tickTickUser.userId !== null && tickTickUser.inboxId !== null;
    });

    session.setHandler('list_devices', async () => {
      const tickTickProfile = await client.getProfile();
      const cryptoClient = new CryptoClient(Homey.env.CRYPTO_KEY);
      return [
        {
          name: tickTickProfile.name !== null ? tickTickProfile.name : tickTickProfile.username,
          data: {
            id: tickTickProfile.username,
            inboxId: inboxId,
            username: cryptoClient.encrypt(username),
            password: cryptoClient.encrypt(password)
          },
        },
      ];
    });
  }

  registerCreateTaskAction() {
    const createSimpleTask = this.homey.flow.getActionCard('create-task');
    createSimpleTask.registerRunListener(async (args, state) => {
      const ttUser = args.device.getData();
      const ttClient = <TickTickClient> args.device.client;
      const task: TickTickTask = {
        id: ObjectID(),
        title: args.title,
        createdTime: TickTickModelHelpers.ConvertDateToTickTickDateTime(new Date()),
        modifiedTime: TickTickModelHelpers.ConvertDateToTickTickDateTime(new Date()),
        timeZone: this.homey.clock.getTimezone(),
        priority: 0,
        status: 0,
        startDate: null,
        reminders: [],
        projectId: args.project.id,
        progress: 0,
        kind: null,
        items: [],
        isFloating: false,
        exDate: [],
        dueDate: null,
        content: "",
        assignee: null,
        sortOrder: -205058918580224,
        tags: []
      }
      await ttClient.createTask(task);
    });

    createSimpleTask.registerArgumentAutocompleteListener('project', async (query, args) => {
      return await this.getProjectArgumentAutocompleteResults(query, args);
    });
  }

  async getProjectArgumentAutocompleteResults(query: string, args: any): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
    const ttUser = args.device.getData();
    const ttClient = <TickTickClient> args.device.client;
    const projects = await ttClient.getProjects();
    const results: ArgumentAutocompleteResults = [
      {
        name: "Inbox",
        id: ttUser.inboxId
      }, 
      ...projects.map(project => ({name: project.name, id: project.id}))
    ];
    return results;
  }

  registerCreateTaskWithStartDateTodayAction() {
    const createTaskWithDueDateToday = this.homey.flow.getActionCard('create-task-with-start-date-today');
    createTaskWithDueDateToday.registerRunListener(async (args, state) => {
      const ttUser = args.device.getData();
      const ttClient = <TickTickClient> args.device.client;
      const task: TickTickTask = {
        id: ObjectID(),
        title: args.title,
        createdTime: TickTickModelHelpers.ConvertDateToTickTickDateTime(new Date()),
        modifiedTime: TickTickModelHelpers.ConvertDateToTickTickDateTime(new Date()),
        timeZone: this.homey.clock.getTimezone(),
        priority: 0,
        status: 0,
        startDate: TickTickModelHelpers.ConvertDateToTickTickDateTime(new Date()),
        reminders: [],
        projectId: args.project.id,
        progress: 0,
        kind: null,
        items: [],
        isFloating: false,
        exDate: [],
        dueDate: null,
        content: "",
        assignee: null,
        sortOrder: -205058918580224,
        tags: []
      }
      await ttClient.createTask(task);
    });

    createTaskWithDueDateToday.registerArgumentAutocompleteListener('project', async (query, args) => {
      return await this.getProjectArgumentAutocompleteResults(query, args);
    });
  }
}

module.exports = TickTickUserDriver;