const storageKeys = {
  apiBase: 'life_ops_harness_ui_api_base',
  sessionId: 'life_ops_harness_ui_session_id',
  timezone: 'life_ops_harness_ui_timezone',
};

const elements = {
  apiBase: document.getElementById('apiBase'),
  checkHealthButton: document.getElementById('checkHealthButton'),
  loadToolsButton: document.getElementById('loadToolsButton'),
  healthCard: document.getElementById('healthCard'),
  healthText: document.getElementById('healthText'),
  toolsList: document.getElementById('toolsList'),
  historyList: document.getElementById('historyList'),
  refreshHistoryButton: document.getElementById('refreshHistoryButton'),
  sessionId: document.getElementById('sessionId'),
  toolName: document.getElementById('toolName'),
  message: document.getElementById('message'),
  inputDate: document.getElementById('inputDate'),
  inputTimezone: document.getElementById('inputTimezone'),
  projectArea: document.getElementById('projectArea'),
  projectStatus: document.getElementById('projectStatus'),
  projectScope: document.getElementById('projectScope'),
  projectLimit: document.getElementById('projectLimit'),
  runButton: document.getElementById('runButton'),
  resetButton: document.getElementById('resetButton'),
  runFeedback: document.getElementById('runFeedback'),
  runFeedbackTitle: document.getElementById('runFeedbackTitle'),
  runFeedbackDetail: document.getElementById('runFeedbackDetail'),
  runMeta: document.getElementById('runMeta'),
  runHints: document.getElementById('runHints'),
  assistantMessage: document.getElementById('assistantMessage'),
  planSteps: document.getElementById('planSteps'),
  toolCalls: document.getElementById('toolCalls'),
  rawJson: document.getElementById('rawJson'),
};

let runHistory = [];

async function loadConfig() {
  const response = await fetch('./config.json');
  return response.json();
}

function getApiBase() {
  return elements.apiBase.value.trim().replace(/\/$/, '');
}

function setHealthState(type, text) {
  elements.healthCard.className = `status-card ${type}`;
  elements.healthText.textContent = text;
}

function renderTools(tools) {
  if (!tools.length) {
    elements.toolsList.className = 'tool-list empty';
    elements.toolsList.textContent = 'No tools registered.';
    return;
  }

  elements.toolsList.className = 'tool-list';
  elements.toolsList.innerHTML = tools
    .map(
      (tool) => `
        <div class="tool-item">
          <strong>${escapeHtml(tool.name)}</strong>
          <div class="meta-line">${escapeHtml(tool.kind)}</div>
          <div>${escapeHtml(tool.description)}</div>
        </div>
      `
    )
    .join('');
}

function renderPlan(plan) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    elements.planSteps.className = 'timeline empty';
    elements.planSteps.textContent = 'No plan yet.';
    return;
  }

  elements.planSteps.className = 'timeline';
  elements.planSteps.innerHTML = plan.steps
    .map(
      (step) => `
        <div class="timeline-item">
          <strong>${escapeHtml(step.title)}</strong>
          <div class="timeline-state ${escapeHtml(step.status)}">${escapeHtml(step.status)}</div>
          ${
            step.description
              ? `<div class="meta-line" style="margin-top:8px;">${escapeHtml(step.description)}</div>`
              : ''
          }
          ${
            step.toolName
              ? `<div class="meta-line" style="margin-top:6px;">tool: ${escapeHtml(step.toolName)}</div>`
              : ''
          }
        </div>
      `
    )
    .join('');
}

function renderToolCalls(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    elements.toolCalls.className = 'tool-calls empty';
    elements.toolCalls.textContent = 'No tool calls yet.';
    return;
  }

  elements.toolCalls.className = 'tool-calls';
  elements.toolCalls.innerHTML = toolCalls
    .map((call) => {
      const body = call.output ?? { errorMessage: call.errorMessage ?? 'No output' };

      return `
        <div class="tool-call-card">
          <strong>${escapeHtml(call.toolName)}</strong>
          <div class="timeline-state ${escapeHtml(call.status)}">${escapeHtml(call.status)}</div>
          <pre class="raw-json" style="margin-top:12px;">${escapeHtml(
            JSON.stringify(body, null, 2)
          )}</pre>
        </div>
      `;
    })
    .join('');
}

