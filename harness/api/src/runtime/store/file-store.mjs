import fs from 'node:fs/promises';
import path from 'node:path';
import { createId } from '../../lib/ids.mjs';

const storeFileName = 'runtime-store.json';
let storeQueue = Promise.resolve();

function createEmptyStore() {
  return {
    version: 1,
    sessions: [],
    messages: [],
    runs: [],
    toolCalls: [],
    approvalRequests: [],
  };
}

function normalizeStore(store) {
  const next = store && typeof store === 'object' ? store : {};

  return {
    version: 1,
    sessions: Array.isArray(next.sessions) ? next.sessions : [],
    messages: Array.isArray(next.messages) ? next.messages : [],
    runs: Array.isArray(next.runs) ? next.runs : [],
    toolCalls: Array.isArray(next.toolCalls) ? next.toolCalls : [],
    approvalRequests: Array.isArray(next.approvalRequests) ? next.approvalRequests : [],
  };
}

function toJsonValue(value, fallback = {}) {
  if (value == null) return fallback;
  return JSON.parse(JSON.stringify(value));
}

function truncateText(value, maxLength = 80) {
  if (!value) return null;
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

async function ensureStoreFile(runtimeDir) {
  await fs.mkdir(runtimeDir, { recursive: true });
  const filePath = path.join(runtimeDir, storeFileName);

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(createEmptyStore(), null, 2));
  }

  return filePath;
}

async function readStoreFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return normalizeStore(JSON.parse(raw));
  } catch {
    return createEmptyStore();
  }
}

async function writeStoreFile(filePath, store) {
  const next = normalizeStore(store);
  const tempFilePath = `${filePath}.tmp`;
  await fs.writeFile(tempFilePath, JSON.stringify(next, null, 2));
  await fs.rename(tempFilePath, filePath);
}

async function getStoreSnapshot(config) {
  await storeQueue.catch(() => undefined);
  const filePath = await ensureStoreFile(config.runtimeDir);
  return readStoreFile(filePath);
}

function upsertSession({ store, sessionId, request, result }) {
  const startedAt = result.startedAt ?? result.createdAt ?? new Date().toISOString();
  const finishedAt = result.finishedAt ?? startedAt;
  const existingSession = store.sessions.find((session) => session.id === sessionId);
  const fallbackTitle = truncateText(request.message?.trim() || '', 60);

  if (existingSession) {
    existingSession.title = existingSession.title ?? fallbackTitle;
    existingSession.status = result.status === 'failed' ? 'error' : 'active';
    existingSession.mode = result.mode ?? existingSession.mode ?? 'assistant';
    existingSession.latestSummary = result.assistantMessage ?? existingSession.latestSummary ?? null;
    existingSession.contextSnapshot = toJsonValue(existingSession.contextSnapshot, {});
    existingSession.metadata = {
      ...toJsonValue(existingSession.metadata, {}),
      lastRequest: toJsonValue(request, {}),
      lastRunId: result.runId,
      lastFinishedAt: finishedAt,
    };
    existingSession.updatedAt = finishedAt;
    return existingSession;
  }

  const nextSession = {
    id: sessionId,
    title: fallbackTitle,
    status: result.status === 'failed' ? 'error' : 'active',
    mode: result.mode ?? 'assistant',
    latestSummary: result.assistantMessage ?? null,
    contextSnapshot: {},
    metadata: {
      lastRequest: toJsonValue(request, {}),
      lastRunId: result.runId,
      lastFinishedAt: finishedAt,
    },
    createdAt: startedAt,
    updatedAt: finishedAt,
  };

  store.sessions.push(nextSession);
  return nextSession;
}

function createHistoryEntry({ run, request, assistantMessage, plan, toolCalls }) {
  return {
    id: run.id,
    createdAt: run.startedAt,
    request: {
      sessionId: run.sessionId,
      message: request.message ?? '',
      toolName: request.toolName ?? '',
      date: request.input?.date ?? '',
      timezone: request.input?.timezone ?? '',
      input: toJsonValue(request.input, {}),
    },
    result: {
      sessionId: run.sessionId,
      runId: run.id,
      mode: run.metadata?.mode ?? 'deterministic-scaffold',
      status: run.status,
      createdAt: run.startedAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      plan,
      toolCalls,
      assistantMessage: assistantMessage ?? run.resultSummary ?? '',
    },
  };
}

