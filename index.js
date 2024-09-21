import { code } from "./code.js";
import { code as makeComments } from "./makeComment.js";
import { code as users } from "./user.js";
import { code as comments } from "./comment.js";
import fs from "fs";

const coderes = await code();

// const j = JSON.stringify(coderes, null, 2);
// await fs.promises.writeFile("coderes.json", j);

const usersres = await users();
const makeCommentsres = await makeComments({
  output: coderes,
  users: usersres,
});

// console.log(
//   commentsres.toComment.NECESSARY_FIELD.length,
//   commentsres.toComment.ONGOING_NECESSARY_FIELD.length,
//   commentsres.toComment.DUE_DATE_PASSED.length
// );

// const json = JSON.stringify(commentsres, null, 2);
// await fs.promises.writeFile("comments.json", json);

const commentsRes = await comments({ input: makeCommentsres });
console.log(commentsRes);
// console.log(res.message);