function renderAssistantMessage(text) {
  if (!text) {
    elements.assistantMessage.className = 'result-card empty';
    elements.assistantMessage.textContent = 'No assistant message.';
    return;
  }

  elements.assistantMessage.className = 'result-card';
  elements.assistantMessage.textContent = text;
}

function renderRawJson(payload) {
  elements.rawJson.textContent = JSON.stringify(payload, null, 2);
}

function renderDiagnostics(feedback) {
  const tone = feedback?.tone ?? 'muted';
  const title = feedback?.title ?? 'Ready to run';
  const detail =
    feedback?.detail ?? '这里会显示当前 run 的状态摘要，以及失败时最直接的排查建议。';
  const meta = Array.isArray(feedback?.meta) ? feedback.meta : [];
  const hints = Array.isArray(feedback?.hints) ? feedback.hints : [];

  elements.runFeedback.className = `feedback-card ${tone}`;
  elements.runFeedbackTitle.textContent = title;
  elements.runFeedbackDetail.textContent = detail;
  elements.runMeta.innerHTML = meta
    .map((item) => `<span class="meta-badge">${escapeHtml(item)}</span>`)
    .join('');

  if (!hints.length) {
    elements.runHints.className = 'hint-list empty';
    elements.runHints.innerHTML = '';
    return;
  }

  elements.runHints.className = 'hint-list';
  elements.runHints.innerHTML = hints
    .map((hint) => `<li>${escapeHtml(hint)}</li>`)
    .join('');
}

function renderHistory() {
  if (!runHistory.length) {
    elements.historyList.className = 'history-list empty';
    elements.historyList.textContent = 'No runs yet.';
    return;
  }

  elements.historyList.className = 'history-list';
  elements.historyList.innerHTML = runHistory
    .map((entry) => {
      const status = entry.result?.status ?? 'unknown';
      const toolName = entry.request?.toolName || inferToolName(entry.result);
      const summary = entry.request?.message || 'Untitled run';
      const feedback = createFeedbackFromResult(entry.result, entry.request);

      return `
        <button
          class="history-item"
          type="button"
          data-history-id="${escapeHtml(entry.id)}"
          title="Load this run back into the panel"
        >
          <strong>${escapeHtml(truncate(summary, 48))}</strong>
          <div class="meta-line">
            ${escapeHtml(formatShortDate(entry.createdAt))} · ${escapeHtml(status)}${
              toolName ? ` · ${escapeHtml(toolName)}` : ''
            }
          </div>
          <div class="meta-line" style="margin-top: 6px;">
            ${escapeHtml(feedback.title)}
          </div>
        </button>
      `;
    })
    .join('');
}

function inferToolName(result) {
  if (!result || !Array.isArray(result.toolCalls) || !result.toolCalls.length) {
    return '';
  }

  return result.toolCalls[0].toolName ?? '';
}

function resolveEffectiveToolName(request, result = null) {
  return request?.toolName || inferToolName(result) || '';
}

function getToolDataTable(toolName) {
  if (toolName === 'list_today_til') return 'daily_til';
  if (toolName === 'list_today_frogs') return 'daily_frogs';
  if (toolName === 'list_projects') return 'growth_projects';
  return '目标数据表';
}

