export const getFormattedDate = (date: string): string => {
  const dateInstance = new Date(date);

  const formattedDate = `${dateInstance.getFullYear()}-${`${
    dateInstance.getMonth() + 1
  }`.padStart(2, "0")}-${dateInstance.getDate()}`;

  return formattedDate;
};
