export async function generateApiKey(hostname: string, appname: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${hostname}${appname}${Date.now()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}
