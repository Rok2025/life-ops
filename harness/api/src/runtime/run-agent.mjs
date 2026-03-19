import { createId } from '../lib/ids.mjs';
import { resolveToolIntent } from './intent-router.mjs';
import { getTool } from './tools/registry.mjs';

function createNoopRunResult({ sessionId, message, now, reason }) {
  const runId = createId('run');

  return {
    sessionId,
    runId,
    mode: 'deterministic-scaffold',
    status: 'completed',
    createdAt: now,
    startedAt: now,
    finishedAt: now,
    plan: {
      goal: message || 'No message provided',
      steps: [
        {
          id: 'step_understand_request',
          title: 'Understand request',
          status: 'completed',
        },
        {
          id: 'step_match_tool',
          title: 'Match a supported tool',
          status: 'blocked',
          description: reason,
        },
      ],
    },
    toolCalls: [],
    assistantMessage:
      '当前 scaffold 支持 `list_today_frogs`、`list_today_til` 和 `list_projects`。你可以直接指定 toolName，或者说“看看今天的青蛙”/“看看今天的 TIL”/“看看项目”。',
  };
}

export async function runAgent({
  sessionId,
  message = '',
  toolName = null,
  input = {},
  authToken = null,
  config,
}) {
  const startedAt = new Date().toISOString();
  const selectedToolName = resolveToolIntent({ message, toolName });

  if (!selectedToolName) {
    return createNoopRunResult({
      sessionId,
      message,
      now: startedAt,
      reason: 'No supported tool matched the current request.',
    });
  }

  const tool = getTool(selectedToolName);

  if (!tool) {
    return createNoopRunResult({
      sessionId,
      message,
      now: startedAt,
      reason: `Tool "${selectedToolName}" is not registered.`,
    });
  }

  const runId = createId('run');
  const toolCallId = createId('toolcall');

  const plan = {
    goal: message || `Run tool ${selectedToolName}`,
    steps: [
      {
        id: 'step_understand_request',
        title: 'Understand request',
        status: 'completed',
      },
      {
        id: 'step_execute_tool',
        title: `Execute ${selectedToolName}`,
        status: 'in_progress',
        toolName: selectedToolName,
      },
      {
        id: 'step_summarize_result',
        title: 'Summarize result',
        status: 'pending',
      },
    ],
  };

  try {
    const output = await tool.execute(input, {
      sessionId,
      runId,
      authToken,
      config,
      defaultTimezone: config.defaultTimezone,
      now: startedAt,
    });

    plan.steps[1].status = 'completed';
    plan.steps[2].status = 'completed';
    const finishedAt = new Date().toISOString();

    return {
      sessionId,
      runId,
      mode: 'deterministic-scaffold',
      status: 'completed',
      createdAt: startedAt,
      startedAt,
      finishedAt,
      plan,
      toolCalls: [
        {
          id: toolCallId,
          toolName: selectedToolName,
          status: 'completed',
          input,
          output,
        },
      ],
      assistantMessage: `已执行工具 \`${selectedToolName}\`，返回 ${output.total ?? 0} 条结果。`,
    };
  } catch (error) {
    plan.steps[1].status = 'blocked';
    const finishedAt = new Date().toISOString();

    return {
      sessionId,
      runId,
      mode: 'deterministic-scaffold',
      status: 'failed',
      createdAt: startedAt,
      startedAt,
      finishedAt,
      plan,
      toolCalls: [
        {
          id: toolCallId,
          toolName: selectedToolName,
          status: 'failed',
          input,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      ],
      assistantMessage:
        error instanceof Error ? error.message : 'Harness API run failed.',
    };
  }
}