function getTableNameFromMessage(message, fallbackTableName) {
  if (message.includes('project_todos')) return 'project_todos';
  if (message.includes('growth_projects')) return 'growth_projects';
  if (message.includes('daily_til')) return 'daily_til';
  if (message.includes('daily_frogs')) return 'daily_frogs';
  return fallbackTableName;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function truncate(value, maxLength) {
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function formatShortDate(value) {
  if (!value) return 'Unknown time';

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function createRequestSnapshot() {
  return {
    apiBase: getApiBase(),
    sessionId: elements.sessionId.value.trim() || 'demo-session',
    toolName: elements.toolName.value.trim(),
    message: elements.message.value,
    date: elements.inputDate.value,
    timezone: elements.inputTimezone.value.trim() || 'Asia/Shanghai',
    projectArea: elements.projectArea.value.trim(),
    projectStatus: elements.projectStatus.value.trim(),
    projectScope: elements.projectScope.value.trim(),
    projectLimit: elements.projectLimit.value.trim(),
  };
}

function applyRequestSnapshot(request) {
  const input = request.input && typeof request.input === 'object' ? request.input : {};
  elements.sessionId.value = request.sessionId || 'demo-session';
  elements.toolName.value = request.toolName || '';
  elements.message.value = request.message || '';
  elements.inputDate.value = request.date || '';
  elements.inputTimezone.value = request.timezone || 'Asia/Shanghai';
  elements.projectArea.value = request.projectArea || input.area || '';
  elements.projectStatus.value = request.projectStatus || input.status || '';
  elements.projectScope.value = request.projectScope || input.scope || '';
  elements.projectLimit.value = request.projectLimit || String(input.limit || '');
}

function createMetaFromResult(result, request) {
  const toolCount = Array.isArray(result?.toolCalls) ? result.toolCalls.length : 0;
  const meta = [
    `session ${request.sessionId}`,
    `status ${result?.status ?? 'unknown'}`,
    `tools ${toolCount}`,
  ];

  if (result?.runId) meta.push(`run ${result.runId}`);
  if (result?.createdAt) meta.push(formatShortDate(result.createdAt));

  return meta;
}

function createHintsFromMessage(message, request) {
  const hints = [];
  const toolName = resolveEffectiveToolName(request);
  const tableName = getTableNameFromMessage(message, getToolDataTable(toolName));

  if (!message) {
    return hints;
  }

  if (message.includes('Failed to fetch')) {
    hints.push(`确认 harness/api 正在 ${request.apiBase}/health 上可访问。`);
    hints.push('如果你改过端口，先把左侧 API Base 改成新的地址。');
  }

  if (message.includes('Missing SUPABASE_URL or SUPABASE_ANON_KEY')) {
    hints.push('给 harness/api 配置 Supabase 地址和匿名 key。');
    hints.push('可以放在 process env、harness/api/.env.local、harness/.env.local，或复用 apps/web/.env.local。');
  }

  if (message.includes('Supabase REST query failed (401') || message.includes('Supabase REST query failed (403')) {
    hints.push(`当前 key 或用户 token 没有读取 \`${tableName}\` 的权限。`);
    hints.push('检查 RLS、anon key 权限，以及是否需要透传登录态。');
  }

  if (message.includes('Supabase REST query failed (404')) {
    hints.push(`确认 \`${tableName}\` 表存在，且 Supabase 项目地址没有配错。`);
  }

  if (message.includes('No supported tool matched') || message.includes('当前 scaffold 支持')) {
    hints.push('当前 scaffold 支持 `list_today_frogs`、`list_today_til` 和 `list_projects`。');
    hints.push('可以直接填写 Tool Name，或者把消息写成“看看今天的青蛙”/“看看今天的 TIL”/“看看项目”。');
  }

  if (!hints.length) {
    hints.push('先看 Raw JSON 和 Tool Calls，里面通常能看到最直接的失败原因。');
  }

  return hints.slice(0, 3);
}

function createFeedbackFromResult(result, request) {
  if (!result) {
    return {
      tone: 'muted',
      title: 'Ready to run',
      detail: '这里会显示当前 run 的状态摘要，以及失败时最直接的排查建议。',
      meta: [],
      hints: [],
    };
  }

  if (result.status === 'failed') {
    const detail = result.assistantMessage || 'Harness API run failed.';
    const persistenceFailed = result.persistence?.status === 'failed';

    return {
      tone: persistenceFailed ? 'warning' : 'error',
      title: persistenceFailed ? 'Run failed and history was not saved' : 'Run failed',
      detail: persistenceFailed
        ? `${detail} | persistence: ${result.persistence.errorMessage}`
        : detail,
      meta: createMetaFromResult(result, request),
      hints: createHintsFromMessage(
        persistenceFailed
          ? `${detail} ${result.persistence.errorMessage ?? ''}`
          : detail,
        request
      ),
    };
  }

  const toolCalls = Array.isArray(result.toolCalls) ? result.toolCalls : [];
  const firstToolOutput = toolCalls[0]?.output;
  const toolName = resolveEffectiveToolName(request, result);
  const tableName = getToolDataTable(toolName);

  if (!toolCalls.length) {
    return {
      tone: 'warning',
      title: 'No tool matched',
      detail: result.assistantMessage || 'The current request did not match a supported tool.',
      meta: createMetaFromResult(result, request),
      hints: createHintsFromMessage(result.assistantMessage || '', request),
    };
  }

  if (typeof firstToolOutput?.total === 'number' && firstToolOutput.total === 0) {
    let emptyDetail = '工具已经执行成功，但当前筛选条件下没有查到任何记录。';
    if (toolName === 'list_today_til') {
      emptyDetail = '工具已经执行成功，但当前日期下没有查到任何 TIL 记录。';
    } else if (toolName === 'list_today_frogs') {
      emptyDetail = '工具已经执行成功，但当前日期下没有查到任何青蛙记录。';
    } else if (toolName === 'list_projects') {
      emptyDetail = '工具已经执行成功，但当前筛选条件下没有查到任何项目。';
    }

    return {
      tone: 'info',
      title: 'Run completed with empty result',
      detail: emptyDetail,
      meta: createMetaFromResult(result, request),
      hints: [
        '可以换一个日期再试一次，确认该天是否真的有数据。',
        `如果你预期这里应该有内容，检查 \`${tableName}\` 里对应日期的数据。`,
      ],
    };
  }

  return {
    tone: result.persistence?.status === 'failed' ? 'warning' : 'ok',
    title:
      result.persistence?.status === 'failed'
        ? 'Run completed but history was not saved'
        : 'Run completed',
    detail:
      result.persistence?.status === 'failed'
        ? `${result.assistantMessage || 'The run finished successfully.'} | persistence: ${result.persistence.errorMessage}`
        : result.assistantMessage || 'The run finished successfully.',
    meta: createMetaFromResult(result, request),
    hints:
      result.persistence?.status === 'failed'
        ? ['检查 harness 目录是否可写，以及 `HARNESS_RUNTIME_DIR` 是否指向有效路径。']
        : [],
  };
}

function renderRunPayload(result, request) {
  renderAssistantMessage(result?.assistantMessage || '');
  renderPlan(result?.plan ?? null);
  renderToolCalls(result?.toolCalls ?? []);
  renderRawJson(result ?? {});
  renderDiagnostics(createFeedbackFromResult(result, request));
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text,
    };
  }
}

async function fetchHealth() {
  const response = await fetch(`${getApiBase()}/health`);
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error ?? 'Health request failed');
  }

  setHealthState('ok', `${payload.service} @ ${payload.timestamp}`);
  return payload;
}

