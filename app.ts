import Homey from 'homey';

class TickTickApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('TickTickApp has been initialized');
  }

}

module.exports = TickTickApp;
