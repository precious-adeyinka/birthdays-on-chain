import moment from "moment";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const formatAddress = (addr: `0x${string}` | undefined) => {
  if (addr) {
    const upperAfterLastTwo = addr.slice(0, 2) + addr.slice(2);
    return `${upperAfterLastTwo.substring(
      0,
      5
    )}...${upperAfterLastTwo.substring(39)}`;
  }
  return "0x";
};

export const formatNumber = (number: number) => {
  // Check if the number is equal to 1 billion
  if (number === 1e9) {
    return (number / 1e9).toFixed(0) + "B";
  }
  // Check if the number is greater than 1 billion
  if (number >= 1e9) {
    return (number / 1e9).toFixed(1) + "B+";
  }
  // Check if the number is equal to 1 million
  else if (number === 1e6) {
    return (number / 1e6).toFixed(0) + "M";
  }
  // Check if the number is greater than 1 million
  else if (number >= 1e6) {
    return (number / 1e6).toFixed(1) + "M+";
  }
  // Check if the number isequal to 1 thousand
  else if (number === 1e3) {
    return (number / 1e3).toFixed(0) + "k";
  }
  // Check if the number is greater than 1 thousand
  else if (number >= 1e3) {
    return (number / 1e3).toFixed(1) + "k+";
  }
  // If the number is smaller than 1 thousand, just return the number
  else {
    return number.toString();
  }
};

export const formatCurrentDate = (timestamp: number) => {
  const date = new Date(Number(timestamp));
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  function getDaySuffix(day: number) {
    if ([1, 21, 31].includes(day)) return "st";
    if ([2, 22].includes(day)) return "nd";
    if ([3, 23].includes(day)) return "rd";
    return "th";
  }

  return `${month} ${day}${getDaySuffix(day)} ${year}`;
};

export const formatToBirthdayTimeline = (number: number): string => {
  const suffix = getOrdinalSuffix(number);
  return `Your ${number}${suffix} birthday`;
};

const getOrdinalSuffix = (number: number): string => {
  const lastDigit = number % 10;
  const lastTwoDigits = number % 100;

  if (lastTwoDigits === 11 || lastTwoDigits === 12 || lastTwoDigits === 13) {
    return "th";
  } else if (lastDigit === 1) {
    return "st";
  } else if (lastDigit === 2) {
    return "nd";
  } else if (lastDigit === 3) {
    return "rd";
  } else {
    return "th";
  }
};

export const formatBirthday = (timestamp: number): string => {
  const formattedDate = moment.unix(timestamp).format("MMMM D YYYY");
  const day = moment.unix(timestamp).date();
  const suffix = getBirthdaySuffix(day);

  return formattedDate.replace(/(\d+)/, `${day}${suffix}`);
};

const getBirthdaySuffix = (day: number): string => {
  if (day >= 11 && day <= 13) {
    return "th";
  } else if (day % 10 === 1) {
    return "st";
  } else if (day % 10 === 2) {
    return "nd";
  } else if (day % 10 === 3) {
    return "rd";
  } else {
    return "th";
  }
};
