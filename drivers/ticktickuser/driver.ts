import Homey from 'homey';
import PairSession from "homey/lib/PairSession";

import ObjectID from 'bson-objectid';

import { TickTickTask } from '../../lib/models/TickTickTask';
import { TickTickClient } from '../../lib/TickTickClient';

class TickTickUserDriver extends Homey.Driver {

  client = new TickTickClient();

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('TickTickUserDriver has been initialized');
    this.registerCreateInboxTaskAction();
    // this.registerCreateInboxTaskWithStartDateAction();
  }

  async onPair(session: PairSession) {
    const client = new TickTickClient();
    let username = '';
    let password = '';
    let inboxId = '';

    session.setHandler('login', async (data: any) => {
      username = data.username.toLowerCase().trim();
      password = data.password;
      const tickTickUser = await client.login(username, password);

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
            inboxId: inboxId,
            username: username,
            password: password
          },
        },
      ];
    });
  }

  registerCreateInboxTaskAction() {
    const createSimpleTask = this.homey.flow.getActionCard('create-inbox-task');
    createSimpleTask.registerRunListener(async (args, state) => {
      const ttUser = args.device.getData();
      await this.client.login(ttUser.username, ttUser.password);
      const currentDateTimeJson = JSON.stringify(new Date());
      const task: TickTickTask = {
        id: ObjectID(),
        title: args.Title,
        createdTime: currentDateTimeJson,
        modifiedTime: currentDateTimeJson,
        timeZone: this.homey.clock.getTimezone(),
        priority: 0,
        status: 0,
        startDate: null,
        reminders: [],
        projectId: ttUser.inboxId,
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
      await this.client.createTask(task);
    });
  }

  // registerCreateInboxTaskWithStartDateAction() {
  //   const createSimpleTask = this.homey.flow.getActionCard('create-inbox-task-with-start-date');
  //   createSimpleTask.registerRunListener(async (args, state) => {
  //     const ttUser = args.device.getData();
  //     await this.client.login(ttUser.username, ttUser.password);
  //     const currentDateTimeJson = JSON.stringify(new Date());
  //     const task: TickTickTask = {
  //       id: ObjectID(),
  //       title: args.Title,
  //       createdTime: currentDateTimeJson,
  //       modifiedTime: currentDateTimeJson,
  //       timeZone: this.homey.clock.getTimezone(),
  //       priority: 0,
  //       status: 0,
  //       startDate: JSON.stringify(args.Date),
  //       reminders: [],
  //       projectId: ttUser.inboxId,
  //       progress: 0,
  //       kind: null,
  //       items: [],
  //       isFloating: false,
  //       exDate: [],
  //       dueDate: null,
  //       content: "",
  //       assignee: null,
  //       sortOrder: -205058918580224,
  //       tags: []
  //     }
  //     await this.client.createTask(task);
  //   });
  // }

}

module.exports = TickTickUserDriver;
