#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

const DEFAULT_API_URL = 'https://life-ops-web.vercel.app';
const KEYCHAIN_SERVICE = 'lifeops-cli';
const KEYCHAIN_ACCOUNT = 'default';

function printUsage() {
  console.log(`Life OPS CLI

Usage:
  lifeops login [--device-name <name>]
  lifeops logout
  lifeops whoami [--json]
  lifeops tools [--json]
  lifeops run log_finance_transaction --input <json|@file> [--json]
`);
}

function getOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] ?? null;
}

function hasOption(args, name) {
  return args.includes(name);
}

function getApiUrl() {
  return (process.env.LIFEOPS_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
}

function readKeychainToken() {
  if (process.env.LIFEOPS_TOKEN) return process.env.LIFEOPS_TOKEN;
  if (platform() !== 'darwin') return null;
  try {
    return execFileSync('security', ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function saveKeychainToken(token) {
  if (platform() !== 'darwin') throw new Error('当前 v1 CLI 只支持 macOS Keychain。');
  execFileSync('security', ['add-generic-password', '-U', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w', token], {
    stdio: 'ignore',
  });
}

function deleteKeychainToken() {
  if (platform() !== 'darwin') return;
  try {
    execFileSync('security', ['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT], { stdio: 'ignore' });
  } catch {
    // Logging out without a saved token is already successful.
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${getApiUrl()}${path}`, options);
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `请求失败（HTTP ${response.status}）`);
  return body;
}

function printResult(value, json) {
  if (json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  if (value?.confirmation) {
    console.log(`✓ ${value.confirmation}`);
    return;
  }
  console.log(JSON.stringify(value, null, 2));
}

function openBrowser(url) {
  if (platform() === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}

async function login(args) {
  const deviceName = getOption(args, '--device-name') || `${process.env.USER || 'Life OPS'}@${homedir().split('/').pop() || 'macOS'}`;
  const start = await request('/api/v1/cli/device/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_name: deviceName, scopes: ['tools:read', 'finance:write'] }),
  });
  console.log(`请在浏览器确认授权：\n${start.verification_uri_complete}\n\n授权码：${start.user_code}`);
  openBrowser(start.verification_uri_complete);
  const deadline = Date.now() + start.expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, start.interval * 1000));
    try {
      const exchange = await request('/api/v1/cli/device/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_code: start.device_code }),
      });
      saveKeychainToken(exchange.access_token);
      console.log('✓ 设备已授权，Token 已保存到 macOS Keychain。');
      return;
    } catch (error) {
      if (error instanceof Error && error.message === 'authorization_pending') continue;
      throw error;
    }
  }
  throw new Error('设备授权已超时，请重新执行 lifeops login。');
}

function getAuthenticatedHeaders(extra = {}) {
  const token = readKeychainToken();
  if (!token) throw new Error('尚未登录，请先执行 lifeops login。');
  return { Authorization: `Bearer ${token}`, ...extra };
}

function readInput(value) {
  if (!value) throw new Error('缺少 --input <json|@file>。');
  const raw = value.startsWith('@') ? readFileSync(value.slice(1), 'utf8') : value;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('--input 必须是有效 JSON，或使用 @文件路径。');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const json = hasOption(args, '--json');
  if (!command || command === 'help' || command === '--help' || command === '-h') return printUsage();
  if (command === 'login') return login(args.slice(1));
  if (command === 'logout') {
    const token = readKeychainToken();
    if (token && !process.env.LIFEOPS_TOKEN) {
      await request('/api/v1/cli/tokens/revoke', { method: 'POST', headers: getAuthenticatedHeaders() }).catch(() => undefined);
    }
    deleteKeychainToken();
    console.log('✓ 已退出此设备。');
    return;
  }
  if (command === 'whoami') {
    return printResult(await request('/api/v1/cli/whoami', { headers: getAuthenticatedHeaders() }), json);
  }
  if (command === 'tools') {
    return printResult(await request('/api/v1/tools', { headers: getAuthenticatedHeaders() }), json);
  }
  if (command === 'run') {
    const toolName = args[1];
    if (!toolName) throw new Error('缺少 Tool 名称。');
    const input = readInput(getOption(args, '--input'));
    const result = await request(`/api/v1/tools/${encodeURIComponent(toolName)}`, {
      method: 'POST',
      headers: getAuthenticatedHeaders({
        'Content-Type': 'application/json',
        'Idempotency-Key': `cli_${randomBytes(20).toString('base64url')}`,
      }),
      body: JSON.stringify(input),
    });
    return printResult(result, json);
  }
  throw new Error(`未知命令：${command}`);
}

main().catch((error) => {
  console.error(`lifeops: ${error instanceof Error ? error.message : '未知错误'}`);
  process.exitCode = 1;
});
