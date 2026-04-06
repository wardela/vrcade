const pad = (value, length = 2) => String(value).padStart(length, "0");

export const formatLocalDateTime = (date = new Date()) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
};

export const combineDateWithCurrentLocalTime = (dateValue, sourceDate = new Date()) => {
  if (!dateValue) {
    return formatLocalDateTime(sourceDate);
  }

  if (dateValue.includes("T")) {
    return dateValue.replace("T", " ");
  }

  if (dateValue.includes(" ")) {
    return dateValue;
  }

  return `${dateValue} ${pad(sourceDate.getHours())}:${pad(sourceDate.getMinutes())}:${pad(sourceDate.getSeconds())}.${pad(sourceDate.getMilliseconds(), 3)}`;
};
