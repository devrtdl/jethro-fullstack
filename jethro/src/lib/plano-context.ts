let _pending: 'acoes' | undefined;

export const planoContext = {
  setOpenAcoes: () => { _pending = 'acoes'; },
  consume: (): 'acoes' | undefined => {
    const v = _pending;
    _pending = undefined;
    return v;
  },
};
