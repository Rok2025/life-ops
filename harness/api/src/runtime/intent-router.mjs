export function resolveToolIntent({ message = '', toolName = null }) {
  if (toolName) return toolName;

  const normalized = message.toLowerCase();
  const mentionsFrogs =
    normalized.includes('frog') ||
    normalized.includes('frogs') ||
    message.includes('青蛙') ||
    message.includes('三只青蛙');

  if (mentionsFrogs) {
    return 'list_today_frogs';
  }

  const mentionsTil =
    normalized.includes('til') ||
    normalized.includes('today i learned') ||
    message.includes('学到了什么') ||
    message.includes('今天学到了什么') ||
    message.includes('今日学习') ||
    message.includes('今日 til') ||
    message.includes('今天的TIL') ||
    message.includes('今天的til') ||
    message.includes('看看今天的 TIL') ||
    message.includes('看看今天的til');

  if (mentionsTil) {
    return 'list_today_til';
  }

  const mentionsProjects =
    normalized.includes('project') ||
    normalized.includes('projects') ||
    message.includes('项目') ||
    message.includes('项目管理');

  if (mentionsProjects) {
    return 'list_projects';
  }

  return null;
}
