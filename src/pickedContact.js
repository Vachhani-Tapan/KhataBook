let picked = null;

export const setPickedContact = (contact) => { picked = contact; };

export const takePickedContact = () => {
  const c = picked;
  picked = null;
  return c;
};