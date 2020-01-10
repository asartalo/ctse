class Availability {
  constructor(type, data) {
    const {
      available, message, noMessage, logs,
    } = {
      available: false,
      message: '',
      noMessage: '',
      logs: [],
      ...data,
    };
    this.type = type;
    this.available = available;
    this.message = message;
    this.noMessage = noMessage;
    this.logs = logs;
  }

  set(data) {
    return new Availability(this.type, data);
  }
}

module.exports = Availability;
