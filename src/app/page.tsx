import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import {
  DEFAULT_AUTHENTICATED_REDIRECT,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
} from "@/lib/auth/constants";

export default async function HomePage() {
  const session = await auth();
  redirect(
    session?.user
      ? DEFAULT_AUTHENTICATED_REDIRECT
      : DEFAULT_UNAUTHENTICATED_REDIRECT
  );
}
