module.exports = class Stopwatch {
  constructor() {
    this.timestamp = 0
  }

  start() {
    this.timestamp = Date.now()
    return this.timestamp
  }

  check() {
    return Date.now() - this.timestamp
  }

  clear() {
    this.timestamp = 0
  }
}
