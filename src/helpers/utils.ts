export const convertType = (value: any) => {
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) {
    return JSON.parse(value.replace(/'/g, '"'));
  } else {
    switch (value) {
      case "false":
        return false;
      case "true":
        return true;
      case "null":
        return null;
      default:
        return !isNaN(value) ? parseFloat(value) : value;
    }
  }
};