async function fetchTools() {
  const response = await fetch(`${getApiBase()}/tools`);
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error ?? 'Tools request failed');
  }

  renderTools(payload.tools ?? []);
  return payload;
}

async function fetchRunHistory({ sessionId, silent = false } = {}) {
  const resolvedSessionId = sessionId || elements.sessionId.value.trim() || 'demo-session';

  if (!silent) {
    elements.historyList.className = 'history-list empty';
    elements.historyList.textContent = 'Loading run history…';
  }

  const response = await fetch(
    `${getApiBase()}/sessions/${encodeURIComponent(resolvedSessionId)}/runs?limit=8`
  );
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error ?? 'Run history request failed');
  }

  runHistory = Array.isArray(payload.runs) ? payload.runs : [];
  renderHistory();
  return payload;
}

async function runAgent() {
  const request = createRequestSnapshot();
  const payload = {
    message: request.message,
    input: {},
  };

  if (request.toolName) payload.toolName = request.toolName;
  if (request.timezone) payload.input.timezone = request.timezone;
  if (request.date) payload.input.date = request.date;
  if (request.projectArea) payload.input.area = request.projectArea;
  if (request.projectStatus) payload.input.status = request.projectStatus;
  if (request.projectScope) payload.input.scope = request.projectScope;
  if (request.projectLimit) payload.input.limit = Number(request.projectLimit);

  const response = await fetch(
    `${request.apiBase}/sessions/${encodeURIComponent(request.sessionId)}/runs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await readJsonResponse(response);
  renderRunPayload(result, request);
  await fetchRunHistory({ sessionId: request.sessionId, silent: true }).catch(() => {});

  const hasHarnessPayload =
    result && typeof result === 'object' && ('status' in result || 'assistantMessage' in result);

  if (!response.ok && !hasHarnessPayload) {
    throw new Error(result.error ?? 'Run failed');
  }

  return result;
}

function resetForm() {
  elements.toolName.value = '';
  elements.message.value = '看看今天的青蛙';
  elements.inputDate.value = '';
  elements.inputTimezone.value = 'Asia/Shanghai';
  elements.projectArea.value = '';
  elements.projectStatus.value = '';
  elements.projectScope.value = '';
  elements.projectLimit.value = '';
  renderAssistantMessage('');
  renderPlan(null);
  renderToolCalls([]);
  renderRawJson({});
  renderDiagnostics(null);
}

function loadHistoryEntry(historyId) {
  const entry = runHistory.find((item) => item.id === historyId);
  if (!entry) return;

  applyRequestSnapshot(entry.request);
  renderRunPayload(entry.result, entry.request);
}

async function initialize() {
  const config = await loadConfig();
  const savedApiBase = localStorage.getItem(storageKeys.apiBase);
  const savedSessionId = localStorage.getItem(storageKeys.sessionId);
  const savedTimezone = localStorage.getItem(storageKeys.timezone);

  elements.apiBase.value = savedApiBase || config.apiBase;
  elements.sessionId.value = savedSessionId || 'demo-session';
  elements.inputTimezone.value = savedTimezone || 'Asia/Shanghai';

  renderHistory();

  elements.apiBase.addEventListener('change', () => {
    localStorage.setItem(storageKeys.apiBase, elements.apiBase.value.trim());
  });

  elements.sessionId.addEventListener('change', () => {
    const nextSessionId = elements.sessionId.value.trim();
    localStorage.setItem(storageKeys.sessionId, nextSessionId);
    fetchRunHistory({ sessionId: nextSessionId }).catch((error) => {
      elements.historyList.className = 'history-list empty';
      elements.historyList.textContent =
        error instanceof Error ? error.message : String(error);
    });
  });

  elements.inputTimezone.addEventListener('change', () => {
    localStorage.setItem(storageKeys.timezone, elements.inputTimezone.value.trim());
  });

  elements.checkHealthButton.addEventListener('click', async () => {
    try {
      setHealthState('muted', 'Checking API health…');
      await fetchHealth();
    } catch (error) {
      setHealthState('error', error instanceof Error ? error.message : String(error));
    }
  });

  elements.loadToolsButton.addEventListener('click', async () => {
    try {
      await fetchTools();
    } catch (error) {
      renderTools([]);
      setHealthState('error', error instanceof Error ? error.message : String(error));
    }
  });

  elements.runButton.addEventListener('click', async () => {
    elements.runButton.disabled = true;
    elements.runButton.textContent = 'Running…';

    const request = createRequestSnapshot();

    renderDiagnostics({
      tone: 'info',
      title: 'Running request',
      detail: '正在调用 harness/api，请稍等结果返回。',
      meta: [`session ${request.sessionId}`, request.toolName ? `tool ${request.toolName}` : 'tool auto-match'],
      hints: [],
    });

    try {
      await runAgent();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      renderAssistantMessage(message);
      renderDiagnostics({
        tone: 'error',
        title: 'Run request failed before completion',
        detail: message,
        meta: [`session ${request.sessionId}`],
        hints: createHintsFromMessage(message, request),
      });
    } finally {
      elements.runButton.disabled = false;
      elements.runButton.textContent = 'Run Agent';
    }
  });

  elements.resetButton.addEventListener('click', resetForm);
  elements.refreshHistoryButton.addEventListener('click', () => {
    fetchRunHistory().catch((error) => {
      elements.historyList.className = 'history-list empty';
      elements.historyList.textContent =
        error instanceof Error ? error.message : String(error);
    });
  });
  elements.historyList.addEventListener('click', (event) => {
    const trigger =
      event.target instanceof Element ? event.target.closest('[data-history-id]') : null;
    if (!trigger) return;

    loadHistoryEntry(trigger.dataset.historyId);
  });

  renderRawJson({});
  renderDiagnostics(null);
  setHealthState('muted', 'Checking API health…');

  try {
    await fetchHealth();
  } catch (error) {
    setHealthState('error', error instanceof Error ? error.message : String(error));
  }

  try {
    await fetchTools();
  } catch (error) {
    renderTools([]);
  }

  try {
    await fetchRunHistory({ sessionId: elements.sessionId.value.trim(), silent: true });
  } catch (error) {
    elements.historyList.className = 'history-list empty';
    elements.historyList.textContent =
      error instanceof Error ? error.message : String(error);
  }
}

initialize().catch((error) => {
  setHealthState('error', error instanceof Error ? error.message : String(error));
  renderDiagnostics({
    tone: 'error',
    title: 'UI initialization failed',
    detail: error instanceof Error ? error.message : String(error),
    meta: [],
    hints: [],
  });
});
