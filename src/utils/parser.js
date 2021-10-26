export const extractor = function (str) {
  const funcs = {};
  str.split('\n').map(x => getParams(x)).filter(x => x && x.name.slice(0, 2) !== '__').forEach(x => {
    funcs[x.name] = x;
  });
  return funcs;
};

function getParams(str) {
  let cleanStr = str.replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
  const first = 'export function ';
  if (!cleanStr.includes(first)) return;
  cleanStr = cleanStr.split(first)[1];

  const paramStartIndex = cleanStr.indexOf('(');
  const paramEndIndex = cleanStr.indexOf(')');
  const funcName = cleanStr.slice(0, paramStartIndex);
  const rawParams = cleanStr.slice(paramStartIndex + 1, paramEndIndex);
  const params = {};
  rawParams.split(', ').forEach(x => {
    const a = x.split(': ');
    if (a[0]) {
      params[a[0]] = a[1];
    }
  });

  const returnType = cleanStr.slice(paramEndIndex + 3, cleanStr.length - 1);
  return { name: funcName, paramsType: params, returnType: returnType };
}