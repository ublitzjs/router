import { Type } from "@sinclair/typebox";
import { basicParseSimpleBody } from "@ublitzjs/payload";
import { checkContentLength } from "@ublitzjs/core";
var dictionary = {
  query: "getQuery",
  headers: "getHeader",
  params: "getParameter",
};
export function jsonSchemas(schemas) {
  //#region something
  var { body } = schemas;
  delete schemas.body;
  var opts = { schemas: { meta: Type.Object(schemas) } };
  //#endregion

  //#region parseBody (if needed)
  if (body) {
    opts.schemas.body = body;
    opts.parseBody = new Function(
      "parse",
      "return async(res,_,meta)=>{return await parse({res,CT:'application/json'})}"
    )(basicParseSimpleBody);
  }
  //#endregion

  //#region get meta function
  var getMetaCode = `return (res,req)=>{${body ? "cl(res,req);" : ""}return{`;
  for (const key in schemas) {
    getMetaCode += `${key}:{`;
    for (const prop in schemas[key].properties)
      getMetaCode += `"${prop}":req.${dictionary[key]}("${prop}"),`;
    getMetaCode += "},";
  }
  getMetaCode += "}}";
  opts.getMeta = new Function("cl", getMetaCode)(checkContentLength);
  //#endregion

  return opts;
}
