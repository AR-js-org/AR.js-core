export function setParameters(parameters, classObj) {
  if (parameters === undefined) return;
  for (const key in parameters) {
    const newValue = parameters[key];

    if (newValue === undefined) {
      console.warn(`${classObj.className}: '${key}' parameter is undefined.`);
      continue;
    }

    const currentValue = classObj[key];

    if (currentValue === undefined) {
      console.warn(`${classObj.className}: '${key}' parameter is undefined.`);
      continue;
    }

    classObj[key] = newValue;
  }
}

/*export function setParameters(parameters: any, classObj: any) {
    if (parameters === undefined) return;
    for (var key in parameters) {
        var newValue = parameters[key];

        if (newValue === undefined) {
            console.warn( `${classObj.className}: '${key}' parameter is undefined.` )
            continue;
        }

        //@ts-ignore
        var currentValue = classObj.parameters[key];

        if (currentValue === undefined) {
            console.warn( `${classObj.className}: '${key}' is not a property of this material.`);
            continue;
        }
        //@ts-ignore
        classObj.parameters[key] = newValue;
    }
}*/
