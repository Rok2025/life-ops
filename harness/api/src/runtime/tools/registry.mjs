import { listTodayFrogsTool } from './list-today-frogs.mjs';
import { listProjectsTool } from './list-projects.mjs';
import { listTodayTilTool } from './list-today-til.mjs';

const tools = [listTodayFrogsTool, listTodayTilTool, listProjectsTool];

export function getTool(name) {
  return tools.find((tool) => tool.name === name) ?? null;
}

export function listTools() {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    kind: tool.kind,
  }));
}
