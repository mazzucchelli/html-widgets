export const snakeToCamel = (str: string) =>
  str.replace(/([-_][a-z0-9])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );

const cleanDatasetKey = (key: string, selector: string) => {
  const cleaned = key.replace(selector, "");
  return `${cleaned.charAt(0).toLocaleLowerCase()}${cleaned.slice(1)}`;
};

const filterDataset = (dataset: DOMStringMap, selector: string) => {
  const options = { ...dataset };
  return Object.keys(options).filter((entry) => entry.includes(selector));
};

export const convertType = (value: any, unquote?: boolean) => {
  if (value.includes("{") && value.includes("}")) {
    return JSON.parse(value.replace(/'/g, '"'));
  } else if (value.includes("[") && value.includes("]")) {
    const cleanedArr = value.replace("[", "").replace("]", "");
    return cleanedArr.split(",").map((el: any) => {
      return convertType(el.trim(), true);
    });
  } else {
    switch (value) {
      case "false":
        return false;
      case "true":
        return true;
      case "null":
        return null;
      default:
        return typeof parseFloat(value) === "number"
          ? parseFloat(value)
          : value;
    }
  }
};

export const parseDataset = (dataset: DOMStringMap, selector: string) => {
  const res: { [x: string]: any } = {};
  const filteredKeys = filterDataset(dataset, selector);
  console.log("filteredKeys", filteredKeys);
  filteredKeys.forEach((entry) => {
    let cleanEntry = cleanDatasetKey(entry, selector);
    res[cleanEntry] = convertType(dataset[entry]);
  });

  return res;
};
