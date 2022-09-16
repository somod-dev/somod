import { Command, executeCommand } from "nodejs-cli-runner";
import { CreateSomodAction, decorateCommand } from "./action";
export * from "./config";

const command = new Command("create-somod");
decorateCommand(command);
command.action(CreateSomodAction);

executeCommand(command);
