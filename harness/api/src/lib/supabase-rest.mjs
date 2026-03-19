function createHeaders(config, authToken) {
  const headers = {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${authToken ?? config.supabaseAnonKey}`,
    Accept: 'application/json',
  };

  return headers;
}

export async function selectRows({
  config,
  table,
  query = {},
  authToken = null,
}) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY for harness/api');
  }

  const url = new URL(`/rest/v1/${table}`, config.supabaseUrl);

  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders(config, authToken),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase REST query failed for ${table} (${response.status}): ${text}`);
  }

  return response.json();
}
