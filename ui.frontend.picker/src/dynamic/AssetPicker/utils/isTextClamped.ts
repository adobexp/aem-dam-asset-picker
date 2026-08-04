export const isTextClamped = <T extends HTMLElement>(element: T): boolean => {
  return element.scrollHeight > element.clientHeight;
};
