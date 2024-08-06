export class Spinner {
  private line = { interval: 130, frames: ["-", "\\", "|", "/"] };

  private spin: any;

  start() {
    const start = 0;
    const end = this.line.frames.length;
    let i = start;

    process.stdout.write("\x1B[?25l");

    this.spin = setInterval(() => {
      process.stdout.cursorTo(0);
      process.stdout.write(this.line.frames[i]);
      i == end - 1 ? (i = start) : i++;
    }, this.line.interval);
  }

  stop() {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    clearInterval(this.spin);
    process.stdout.write("\x1B[?25h");
  }
}
