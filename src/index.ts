#!/usr/bin/env node
import { parseArgs, cmdLogin, cmdCredit, cmdSend, cmdEmail, cmdOtp, cmdVerify, cmdEmailOtp, cmdEmailVerify, cmdProfiles, cmdHelp } from "./cli.js";
import { startServer } from "./transport.js";
import { TOOLS, handleToolCall } from "./server.js";

const [cmd, ...rest] = process.argv.slice(2);
const { args, flags } = parseArgs(rest);

switch (cmd) {
  case "login":        await cmdLogin(flags); break;
  case "credit":       await cmdCredit(flags); break;
  case "send":         await cmdSend(args, flags); break;
  case "email":        await cmdEmail(args, flags); break;
  case "otp":          await cmdOtp(args, flags); break;
  case "verify":       await cmdVerify(args, flags); break;
  case "email-otp":    await cmdEmailOtp(args, flags); break;
  case "email-verify": await cmdEmailVerify(args, flags); break;
  case "profiles":     cmdProfiles(); break;
  case "serve":        startServer({ tools: TOOLS, onToolCall: handleToolCall }); break;
  case "help":         cmdHelp(args); break;
  case undefined:      startServer({ tools: TOOLS, onToolCall: handleToolCall }); break;
  default:             cmdHelp([]); break;
}
