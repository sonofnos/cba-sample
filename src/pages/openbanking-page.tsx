import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { accounts } from "@/data/seed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import {
  apiEndpoints,
  getMethodTone,
  sandboxCredentials,
  webhookDocs,
  type ApiEndpointDoc,
} from "@/lib/openbanking";
import { cn } from "@/lib/utils";

type CodeLanguage = "javascript" | "python" | "curl";

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function buildPath(endpoint: ApiEndpointDoc, pathInputs: Record<string, string>) {
  let path = endpoint.path;
  endpoint.pathParams?.forEach((param) => {
    const fallback =
      param.name === "id"
        ? endpoint.id.includes("accounts")
          ? "cust-acct-current"
          : endpoint.id.includes("payments")
            ? "obp-10001"
            : "cust-acct-current"
        : "";
    path = path.replace(`{${param.name}}`, pathInputs[param.name] || fallback);
  });
  return path;
}

function defaultBody(endpoint: ApiEndpointDoc) {
  return JSON.stringify(endpoint.sampleBody ?? {}, null, 2);
}

function generateCodeSnippet(endpoint: ApiEndpointDoc, token: string, path: string, body: string, language: CodeLanguage) {
  const authHeader = token ? `'Authorization': 'Bearer ${token}',\n    ` : "";
  if (language === "javascript") {
    return `fetch('${path}', {\n  method: '${endpoint.method}',\n  headers: {\n    ${authHeader}'Content-Type': 'application/json'\n  }${endpoint.method === "POST" ? `,\n  body: JSON.stringify(${body || "{}"})` : ""}\n}).then((res) => res.json()).then(console.log);`;
  }

  if (language === "python") {
    return `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    '${path}',\n    headers={${token ? `\n        'Authorization': 'Bearer ${token}',` : ""}\n        'Content-Type': 'application/json'\n    }${endpoint.method === "POST" ? `,\n    json=${body || "{}"}` : ""}\n)\nprint(response.json())`;
  }

  return `curl -X ${endpoint.method} '${path}' \\${token ? `\n  -H 'Authorization: Bearer ${token}' \\` : ""}\n  -H 'Content-Type: application/json'${endpoint.method === "POST" ? ` \\\n  -d '${body || "{}"}'` : ""}`;
}

