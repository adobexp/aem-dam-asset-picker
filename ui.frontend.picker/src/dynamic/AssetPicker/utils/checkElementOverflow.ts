export const checkElementOverflow = (element: HTMLElement) => {
  return element.offsetWidth < element.scrollWidth || element.offsetHeight < element.scrollHeight;
};
