import Homey from 'homey';
import PairSession from "homey/lib/PairSession";
import { ArgumentAutocompleteResults } from 'homey/lib/FlowCard';
import { TickTickClient } from 'node-ticktick';
import { AddTask } from 'node-ticktick/lib/models/AddTask';
import { TickTickModelHelpers } from 'node-ticktick/lib/TickTickModelHelpers';

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
      return [
        {
          name: tickTickProfile.name !== null ? tickTickProfile.name : tickTickProfile.username,
          data: {
            id: tickTickProfile.username,
          },
          store: {
            inboxId: inboxId
          },
          settings: {
            username: username,
            password: password
          }
        },
      ];
    });
  }

  registerCreateTaskAction() {
    const createSimpleTask = this.homey.flow.getActionCard('create-task');
    createSimpleTask.registerRunListener(async (args, state) => {
      const ttClient = <TickTickClient> args.device.client;
      const task: AddTask = {
        title: args.title,
        timeZone: this.homey.clock.getTimezone(),
        projectId: args.project.id,
      }
      await ttClient.createTask(task);
    });

    createSimpleTask.registerArgumentAutocompleteListener('project', async (query, args) => {
      return await this.getProjectArgumentAutocompleteResults(query, args);
    });
  }

  async getProjectArgumentAutocompleteResults(query: string, args: any): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
    const inboxId = args.device.getStoreValue('inboxId');
    const ttClient = <TickTickClient> args.device.client;
    const projects = await ttClient.getProjects();
    const results: ArgumentAutocompleteResults = [
      {
        name: "Inbox",
        id: inboxId
      },
      ...projects.map(project => ({name: project.name, id: project.id}))
    ];
    return results;
  }

  registerCreateTaskWithStartDateTodayAction() {
    const createTaskWithDueDateToday = this.homey.flow.getActionCard('create-task-with-start-date-today');
    createTaskWithDueDateToday.registerRunListener(async (args, state) => {
      const ttClient = <TickTickClient> args.device.client;
      const task: AddTask = {
        title: args.title,
        timeZone: this.homey.clock.getTimezone(),
        startDate: TickTickModelHelpers.ConvertDateToTickTickDateTime(new Date()),
        projectId: args.project.id,
      }
      await ttClient.createTask(task);
    });

    createTaskWithDueDateToday.registerArgumentAutocompleteListener('project', async (query, args) => {
      return await this.getProjectArgumentAutocompleteResults(query, args);
    });
  }
}

module.exports = TickTickUserDriver;