const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  for (const el in obj) {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  }
  return newObj;
};

module.exports = filterObject;
