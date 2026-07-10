import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="aurora-canvas flex min-h-screen items-center justify-center bg-background">
      <SignIn />
    </div>
  );
}
