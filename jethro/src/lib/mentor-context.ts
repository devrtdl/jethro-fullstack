let _pending: string | undefined;

export const mentorContext = {
  set: (msg: string) => {
    _pending = msg;
  },
  consume: (): string | undefined => {
    const m = _pending;
    _pending = undefined;
    return m;
  },
};
