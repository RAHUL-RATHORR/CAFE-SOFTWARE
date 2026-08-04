import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTestOrder, createTestUser } from "@/tests/fixtures";
import {
  mockPermissions,
  mockRestaurant,
  mockSession,
} from "@/tests/helpers/session";

type ProvidersProps = {
  children: ReactNode;
};

function TestProviders({ children }: ProvidersProps) {
  return <>{children}</>;
}

export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  session?: ReturnType<typeof mockSession>;
};

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { session: _session, ...renderOptions } = options;
  void _session;

  const user = userEvent.setup();
  const result = render(ui, {
    wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    ...renderOptions,
  });

  return {
    user,
    ...result,
  };
}

export {
  createTestUser,
  createTestOrder,
  mockSession,
  mockPermissions,
  mockRestaurant,
};