export async function recordRun({ config, sessionId, request, result }) {
  return (storeQueue = storeQueue.catch(() => undefined).then(async () => {
    const filePath = await ensureStoreFile(config.runtimeDir);
    const store = await readStoreFile(filePath);

    upsertSession({ store, sessionId, request, result });

    const userMessageId = createId('msg');
    store.messages.push({
      id: userMessageId,
      sessionId,
      role: 'user',
      content: request.message ?? '',
      structuredContent: {
        input: toJsonValue(request.input, {}),
        toolName: request.toolName ?? null,
      },
      toolName: request.toolName ?? null,
      toolCallId: null,
      createdAt: result.startedAt ?? result.createdAt ?? new Date().toISOString(),
    });

    let assistantMessageId = null;
    if (result.assistantMessage) {
      assistantMessageId = createId('msg');
      store.messages.push({
        id: assistantMessageId,
        sessionId,
        role: 'assistant',
        content: result.assistantMessage,
        structuredContent: {
          runId: result.runId,
          plan: toJsonValue(result.plan, null),
        },
        toolName: null,
        toolCallId: null,
        createdAt: result.finishedAt ?? result.createdAt ?? new Date().toISOString(),
      });
    }

    store.runs = store.runs.filter((run) => run.id !== result.runId);
    store.runs.push({
      id: result.runId,
      sessionId,
      trigger: 'user',
      status: result.status,
      model: null,
      userMessageId,
      resultSummary: result.assistantMessage ?? null,
      errorMessage: result.status === 'failed' ? result.assistantMessage ?? null : null,
      metadata: {
        mode: result.mode ?? 'deterministic-scaffold',
        request: toJsonValue(request, {}),
        assistantMessage: result.assistantMessage ?? null,
        assistantMessageId,
        plan: toJsonValue(result.plan, null),
      },
      startedAt: result.startedAt ?? result.createdAt ?? new Date().toISOString(),
      finishedAt: result.finishedAt ?? result.createdAt ?? new Date().toISOString(),
    });

    store.toolCalls = store.toolCalls.filter((toolCall) => toolCall.runId !== result.runId);
    for (const toolCall of Array.isArray(result.toolCalls) ? result.toolCalls : []) {
      store.toolCalls.push({
        id: toolCall.id,
        sessionId,
        runId: result.runId,
        toolName: toolCall.toolName,
        kind: toolCall.kind ?? 'read',
        status: toolCall.status,
        input: toJsonValue(toolCall.input, {}),
        output: toJsonValue(toolCall.output, {}),
        errorMessage: toolCall.errorMessage ?? null,
        approvalRequestId: null,
        createdAt: result.startedAt ?? result.createdAt ?? new Date().toISOString(),
        finishedAt: result.finishedAt ?? result.createdAt ?? new Date().toISOString(),
      });
    }

    await writeStoreFile(filePath, store);
  }));
}

export async function listSessionRuns({ config, sessionId, limit = 20 }) {
  const store = await getStoreSnapshot(config);
  const session = store.sessions.find((entry) => entry.id === sessionId) ?? null;
  const messagesById = new Map(store.messages.map((message) => [message.id, message]));
  const toolCallsByRunId = new Map();

  for (const toolCall of store.toolCalls) {
    if (!toolCallsByRunId.has(toolCall.runId)) {
      toolCallsByRunId.set(toolCall.runId, []);
    }

    toolCallsByRunId.get(toolCall.runId).push(toolCall);
  }

  const runs = store.runs
    .filter((run) => run.sessionId === sessionId)
    .sort((left, right) => {
      const leftTime = Date.parse(left.startedAt ?? left.finishedAt ?? 0);
      const rightTime = Date.parse(right.startedAt ?? right.finishedAt ?? 0);
      return rightTime - leftTime;
    })
    .slice(0, limit)
    .map((run) => {
      const request = toJsonValue(run.metadata?.request, {});
      const assistantMessage =
        run.metadata?.assistantMessage ??
        messagesById.get(run.metadata?.assistantMessageId ?? '')?.content ??
        run.resultSummary ??
        '';
      const plan = toJsonValue(run.metadata?.plan, null);
      const toolCalls = (toolCallsByRunId.get(run.id) ?? []).sort((left, right) => {
        const leftTime = Date.parse(left.createdAt ?? left.finishedAt ?? 0);
        const rightTime = Date.parse(right.createdAt ?? right.finishedAt ?? 0);
        return leftTime - rightTime;
      });

      return createHistoryEntry({
        run,
        request: {
          message: request.message ?? messagesById.get(run.userMessageId ?? '')?.content ?? '',
          toolName: request.toolName ?? '',
          input: toJsonValue(request.input, {}),
        },
        assistantMessage,
        plan,
        toolCalls,
      });
    });

  return {
    session,
    runs,
  };
}
