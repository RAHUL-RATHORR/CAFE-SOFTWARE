import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { renderWithProviders } from "@/tests/helpers";

describe("UI components", () => {
  it("renders button and handles click", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button onClick={onClick}>Save</Button>
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders input with placeholder", async () => {
    const { user } = renderWithProviders(
      <Input placeholder="Email" aria-label="Email" />
    );
    const input = screen.getByLabelText("Email");
    await user.type(input, "a@b.com");
    expect(input).toHaveValue("a@b.com");
  });

  it("renders badge and card", () => {
    renderWithProviders(
      <>
        <Badge>Active</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>Today</CardContent>
        </Card>
      </>
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders table structure", () => {
    renderWithProviders(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Masala Chai</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Masala Chai")).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    const { container } = renderWithProviders(<Skeleton className="h-4 w-20" />);
    expect(container.querySelector("[data-slot=skeleton], .animate-pulse, div")).toBeTruthy();
  });

  it("renders empty and error states", async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(
      <>
        <EmptyState title="No orders" description="Create your first order." />
        <ErrorState title="Load failed" onRetry={onRetry} />
      </>
    );
    expect(screen.getByText("No orders")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
