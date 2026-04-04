import { HttpResponse, http } from "msw";
import { mockState } from "@/data";
import { withNetworkDiscipline } from "@/mocks/utils";

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || body.password !== "panafrika") {
      return HttpResponse.json({ message: "Invalid demo credentials" }, { status: 401 });
    }

    return HttpResponse.json(
      {
        token: `demo-jwt-${Date.now()}`,
        user: mockState.bank.user,
      },
      { status: 200 },
    );
  }),

  http.get("/api/auth/session", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          authenticated: true,
          user: mockState.bank.user,
        },
      },
      { status: 200 },
    );
  }),
];