export function OpenBankingPage({ embedded = false }: { embedded?: boolean }) {
  const [activeEndpointId, setActiveEndpointId] = useState(apiEndpoints[0].id);
  const [pathInputs, setPathInputs] = useState<Record<string, string>>({ id: "cust-acct-current" });
  const [requestBody, setRequestBody] = useState(defaultBody(apiEndpoints[0]));
  const [requestResponse, setRequestResponse] = useState<string>("");
  const [requestStatus, setRequestStatus] = useState<number | null>(null);
  const [requestHeaders, setRequestHeaders] = useState("");
  const [tokenResponse, setTokenResponse] = useState<AuthTokenResponse | null>(null);
  const [clientId, setClientId] = useState(sandboxCredentials.clientId);
  const [clientSecret, setClientSecret] = useState(sandboxCredentials.clientSecret);
  const [tokenError, setTokenError] = useState("");
  const [snippetLanguage, setSnippetLanguage] = useState<CodeLanguage>("javascript");
  const [copyMessage, setCopyMessage] = useState("");

  const endpoint = apiEndpoints.find((item) => item.id === activeEndpointId) ?? apiEndpoints[0];
  const resolvedPath = buildPath(endpoint, pathInputs);
  const codeSnippet = generateCodeSnippet(endpoint, tokenResponse?.access_token ?? "", resolvedPath, requestBody, snippetLanguage);

  function setEndpoint(endpointId: string) {
    const next = apiEndpoints.find((item) => item.id === endpointId);
    if (!next) return;
    setActiveEndpointId(endpointId);
    setRequestBody(defaultBody(next));
    setRequestResponse("");
    setRequestStatus(null);
  }

  async function authorize() {
    setTokenError("");
    try {
      const response = await fetch("/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        }),
      });
      const json = (await response.json()) as AuthTokenResponse | { message?: string };
      if (!response.ok) {
        throw new Error("message" in json ? json.message : "Authorization failed");
      }
      setTokenResponse(json as AuthTokenResponse);
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : "Unable to authorize");
    }
  }

  async function tryRequest() {
    setRequestHeaders("");
    try {
      const init: RequestInit = {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
          ...(tokenResponse?.access_token ? { Authorization: `Bearer ${tokenResponse.access_token}` } : {}),
        },
      };

      if (endpoint.method === "POST") {
        init.body = requestBody;
      }

      const response = await fetch(resolvedPath, init);
      const text = await response.text();
      setRequestStatus(response.status);
      setRequestHeaders(JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
      try {
        setRequestResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setRequestResponse(text);
      }
    } catch (error) {
      setRequestStatus(500);
      setRequestResponse(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function copySnippet() {
    await navigator.clipboard.writeText(codeSnippet);
    setCopyMessage("Copied");
    window.setTimeout(() => setCopyMessage(""), 1400);
  }

  const accountPreview = useMemo(
    () =>
      accounts.map((account) => ({
        id: account.id,
        accountNumber: account.accountNumber,
        type: account.type,
      })),
    [],
  );

  return (
    <div className={cn("space-y-8", embedded ? "" : "px-4 py-8 md:px-8")}>
      {embedded ? (
        <PageHeader
          eyebrow="Open Banking"
          title="Developer portal and API sandbox"
          description="Explore PanAfrika Open Banking APIs, authorize sandbox credentials, and test live MSW-backed endpoints in-browser."
        />
      ) : (
        <PageHeader
          eyebrow="Developer"
          title="PanAfrika Open Banking API Sandbox"
          description="A browser-native developer portal for third-party apps integrating with PanAfrika Bank via OAuth-protected REST APIs."
          action={
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-surface-50"
            >
              Launch Core App
            </Link>
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="info">Versioning</Badge><p className="mt-4 text-lg font-semibold">`v1` with additive changes only</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="positive">Sandbox rate limit</Badge><p className="mt-4 text-lg font-semibold">1000 req/hour</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="warning">Production rate limit</Badge><p className="mt-4 text-lg font-semibold">10000 req/hour</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="neutral">Auth</Badge><p className="mt-4 text-lg font-semibold">OAuth 2.0 + consent</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="API overview"
              description="PanAfrika Open Banking exposes account, payments, identity, and FX resources to sandboxed third-party providers using OAuth 2.0 and explicit consent."
            />
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-7 text-muted-foreground">
            <p>Developers obtain a bearer token, redirect users through a consent step, then call versioned REST endpoints scoped to the consented resources. Sandbox credentials are pre-provisioned for portfolio demonstration.</p>
            <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
              <p className="font-medium text-foreground">Consent flow</p>
              <p className="mt-2">1. Client gets access token. 2. User grants consent for accounts, identity, or payments. 3. TPP calls `/v1/*` endpoints with bearer token. 4. Webhooks notify downstream systems of state changes.</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
              <p className="font-medium text-foreground">Sandbox resources</p>
              <p className="mt-2">Preview accounts: {accountPreview.map((account) => `${account.type} (${account.accountNumber})`).join(" · ")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
          <CardHeader className="flex-col items-start gap-3">
            <CardTitle className="text-2xl text-[#F5F0E8]">Authentication</CardTitle>
            <CardDescription className="text-[#F5F0E8]/70">Simulated OAuth 2.0 token issuance with sandbox client credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="client_id">
              <Input value={clientId} onChange={(event) => setClientId(event.target.value)} className="bg-white/95" />
            </Field>
            <Field label="client_secret">
              <Input value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} className="bg-white/95" />
            </Field>
            {tokenError ? <p className="text-sm text-orange-200">{tokenError}</p> : null}
            <Button className="rounded-full" onClick={() => void authorize()}>
              Authorize
            </Button>

            {tokenResponse ? (
              <div className="rounded-[24px] bg-white/10 p-5">
                <p className="text-sm font-medium">Token response</p>
                <pre className="mt-3 overflow-x-auto text-xs leading-6 text-[#F5F0E8]/85">{JSON.stringify(tokenResponse, null, 2)}</pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading title="API explorer" description="Custom-built Swagger-style explorer with live MSW-backed requests." />
          </CardHeader>
          <CardContent className="space-y-4">
            {["Accounts", "Payments", "Identity", "FX"].map((tag) => (
              <div key={tag} className="space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tag}</p>
                {apiEndpoints.filter((endpoint) => endpoint.tag === tag).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEndpoint(item.id)}
                    className={cn(
                      "w-full rounded-[24px] border p-4 text-left transition",
                      activeEndpointId === item.id ? "border-[#0A3D2E] bg-[#0A3D2E] text-[#F5F0E8]" : "border-border bg-secondary/20 hover:border-[#C9A84C]/35",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", activeEndpointId === item.id ? "bg-white/15 text-white" : getMethodTone(item.method))}>
                          {item.method}
                        </span>
                        <p className="mt-3 font-mono text-sm">{item.path}</p>
                        <p className={cn("mt-2 text-sm", activeEndpointId === item.id ? "text-[#F5F0E8]/75" : "text-muted-foreground")}>{item.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", getMethodTone(endpoint.method))}>{endpoint.method}</span>
                <CardTitle className="font-mono text-lg">{endpoint.path}</CardTitle>
              </div>
              <CardDescription>{endpoint.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {endpoint.pathParams?.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {endpoint.pathParams.map((param) => (
                    <Field key={param.name} label={`${param.name} (${param.type})`}>
                      <Input
                        value={pathInputs[param.name] ?? ""}
                        onChange={(event) => setPathInputs((current) => ({ ...current, [param.name]: event.target.value }))}
                        placeholder={param.description}
                      />
                    </Field>
                  ))}
                </div>
              ) : null}

              {endpoint.requestBody?.length ? (
                <>
                  <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                    <p className="text-sm font-medium">Request body schema</p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {endpoint.requestBody.map((field) => (
                        <div key={field.name} className="flex items-start justify-between gap-4">
                          <span className="font-mono text-foreground">{field.name}</span>
                          <span className="text-right">{field.type} · {field.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Field label="Request JSON">
                    <Textarea value={requestBody} onChange={(event) => setRequestBody(event.target.value)} className="min-h-[220px] font-mono" />
                  </Field>
                </>
              ) : null}

              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <p className="text-sm font-medium">Response schema</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {endpoint.responseSchema.map((field) => (
                    <div key={field.name} className="flex items-start justify-between gap-4">
                      <span className="font-mono text-foreground">{field.name}</span>
                      <span className="text-right">{field.type} · {field.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full" onClick={() => void tryRequest()}>Try it</Button>
                <Badge tone={tokenResponse ? "positive" : "warning"}>
                  {tokenResponse ? "Bearer token attached" : "No bearer token attached"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <SectionHeading title="Request / response" description="Live sandbox execution output from the selected endpoint." />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <p className="text-sm font-medium">Resolved request path</p>
                <pre className="mt-3 overflow-x-auto text-sm font-mono">{resolvedPath}</pre>
              </div>
              {requestStatus !== null ? (
                <Badge tone={requestStatus >= 200 && requestStatus < 300 ? "positive" : "danger"}>
                  HTTP {requestStatus}
                </Badge>
              ) : null}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                  <p className="text-sm font-medium">Response headers</p>
                  <pre className="mt-3 min-h-[200px] overflow-x-auto text-xs leading-6">{requestHeaders || "Run a request to inspect headers."}</pre>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                  <p className="text-sm font-medium">Response body</p>
                  <pre className="mt-3 min-h-[200px] overflow-x-auto text-xs leading-6">{requestResponse || "Run a request to inspect the response body."}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading title="Code snippets" description="Generated examples for JavaScript, Python, and cURL using the selected endpoint." />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {(["javascript", "python", "curl"] as CodeLanguage[]).map((language) => (
                <button
                  key={language}
                  type="button"
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    snippetLanguage === language ? "bg-[#0A3D2E] text-[#F5F0E8]" : "bg-secondary/20",
                  )}
                  onClick={() => setSnippetLanguage(language)}
                >
                  {language === "javascript" ? "JavaScript" : language === "python" ? "Python" : "cURL"}
                </button>
              ))}
              <Button variant="outline" className="rounded-full" onClick={() => void copySnippet()}>
                Copy
              </Button>
              {copyMessage ? <Badge tone="positive">{copyMessage}</Badge> : null}
            </div>
            <pre className="overflow-x-auto rounded-[24px] border border-border/70 bg-secondary/20 p-5 text-xs leading-6">{codeSnippet}</pre>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading title="Webhooks" description="Sample event payloads for core account, payment, KYC, and card activity notifications." />
          </CardHeader>
          <CardContent className="space-y-4">
            {webhookDocs.map((webhook) => (
              <div key={webhook.event} className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{webhook.event}</p>
                  <Badge tone="info">POST</Badge>
                </div>
                <pre className="mt-3 overflow-x-auto text-xs leading-6">{JSON.stringify(webhook.payload, null, 2)}</pre>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
